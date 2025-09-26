import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger.js';

const prisma = new PrismaClient();

export const getAllLeases = async (req: Request, res: Response) => {
  try {
    const { status, tenant_id, local_id } = req.query;
    
    const where: any = {};
    
    if (status) {
      where.status = status;
    }
    
    if (tenant_id) {
      where.tenant_id = tenant_id;
    }
    
    if (local_id) {
      where.local_id = local_id;
    }

    const leases = await prisma.lease.findMany({
      where,
      include: {
        tenant: true,
        local: {
          include: {
            property: true
          }
        },
        payments: {
          include: {
            payment_mode: true
          },
          orderBy: { paid_at: 'desc' }
        }
      },
      orderBy: { start_date: 'desc' }
    });

    res.json(leases);
  } catch (error: any) {
    logger.error('Error fetching leases:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getLeaseById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const lease = await prisma.lease.findUnique({
      where: { id },
      include: {
        tenant: true,
        local: {
          include: {
            property: true
          }
        },
        payments: {
          include: {
            payment_mode: true
          },
          orderBy: { paid_at: 'desc' }
        },
        documents: true
      }
    });

    if (!lease) {
      return res.status(404).json({ message: 'Lease not found' });
    }

    res.json(lease);
  } catch (error: any) {
    logger.error('Error fetching lease:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const createLease = async (req: Request, res: Response) => {
  try {
    const { 
      tenant_id, 
      local_id, 
      lease_reference, 
      start_date, 
      end_date, 
      rent_amount, 
      billing_cycle 
    } = req.body;
    
    // Check if tenant exists
    const tenant = await prisma.tenant.findUnique({ where: { id: tenant_id } });
    if (!tenant) {
      return res.status(404).json({ message: 'Tenant not found' });
    }

    // Check if local exists and is available
    const local = await prisma.local.findUnique({ 
      where: { id: local_id },
      include: { leases: { where: { status: 'ACTIVE' } } }
    });
    if (!local) {
      return res.status(404).json({ message: 'Local not found' });
    }
    if (local.status !== 'AVAILABLE') {
      return res.status(400).json({ message: 'Local is not available' });
    }
    if (local.leases.length > 0) {
      return res.status(400).json({ message: 'Local is already leased' });
    }

    // Check if lease reference is unique
    const existingLease = await prisma.lease.findUnique({ 
      where: { lease_reference } 
    });
    if (existingLease) {
      return res.status(400).json({ message: 'Lease reference already exists' });
    }

    const lease = await prisma.lease.create({
      data: {
        tenant_id,
        local_id,
        lease_reference,
        start_date: new Date(start_date),
        end_date: end_date ? new Date(end_date) : null,
        rent_amount,
        billing_cycle,
        status: 'ACTIVE',
      },
      include: {
        tenant: true,
        local: {
          include: {
            property: true
          }
        }
      }
    });

    // Update local status to occupied
    await prisma.local.update({
      where: { id: local_id },
      data: { status: 'OCCUPIED' }
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        user_id: req.user!.id,
        action: 'CREATE',
        entity_table: 'Lease',
        entity_id: lease.id,
        new_data: lease,
        ip_address: req.ip,
      },
    });

    logger.info(`Lease created: ${lease.lease_reference} by ${req.user!.email}`);
    res.status(201).json(lease);
  } catch (error: any) {
    logger.error('Error creating lease:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateLease = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { 
      lease_reference, 
      start_date, 
      end_date, 
      rent_amount, 
      billing_cycle, 
      status 
    } = req.body;

    const existingLease = await prisma.lease.findUnique({ where: { id } });
    if (!existingLease) {
      return res.status(404).json({ message: 'Lease not found' });
    }

    // Check if new lease reference conflicts with existing ones
    if (lease_reference && lease_reference !== existingLease.lease_reference) {
      const conflictLease = await prisma.lease.findUnique({ 
        where: { lease_reference } 
      });
      if (conflictLease) {
        return res.status(400).json({ message: 'Lease reference already exists' });
      }
    }

    const lease = await prisma.lease.update({
      where: { id },
      data: {
        lease_reference,
        start_date: start_date ? new Date(start_date) : undefined,
        end_date: end_date ? new Date(end_date) : undefined,
        rent_amount,
        billing_cycle,
        status,
      },
      include: {
        tenant: true,
        local: {
          include: {
            property: true
          }
        }
      }
    });

    // Update local status based on lease status
    if (status === 'TERMINATED') {
      await prisma.local.update({
        where: { id: lease.local_id },
        data: { status: 'AVAILABLE' }
      });
    }

    // Log audit
    await prisma.auditLog.create({
      data: {
        user_id: req.user!.id,
        action: 'UPDATE',
        entity_table: 'Lease',
        entity_id: lease.id,
        old_data: existingLease,
        new_data: lease,
        ip_address: req.ip,
      },
    });

    logger.info(`Lease updated: ${lease.lease_reference} by ${req.user!.email}`);
    res.json(lease);
  } catch (error: any) {
    logger.error('Error updating lease:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const terminateLease = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { termination_date } = req.body;

    const existingLease = await prisma.lease.findUnique({ where: { id } });
    if (!existingLease) {
      return res.status(404).json({ message: 'Lease not found' });
    }

    if (existingLease.status === 'TERMINATED') {
      return res.status(400).json({ message: 'Lease is already terminated' });
    }

    const lease = await prisma.lease.update({
      where: { id },
      data: {
        status: 'TERMINATED',
        end_date: termination_date ? new Date(termination_date) : new Date(),
      },
      include: {
        tenant: true,
        local: {
          include: {
            property: true
          }
        }
      }
    });

    // Update local status to available
    await prisma.local.update({
      where: { id: lease.local_id },
      data: { status: 'AVAILABLE' }
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        user_id: req.user!.id,
        action: 'TERMINATE',
        entity_table: 'Lease',
        entity_id: lease.id,
        old_data: existingLease,
        new_data: lease,
        ip_address: req.ip,
      },
    });

    logger.info(`Lease terminated: ${lease.lease_reference} by ${req.user!.email}`);
    res.json(lease);
  } catch (error: any) {
    logger.error('Error terminating lease:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
