import { Router } from 'express';
import {
  getAllLeases,
  getLeaseById,
  createLease,
  updateLease,
  terminateLease
} from '../controllers/lease.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validation.middleware.js';
import Joi from 'joi';

const router = Router();

// Validation schemas
const leaseSchema = Joi.object({
  tenant_id: Joi.string().uuid().required(),
  local_id: Joi.string().uuid().required(),
  lease_reference: Joi.string().min(2).required(),
  start_date: Joi.date().required(),
  end_date: Joi.date().optional(),
  rent_amount: Joi.number().positive().required(),
  billing_cycle: Joi.string().valid('MONTHLY', 'QUARTERLY').required(),
});

const terminateLeaseSchema = Joi.object({
  termination_date: Joi.date().optional(),
});

/**
 * @swagger
 * components:
 *   schemas:
 *     Lease:
 *       type: object
 *       required:
 *         - tenant_id
 *         - local_id
 *         - lease_reference
 *         - start_date
 *         - rent_amount
 *         - billing_cycle
 *       properties:
 *         id:
 *           type: string
 *         tenant_id:
 *           type: string
 *         local_id:
 *           type: string
 *         lease_reference:
 *           type: string
 *         start_date:
 *           type: string
 *           format: date-time
 *         end_date:
 *           type: string
 *           format: date-time
 *         rent_amount:
 *           type: number
 *         billing_cycle:
 *           type: string
 *           enum: [MONTHLY, QUARTERLY]
 *         status:
 *           type: string
 *           enum: [ACTIVE, TERMINATED]
 *         tenant:
 *           $ref: '#/components/schemas/Tenant'
 *         local:
 *           $ref: '#/components/schemas/Local'
 *         payments:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Payment'
 */

/**
 * @swagger
 * /api/leases:
 *   get:
 *     summary: Get all leases
 *     tags: [Leases]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ACTIVE, TERMINATED]
 *         description: Filter by lease status
 *       - in: query
 *         name: tenant_id
 *         schema:
 *           type: string
 *         description: Filter by tenant ID
 *       - in: query
 *         name: local_id
 *         schema:
 *           type: string
 *         description: Filter by local ID
 *     responses:
 *       200:
 *         description: List of leases
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Lease'
 *   post:
 *     summary: Create a new lease
 *     tags: [Leases]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Lease'
 *     responses:
 *       201:
 *         description: Lease created successfully
 *       400:
 *         description: Validation error
 */
router.get('/', authenticate, getAllLeases);
router.post('/', authenticate, authorize(['ADMIN', 'MANAGER']), validate(leaseSchema), createLease);

/**
 * @swagger
 * /api/leases/{id}:
 *   get:
 *     summary: Get lease by ID
 *     tags: [Leases]
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
 *         description: Lease details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Lease'
 *       404:
 *         description: Lease not found
 *   put:
 *     summary: Update lease
 *     tags: [Leases]
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
 *             $ref: '#/components/schemas/Lease'
 *     responses:
 *       200:
 *         description: Lease updated successfully
 *       404:
 *         description: Lease not found
 */
router.get('/:id', authenticate, getLeaseById);
router.put('/:id', authenticate, authorize(['ADMIN', 'MANAGER']), validate(leaseSchema), updateLease);

/**
 * @swagger
 * /api/leases/{id}/terminate:
 *   post:
 *     summary: Terminate a lease
 *     tags: [Leases]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               termination_date:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Lease terminated successfully
 *       404:
 *         description: Lease not found
 */
router.post('/:id/terminate', authenticate, authorize(['ADMIN', 'MANAGER']), validate(terminateLeaseSchema), terminateLease);

export default router;

