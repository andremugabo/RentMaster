import { Router } from 'express';
import {
  getAllTenants,
  getTenantById,
  createTenant,
  updateTenant,
  deleteTenant
} from '../controllers/tenant.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validation.middleware.js';
import Joi from 'joi';

const router = Router();

// Validation schemas
const tenantSchema = Joi.object({
  name: Joi.string().min(2).required(),
  type: Joi.string().valid('INDIVIDUAL', 'COMPANY').required(),
  email: Joi.string().email().optional(),
  phone: Joi.string().optional(),
});

/**
 * @swagger
 * components:
 *   schemas:
 *     Tenant:
 *       type: object
 *       required:
 *         - name
 *         - type
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *         type:
 *           type: string
 *           enum: [INDIVIDUAL, COMPANY]
 *         email:
 *           type: string
 *           format: email
 *         phone:
 *           type: string
 *         created_at:
 *           type: string
 *           format: date-time
 *         leases:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Lease'
 */

/**
 * @swagger
 * /api/tenants:
 *   get:
 *     summary: Get all tenants
 *     tags: [Tenants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name, email, or phone
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [INDIVIDUAL, COMPANY]
 *         description: Filter by tenant type
 *     responses:
 *       200:
 *         description: List of tenants
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Tenant'
 *   post:
 *     summary: Create a new tenant
 *     tags: [Tenants]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Tenant'
 *     responses:
 *       201:
 *         description: Tenant created successfully
 *       400:
 *         description: Validation error
 */
router.get('/', authenticate, getAllTenants);
router.post('/', authenticate, authorize(['ADMIN', 'MANAGER']), validate(tenantSchema), createTenant);

/**
 * @swagger
 * /api/tenants/{id}:
 *   get:
 *     summary: Get tenant by ID
 *     tags: [Tenants]
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
 *         description: Tenant details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Tenant'
 *       404:
 *         description: Tenant not found
 *   put:
 *     summary: Update tenant
 *     tags: [Tenants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Tenant'
 *     responses:
 *       200:
 *         description: Tenant updated successfully
 *       404:
 *         description: Tenant not found
 *   delete:
 *     summary: Delete tenant
 *     tags: [Tenants]
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
 *         description: Tenant deleted successfully
 *       404:
 *         description: Tenant not found
 */
router.get('/:id', authenticate, getTenantById);
router.put('/:id', authenticate, authorize(['ADMIN', 'MANAGER']), validate(tenantSchema), updateTenant);
router.delete('/:id', authenticate, authorize(['ADMIN']), deleteTenant);

export default router;
