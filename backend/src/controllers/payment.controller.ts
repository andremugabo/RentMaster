import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger.js';

const prisma = new PrismaClient();

export const getAllPayments = async (req: Request, res: Response) => {
  try {
    const { lease_id, status, payment_mode_id, start_date, end_date } = req.query;
    
    const where: any = {};
    
    if (lease_id) {
      where.lease_id = lease_id;
    }
    
    if (status) {
      where.status = status;
    }
    
    if (payment_mode_id) {
      where.payment_mode_id = payment_mode_id;
    }
    
    if (start_date || end_date) {
      where.paid_at = {};
      if (start_date) {
        where.paid_at.gte = new Date(start_date as string);
      }
      if (end_date) {
        where.paid_at.lte = new Date(end_date as string);
      }
    }

    const payments = await prisma.payment.findMany({
      where,
      include: {
        lease: {
          include: {
            tenant: true,
            local: {
              include: {
                property: true
              }
            }
          }
        },
        payment_mode: true,
        documents: true
      },
      orderBy: { paid_at: 'desc' }
    });

    res.json(payments);
  } catch (error: any) {
    logger.error('Error fetching payments:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getPaymentById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const payment = await prisma.payment.findUnique({
      where: { id },
      include: {
        lease: {
          include: {
            tenant: true,
            local: {
              include: {
                property: true
              }
            }
          }
        },
        payment_mode: true,
        documents: true
      }
    });

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    res.json(payment);
  } catch (error: any) {
    logger.error('Error fetching payment:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const createPayment = async (req: Request, res: Response) => {
  try {
    const { 
      lease_id, 
      amount, 
      payment_mode_id, 
      reference, 
      status = 'COMPLETED' 
    } = req.body;
    
    // Check if lease exists
    const lease = await prisma.lease.findUnique({ where: { id: lease_id } });
    if (!lease) {
      return res.status(404).json({ message: 'Lease not found' });
    }

    // Check if payment mode exists
    const paymentMode = await prisma.paymentMode.findUnique({ 
      where: { id: payment_mode_id } 
    });
    if (!paymentMode) {
      return res.status(404).json({ message: 'Payment mode not found' });
    }

    const payment = await prisma.payment.create({
      data: {
        lease_id,
        amount,
        payment_mode_id,
        reference,
        status,
        paid_at: new Date(),
      },
      include: {
        lease: {
          include: {
            tenant: true,
            local: {
              include: {
                property: true
              }
            }
          }
        },
        payment_mode: true
      }
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        user_id: req.user!.id,
        action: 'CREATE',
        entity_table: 'Payment',
        entity_id: payment.id,
        new_data: payment,
        ip_address: req.ip,
      },
    });

    logger.info(`Payment created: ${payment.id} by ${req.user!.email}`);
    res.status(201).json(payment);
  } catch (error: any) {
    logger.error('Error creating payment:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updatePayment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { amount, payment_mode_id, reference, status } = req.body;

    const existingPayment = await prisma.payment.findUnique({ where: { id } });
    if (!existingPayment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    const payment = await prisma.payment.update({
      where: { id },
      data: {
        amount,
        payment_mode_id,
        reference,
        status,
      },
      include: {
        lease: {
          include: {
            tenant: true,
            local: {
              include: {
                property: true
              }
            }
          }
        },
        payment_mode: true
      }
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        user_id: req.user!.id,
        action: 'UPDATE',
        entity_table: 'Payment',
        entity_id: payment.id,
        old_data: existingPayment,
        new_data: payment,
        ip_address: req.ip,
      },
    });

    logger.info(`Payment updated: ${payment.id} by ${req.user!.email}`);
    res.json(payment);
  } catch (error: any) {
    logger.error('Error updating payment:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const deletePayment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const existingPayment = await prisma.payment.findUnique({ 
      where: { id },
      include: { documents: true }
    });
    
    if (!existingPayment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    await prisma.payment.delete({ where: { id } });

    // Log audit
    await prisma.auditLog.create({
      data: {
        user_id: req.user!.id,
        action: 'DELETE',
        entity_table: 'Payment',
        entity_id: id,
        old_data: existingPayment,
        ip_address: req.ip,
      },
    });

    logger.info(`Payment deleted: ${id} by ${req.user!.email}`);
    res.status(204).send();
  } catch (error: any) {
    logger.error('Error deleting payment:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getPaymentModes = async (req: Request, res: Response) => {
  try {
    const paymentModes = await prisma.paymentMode.findMany({
      orderBy: { display_name: 'asc' }
    });

    res.json(paymentModes);
  } catch (error: any) {
    logger.error('Error fetching payment modes:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
