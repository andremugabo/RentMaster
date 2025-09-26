import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger.js';

const prisma = new PrismaClient();

export const getAllProperties = async (req: Request, res: Response) => {
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
      },
      orderBy: { created_at: 'desc' }
    });

    res.json(properties);
  } catch (error) {
    logger.error('Error fetching properties:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getPropertyById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const property = await prisma.property.findUnique({
      where: { id },
      include: {
        locals: {
          include: {
            leases: {
              include: { tenant: true }
            }
          }
        }
      }
    });

    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    res.json(property);
  } catch (error) {
    logger.error('Error fetching property:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const createProperty = async (req: Request, res: Response) => {
  try {
    const { name, location, description } = req.body;
    
    const property = await prisma.property.create({
      data: {
        name,
        location,
        description,
      },
      include: {
        locals: true
      }
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        user_id: req.user!.id,
        action: 'CREATE',
        entity_table: 'Property',
        entity_id: property.id,
        new_data: property,
        ip_address: req.ip,
      },
    });

    logger.info(`Property created: ${property.name} by ${req.user!.email}`);
    res.status(201).json(property);
  } catch (error) {
    logger.error('Error creating property:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateProperty = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, location, description } = req.body;

    const existingProperty = await prisma.property.findUnique({ where: { id } });
    if (!existingProperty) {
      return res.status(404).json({ message: 'Property not found' });
    }

    const property = await prisma.property.update({
      where: { id },
      data: {
        name,
        location,
        description,
      },
      include: {
        locals: true
      }
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        user_id: req.user!.id,
        action: 'UPDATE',
        entity_table: 'Property',
        entity_id: property.id,
        old_data: existingProperty,
        new_data: property,
        ip_address: req.ip,
      },
    });

    logger.info(`Property updated: ${property.name} by ${req.user!.email}`);
    res.json(property);
  } catch (error) {
    logger.error('Error updating property:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteProperty = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const existingProperty = await prisma.property.findUnique({ 
      where: { id },
      include: { locals: true }
    });
    
    if (!existingProperty) {
      return res.status(404).json({ message: 'Property not found' });
    }

    if (existingProperty.locals.length > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete property with existing locals' 
      });
    }

    await prisma.property.delete({ where: { id } });

    // Log audit
    await prisma.auditLog.create({
      data: {
        user_id: req.user!.id,
        action: 'DELETE',
        entity_table: 'Property',
        entity_id: id,
        old_data: existingProperty,
        ip_address: req.ip,
      },
    });

    logger.info(`Property deleted: ${existingProperty.name} by ${req.user!.email}`);
    res.status(204).send();
  } catch (error) {
    logger.error('Error deleting property:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const createLocal = async (req: Request, res: Response) => {
  try {
    const { propertyId } = req.params;
    const { reference_code, floor, unit_type, size_m2, status } = req.body;

    // Check if property exists
    const property = await prisma.property.findUnique({ where: { id: propertyId } });
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    // Check if reference code already exists
    const existingLocal = await prisma.local.findUnique({ 
      where: { reference_code } 
    });
    if (existingLocal) {
      return res.status(400).json({ message: 'Reference code already exists' });
    }

    const local = await prisma.local.create({
      data: {
        property_id: propertyId,
        reference_code,
        floor,
        unit_type,
        size_m2,
        status: status || 'AVAILABLE',
      }
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        user_id: req.user!.id,
        action: 'CREATE',
        entity_table: 'Local',
        entity_id: local.id,
        new_data: local,
        ip_address: req.ip,
      },
    });

    logger.info(`Local created: ${local.reference_code} by ${req.user!.email}`);
    res.status(201).json(local);
  } catch (error) {
    logger.error('Error creating local:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateLocal = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reference_code, floor, unit_type, size_m2, status } = req.body;

    const existingLocal = await prisma.local.findUnique({ where: { id } });
    if (!existingLocal) {
      return res.status(404).json({ message: 'Local not found' });
    }

    // Check if new reference code conflicts with existing ones
    if (reference_code && reference_code !== existingLocal.reference_code) {
      const conflictLocal = await prisma.local.findUnique({ 
        where: { reference_code } 
      });
      if (conflictLocal) {
        return res.status(400).json({ message: 'Reference code already exists' });
      }
    }

    const local = await prisma.local.update({
      where: { id },
      data: {
        reference_code,
        floor,
        unit_type,
        size_m2,
        status,
      }
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        user_id: req.user!.id,
        action: 'UPDATE',
        entity_table: 'Local',
        entity_id: local.id,
        old_data: existingLocal,
        new_data: local,
        ip_address: req.ip,
      },
    });

    logger.info(`Local updated: ${local.reference_code} by ${req.user!.email}`);
    res.json(local);
  } catch (error) {
    logger.error('Error updating local:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteLocal = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const existingLocal = await prisma.local.findUnique({ 
      where: { id },
      include: { leases: true }
    });
    
    if (!existingLocal) {
      return res.status(404).json({ message: 'Local not found' });
    }

    if (existingLocal.leases.length > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete local with existing leases' 
      });
    }

    await prisma.local.delete({ where: { id } });

    // Log audit
    await prisma.auditLog.create({
      data: {
        user_id: req.user!.id,
        action: 'DELETE',
        entity_table: 'Local',
        entity_id: id,
        old_data: existingLocal,
        ip_address: req.ip,
      },
    });

    logger.info(`Local deleted: ${existingLocal.reference_code} by ${req.user!.email}`);
    res.status(204).send();
  } catch (error) {
    logger.error('Error deleting local:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

