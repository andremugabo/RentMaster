import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const prisma = new PrismaClient();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/documents';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images, PDFs, and documents are allowed'));
    }
  }
});

export const uploadMiddleware = upload.single('file');

export const uploadDocument = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const { owner_table, owner_id, doc_type } = req.body;

    if (!owner_table || !owner_id || !doc_type) {
      // Delete uploaded file if validation fails
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ 
        message: 'owner_table, owner_id, and doc_type are required' 
      });
    }

    // Validate owner_table
    if (!['LEASES', 'PAYMENTS'].includes(owner_table)) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ 
        message: 'owner_table must be either LEASES or PAYMENTS' 
      });
    }

    // Check if the owner exists
    if (owner_table === 'LEASES') {
      const lease = await prisma.lease.findUnique({ where: { id: owner_id } });
      if (!lease) {
        fs.unlinkSync(req.file.path);
        return res.status(404).json({ message: 'Lease not found' });
      }
    } else if (owner_table === 'PAYMENTS') {
      const payment = await prisma.payment.findUnique({ where: { id: owner_id } });
      if (!payment) {
        fs.unlinkSync(req.file.path);
        return res.status(404).json({ message: 'Payment not found' });
      }
    }

    const document = await prisma.document.create({
      data: {
        owner_table: owner_table as 'LEASES' | 'PAYMENTS',
        owner_id,
        file_key: req.file.filename,
        filename: req.file.originalname,
        doc_type,
        uploaded_by: req.user!.id,
      }
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        user_id: req.user!.id,
        action: 'CREATE',
        entity_table: 'Document',
        entity_id: document.id,
        new_data: document,
        ip_address: req.ip,
      },
    });

    logger.info(`Document uploaded: ${document.filename} by ${req.user!.email}`);
    res.status(201).json({
      id: document.id,
      filename: document.filename,
      doc_type: document.doc_type,
      uploaded_at: document.uploaded_at,
      file_url: `/api/documents/${document.id}/download`
    });
  } catch (error: any) {
    logger.error('Error uploading document:', error);
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getDocuments = async (req: Request, res: Response) => {
  try {
    const { owner_table, owner_id } = req.query;
    
    const where: any = {};
    
    if (owner_table) {
      where.owner_table = owner_table;
    }
    
    if (owner_id) {
      where.owner_id = owner_id;
    }

    const documents = await prisma.document.findMany({
      where,
      include: {
        uploaded_user: {
          select: {
            id: true,
            full_name: true,
            email: true
          }
        }
      },
      orderBy: { uploaded_at: 'desc' }
    });

    const documentsWithUrls = documents.map(doc => ({
      ...doc,
      file_url: `/api/documents/${doc.id}/download`
    }));

    res.json(documentsWithUrls);
  } catch (error: any) {
    logger.error('Error fetching documents:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getDocumentById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const document = await prisma.document.findUnique({
      where: { id },
      include: {
        uploaded_user: {
          select: {
            id: true,
            full_name: true,
            email: true
          }
        }
      }
    });

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    res.json({
      ...document,
      file_url: `/api/documents/${document.id}/download`
    });
  } catch (error: any) {
    logger.error('Error fetching document:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const downloadDocument = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const document = await prisma.document.findUnique({ where: { id } });

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    const filePath = path.join('uploads/documents', document.file_key);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found on disk' });
    }

    res.download(filePath, document.filename);
  } catch (error: any) {
    logger.error('Error downloading document:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteDocument = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const existingDocument = await prisma.document.findUnique({ where: { id } });
    if (!existingDocument) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Delete file from disk
    const filePath = path.join('uploads/documents', existingDocument.file_key);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await prisma.document.delete({ where: { id } });

    // Log audit
    await prisma.auditLog.create({
      data: {
        user_id: req.user!.id,
        action: 'DELETE',
        entity_table: 'Document',
        entity_id: id,
        old_data: existingDocument,
        ip_address: req.ip,
      },
    });

    logger.info(`Document deleted: ${existingDocument.filename} by ${req.user!.email}`);
    res.status(204).send();
  } catch (error: any) {
    logger.error('Error deleting document:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
