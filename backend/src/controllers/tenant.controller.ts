import { Request, Response } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';
import { logger } from '../utils/logger.js';

const prisma = new PrismaClient();

export const getAllTenants = async (req: Request, res: Response) => {
  try {
    const { search, type } = req.query;
    
    const where: Prisma.TenantWhereInput = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
        { phone: { contains: search as string, mode: 'insensitive' } }
      ];
    }
    
    if (type) {
      where.type = type;
    }

    const tenants = await prisma.tenant.findMany({
      where,
      include: {
        leases: {
          include: {
            local: {
              include: {
                property: true
              }
            }
          }
        }
      },
      orderBy: { created_at: 'desc' }
    });

    res.json(tenants);
  } catch (error) {
    logger.error('Error fetching tenants:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getTenantById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const tenant = await prisma.tenant.findUnique({
      where: { id },
      include: {
        leases: {
          include: {
            local: {
              include: {
                property: true
              }
            },
            payments: {
              include: {
                payment_mode: true
              }
            }
          }
        }
      }
    });

    if (!tenant) {
      return res.status(404).json({ message: 'Tenant not found' });
    }

    res.json(tenant);
  } catch (error) {
    logger.error('Error fetching tenant:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const createTenant = async (req: Request, res: Response) => {
  try {
    const { name, type, email, phone } = req.body;
    
    const tenant = await prisma.tenant.create({
      data: {
        name,
        type,
        email,
        phone,
      },
      include: {
        leases: true
      }
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        user_id: req.user!.id,
        action: 'CREATE',
        entity_table: 'Tenant',
        entity_id: tenant.id,
        new_data: tenant,
        ip_address: req.ip,
      },
    });

    logger.info(`Tenant created: ${tenant.name} by ${req.user!.email}`);
    res.status(201).json(tenant);
  } catch (error) {
    logger.error('Error creating tenant:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateTenant = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, type, email, phone } = req.body;

    const existingTenant = await prisma.tenant.findUnique({ where: { id } });
    if (!existingTenant) {
      return res.status(404).json({ message: 'Tenant not found' });
    }

    const tenant = await prisma.tenant.update({
      where: { id },
      data: {
        name,
        type,
        email,
        phone,
      },
      include: {
        leases: true
      }
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        user_id: req.user!.id,
        action: 'UPDATE',
        entity_table: 'Tenant',
        entity_id: tenant.id,
        old_data: existingTenant,
        new_data: tenant,
        ip_address: req.ip,
      },
    });

    logger.info(`Tenant updated: ${tenant.name} by ${req.user!.email}`);
    res.json(tenant);
  } catch (error) {
    logger.error('Error updating tenant:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteTenant = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const existingTenant = await prisma.tenant.findUnique({ 
      where: { id },
      include: { leases: true }
    });
    
    if (!existingTenant) {
      return res.status(404).json({ message: 'Tenant not found' });
    }

    if (existingTenant.leases.length > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete tenant with existing leases' 
      });
    }

    await prisma.tenant.delete({ where: { id } });

    // Log audit
    await prisma.auditLog.create({
      data: {
        user_id: req.user!.id,
        action: 'DELETE',
        entity_table: 'Tenant',
        entity_id: id,
        old_data: existingTenant,
        ip_address: req.ip,
      },
    });

    logger.info(`Tenant deleted: ${existingTenant.name} by ${req.user!.email}`);
    res.status(204).send();
  } catch (error) {
    logger.error('Error deleting tenant:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

