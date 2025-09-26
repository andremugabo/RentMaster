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
    const { start_date, end_date, group_by = 'month' } = req.query;

    const startDate = start_date ? new Date(start_date as string) : new Date(new Date().getFullYear(), 0, 1);
    const endDate = end_date ? new Date(end_date as string) : new Date();

    const groupByFields = group_by === 'day' ? ['year', 'month', 'day'] as const : ['year', 'month'] as const;

    const revenueData = await prisma.$queryRawUnsafe<Array<{ year: number; month: number; day?: number; amount: number; count: number }>>(`
      SELECT 
        EXTRACT(YEAR FROM paid_at)::int AS year,
        EXTRACT(MONTH FROM paid_at)::int AS month,
        ${group_by === 'day' ? 'EXTRACT(DAY FROM paid_at)::int AS day,' : ''}
        COALESCE(SUM(amount), 0) AS amount,
        COUNT(id) AS count
      FROM "Payment"
      WHERE status = 'COMPLETED'
        AND paid_at >= $1
        AND paid_at <= $2
      GROUP BY 1,2${group_by === 'day' ? ',3' : ''}
      ORDER BY 1 ASC, 2 ASC${group_by === 'day' ? ', 3 ASC' : ''}
    `, startDate, endDate);
      where: {
        status: 'COMPLETED',
        paid_at: {
          gte: startDate,
          lte: endDate
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

    // Get revenue by payment mode
    const revenueByPaymentMode = await prisma.payment.groupBy({
      by: ['payment_mode_id'],
      where: {
        status: 'COMPLETED',
        paid_at: {
          gte: startDate,
          lte: endDate
        }
      },
      _sum: {
        amount: true
      },
      _count: {
        id: true
      }
    });

    // Get payment modes for display names
    const paymentModes = await prisma.paymentMode.findMany();
    const paymentModeMap = paymentModes.reduce((acc, mode) => {
      acc[mode.id] = mode.display_name;
      return acc;
    }, {} as Record<string, string>);

    res.json({
      revenueData: revenueData.map(item => ({
        period: group_by === 'month' 
          ? `${item.year}-${String(item.month).padStart(2, '0')}`
          : `${item.year}-${String(item.month).padStart(2, '0')}-${String((item.day ?? 1)).padStart(2, '0')}`,
        amount: item.amount || 0,
        count: item.count
      })),
      revenueByPaymentMode: revenueByPaymentMode.map(item => ({
        payment_mode: paymentModeMap[item.payment_mode_id] || 'Unknown',
        amount: item._sum.amount || 0,
        count: item._count.id
      })),
      totalRevenue: revenueData.reduce((sum, item) => sum + (item.amount || 0), 0),
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

