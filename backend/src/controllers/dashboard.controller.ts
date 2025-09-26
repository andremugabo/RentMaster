import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger.js';

const prisma = new PrismaClient();

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const [
      totalProperties,
      totalLocals,
      availableLocals,
      occupiedLocals,
      totalTenants,
      activeLeases,
      totalPayments,
      monthlyRevenue,
      overduePayments
    ] = await Promise.all([
      // Total properties
      prisma.property.count(),
      
      // Total locals
      prisma.local.count(),
      
      // Available locals
      prisma.local.count({ where: { status: 'AVAILABLE' } }),
      
      // Occupied locals
      prisma.local.count({ where: { status: 'OCCUPIED' } }),
      
      // Total tenants
      prisma.tenant.count(),
      
      // Active leases
      prisma.lease.count({ where: { status: 'ACTIVE' } }),
      
      // Total payments
      prisma.payment.count(),
      
      // Monthly revenue (current month)
      prisma.payment.aggregate({
        where: {
          status: 'COMPLETED',
          paid_at: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
            lt: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1)
          }
        },
        _sum: { amount: true }
      }),
      
      // Overdue payments (payments that should have been made but haven't)
      prisma.payment.count({
        where: {
          status: 'PENDING',
          paid_at: {
            lt: new Date()
          }
        }
      })
    ]);

    // Calculate occupancy rate
    const occupancyRate = totalLocals > 0 ? (occupiedLocals / totalLocals) * 100 : 0;

    // Get recent activities
    const recentActivities = await prisma.auditLog.findMany({
      take: 10,
      orderBy: { created_at: 'desc' },
      include: {
        user: {
          select: {
            full_name: true,
            email: true
          }
        }
      }
    });

    // Get payment trends for the last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const paymentTrends = await prisma.payment.groupBy({
      by: ['paid_at'],
      where: {
        status: 'COMPLETED',
        paid_at: {
          gte: sixMonthsAgo
        }
      },
      _sum: {
        amount: true
      },
      _count: {
        id: true
      },
      orderBy: {
        paid_at: 'asc'
      }
    });

    // Get top performing properties
    const topProperties = await prisma.property.findMany({
      include: {
        locals: {
          include: {
            leases: {
              include: {
                payments: {
                  where: {
                    status: 'COMPLETED',
                    paid_at: {
                      gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    const propertiesWithRevenue = topProperties.map(property => {
      const totalRevenue = property.locals.reduce((sum, local) => {
        return sum + local.leases.reduce((leaseSum, lease) => {
          return leaseSum + lease.payments.reduce((paymentSum, payment) => {
            return paymentSum + payment.amount;
          }, 0);
        }, 0);
      }, 0);

      return {
        id: property.id,
        name: property.name,
        location: property.location,
        totalRevenue,
        localsCount: property.locals.length,
        occupiedLocals: property.locals.filter(local => local.status === 'OCCUPIED').length
      };
    }).sort((a, b) => b.totalRevenue - a.totalRevenue).slice(0, 5);

    res.json({
      stats: {
        totalProperties,
        totalLocals,
        availableLocals,
        occupiedLocals,
        totalTenants,
        activeLeases,
        totalPayments,
        monthlyRevenue: monthlyRevenue._sum.amount || 0,
        overduePayments,
        occupancyRate: Math.round(occupancyRate * 100) / 100
      },
      recentActivities: recentActivities.map(activity => ({
        id: activity.id,
        action: activity.action,
        entity_table: activity.entity_table,
        entity_id: activity.entity_id,
        user: activity.user,
        created_at: activity.created_at
      })),
      paymentTrends: paymentTrends.map(trend => ({
        date: trend.paid_at,
        amount: trend._sum.amount || 0,
        count: trend._count.id
      })),
      topProperties
    });
  } catch (error) {
    logger.error('Error fetching dashboard stats:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getRevenueReport = async (req: Request, res: Response) => {
  try {
    const { start_date, end_date, group_by = 'month' } = req.query as {
      start_date?: string;
      end_date?: string;
      group_by?: 'day' | 'month';
    };

    const startDate = start_date ? new Date(start_date) : new Date(new Date().getFullYear(), 0, 1);
    const endDate = end_date ? new Date(end_date) : new Date();

    // Fetch completed payments in range and aggregate in JS for portability across DBs
    const completedPayments = await prisma.payment.findMany({
      where: {
        status: 'COMPLETED',
        paid_at: {
          gte: startDate,
          lte: endDate
        }
      },
      select: {
        id: true,
        amount: true,
        paid_at: true,
        payment_mode_id: true
      },
      orderBy: { paid_at: 'asc' }
    });

    // Group by month or day
    const revenueBucketMap = new Map<string, { amount: number; count: number }>();
    for (const p of completedPayments) {
      const d = p.paid_at as Date;
      const key = group_by === 'day'
        ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
        : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const curr = revenueBucketMap.get(key) || { amount: 0, count: 0 };
      curr.amount += Number(p.amount) || 0;
      curr.count += 1;
      revenueBucketMap.set(key, curr);
    }

    const revenueData = Array.from(revenueBucketMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([period, data]) => ({ period, amount: data.amount, count: data.count }));

    // Revenue by payment mode
    const paymentModeAgg = new Map<string, { amount: number; count: number }>();
    for (const p of completedPayments) {
      const key = p.payment_mode_id ?? 'unknown';
      const curr = paymentModeAgg.get(key) || { amount: 0, count: 0 };
      curr.amount += Number(p.amount) || 0;
      curr.count += 1;
      paymentModeAgg.set(key, curr);
    }

    const paymentModes = await prisma.paymentMode.findMany();
    const paymentModeMap = paymentModes.reduce((acc, mode) => {
      acc[mode.id] = mode.display_name;
      return acc;
    }, {} as Record<string, string>);

    const revenueByPaymentMode = Array.from(paymentModeAgg.entries()).map(([modeId, data]) => ({
      payment_mode: paymentModeMap[modeId] || 'Unknown',
      amount: data.amount,
      count: data.count
    }));

    res.json({
      revenueData,
      revenueByPaymentMode,
      totalRevenue: revenueData.reduce((sum, item) => sum + item.amount, 0),
      totalTransactions: revenueData.reduce((sum, item) => sum + item.count, 0)
    });
  } catch (error) {
    logger.error('Error fetching revenue report:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getOccupancyReport = async (req: Request, res: Response) => {
  try {
    const properties = await prisma.property.findMany({
      include: {
        locals: {
          include: {
            leases: {
              where: { status: 'ACTIVE' },
              include: { tenant: true }
            }
          }
        }
      }
    });

    const occupancyData = properties.map(property => {
      const totalLocals = property.locals.length;
      const occupiedLocals = property.locals.filter(local => local.status === 'OCCUPIED').length;
      const availableLocals = property.locals.filter(local => local.status === 'AVAILABLE').length;
      const maintenanceLocals = property.locals.filter(local => local.status === 'MAINTENANCE').length;
      
      const occupancyRate = totalLocals > 0 ? (occupiedLocals / totalLocals) * 100 : 0;

      return {
        propertyId: property.id,
        propertyName: property.name,
        location: property.location,
        totalLocals,
        occupiedLocals,
        availableLocals,
        maintenanceLocals,
        occupancyRate: Math.round(occupancyRate * 100) / 100,
        activeLeases: property.locals.reduce((sum, local) => sum + local.leases.length, 0)
      };
    });

    const overallStats = {
      totalProperties: properties.length,
      totalLocals: occupancyData.reduce((sum, prop) => sum + prop.totalLocals, 0),
      totalOccupied: occupancyData.reduce((sum, prop) => sum + prop.occupiedLocals, 0),
      totalAvailable: occupancyData.reduce((sum, prop) => sum + prop.availableLocals, 0),
      totalMaintenance: occupancyData.reduce((sum, prop) => sum + prop.maintenanceLocals, 0),
      overallOccupancyRate: 0
    };

    overallStats.overallOccupancyRate = overallStats.totalLocals > 0 
      ? Math.round((overallStats.totalOccupied / overallStats.totalLocals) * 10000) / 100
      : 0;

    res.json({
      properties: occupancyData,
      overallStats
    });
  } catch (error) {
    logger.error('Error fetching occupancy report:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

