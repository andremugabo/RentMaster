import { Router } from 'express';
import {
  uploadDocument,
  uploadMiddleware,
  getDocuments,
  getDocumentById,
  downloadDocument,
  deleteDocument
} from '../controllers/document.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validation.middleware.js';
import Joi from 'joi';

const router = Router();

// Validation schemas
const documentUploadSchema = Joi.object({
  owner_table: Joi.string().valid('LEASES', 'PAYMENTS').required(),
  owner_id: Joi.string().uuid().required(),
  doc_type: Joi.string().min(2).required(),
});

/**
 * @swagger
 * components:
 *   schemas:
 *     Document:
 *       type: object
 *       required:
 *         - owner_table
 *         - owner_id
 *         - doc_type
 *       properties:
 *         id:
 *           type: string
 *         owner_table:
 *           type: string
 *           enum: [LEASES, PAYMENTS]
 *         owner_id:
 *           type: string
 *         file_key:
 *           type: string
 *         filename:
 *           type: string
 *         doc_type:
 *           type: string
 *         uploaded_by:
 *           type: string
 *         uploaded_at:
 *           type: string
 *           format: date-time
 *         file_url:
 *           type: string
 *         uploaded_user:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *             full_name:
 *               type: string
 *             email:
 *               type: string
 */

/**
 * @swagger
 * /api/documents:
 *   get:
 *     summary: Get all documents
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: owner_table
 *         schema:
 *           type: string
 *           enum: [LEASES, PAYMENTS]
 *         description: Filter by owner table
 *       - in: query
 *         name: owner_id
 *         schema:
 *           type: string
 *         description: Filter by owner ID
 *     responses:
 *       200:
 *         description: List of documents
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Document'
 *   post:
 *     summary: Upload a document
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *               - owner_table
 *               - owner_id
 *               - doc_type
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               owner_table:
 *                 type: string
 *                 enum: [LEASES, PAYMENTS]
 *               owner_id:
 *                 type: string
 *               doc_type:
 *                 type: string
 *     responses:
 *       201:
 *         description: Document uploaded successfully
 *       400:
 *         description: Validation error
 */
router.get('/', authenticate, getDocuments);
router.post('/', authenticate, authorize(['ADMIN', 'MANAGER']), uploadMiddleware, uploadDocument);

/**
 * @swagger
 * /api/documents/{id}:
 *   get:
 *     summary: Get document by ID
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Document details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Document'
 *       404:
 *         description: Document not found
 *   delete:
 *     summary: Delete document
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Document deleted successfully
 *       404:
 *         description: Document not found
 */
router.get('/:id', authenticate, getDocumentById);
router.delete('/:id', authenticate, authorize(['ADMIN', 'MANAGER']), deleteDocument);

/**
 * @swagger
 * /api/documents/{id}/download:
 *   get:
 *     summary: Download document
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: File download
 *         content:
 *           application/octet-stream:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Document not found
 */
router.get('/:id/download', authenticate, downloadDocument);

export default router;
