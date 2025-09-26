import { Router } from 'express';
import {
  getAllPayments,
  getPaymentById,
  createPayment,
  updatePayment,
  deletePayment,
  getPaymentModes
} from '../controllers/payment.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validation.middleware.js';
import Joi from 'joi';

const router = Router();

// Validation schemas
const paymentSchema = Joi.object({
  lease_id: Joi.string().uuid().required(),
  amount: Joi.number().positive().required(),
  payment_mode_id: Joi.string().uuid().required(),
  reference: Joi.string().optional(),
  status: Joi.string().valid('PENDING', 'COMPLETED').optional(),
});

/**
 * @swagger
 * components:
 *   schemas:
 *     Payment:
 *       type: object
 *       required:
 *         - lease_id
 *         - amount
 *         - payment_mode_id
 *       properties:
 *         id:
 *           type: string
 *         lease_id:
 *           type: string
 *         amount:
 *           type: number
 *         paid_at:
 *           type: string
 *           format: date-time
 *         payment_mode_id:
 *           type: string
 *         reference:
 *           type: string
 *         status:
 *           type: string
 *           enum: [PENDING, COMPLETED]
 *         lease:
 *           $ref: '#/components/schemas/Lease'
 *         payment_mode:
 *           $ref: '#/components/schemas/PaymentMode'
 *         documents:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Document'
 *     PaymentMode:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         code:
 *           type: string
 *         display_name:
 *           type: string
 *         requires_proof:
 *           type: boolean
 */

/**
 * @swagger
 * /api/payments:
 *   get:
 *     summary: Get all payments
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: lease_id
 *         schema:
 *           type: string
 *         description: Filter by lease ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, COMPLETED]
 *         description: Filter by payment status
 *       - in: query
 *         name: payment_mode_id
 *         schema:
 *           type: string
 *         description: Filter by payment mode ID
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter payments from this date
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter payments until this date
 *     responses:
 *       200:
 *         description: List of payments
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Payment'
 *   post:
 *     summary: Create a new payment
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Payment'
 *     responses:
 *       201:
 *         description: Payment created successfully
 *       400:
 *         description: Validation error
 */
router.get('/', authenticate, getAllPayments);
router.post('/', authenticate, authorize(['ADMIN', 'MANAGER']), validate(paymentSchema), createPayment);

/**
 * @swagger
 * /api/payments/modes:
 *   get:
 *     summary: Get all payment modes
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of payment modes
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/PaymentMode'
 */
router.get('/modes', authenticate, getPaymentModes);

/**
 * @swagger
 * /api/payments/{id}:
 *   get:
 *     summary: Get payment by ID
 *     tags: [Payments]
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
 *         description: Payment details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Payment'
 *       404:
 *         description: Payment not found
 *   put:
 *     summary: Update payment
 *     tags: [Payments]
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
 *             $ref: '#/components/schemas/Payment'
 *     responses:
 *       200:
 *         description: Payment updated successfully
 *       404:
 *         description: Payment not found
 *   delete:
 *     summary: Delete payment
 *     tags: [Payments]
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
 *         description: Payment deleted successfully
 *       404:
 *         description: Payment not found
 */
router.get('/:id', authenticate, getPaymentById);
router.put('/:id', authenticate, authorize(['ADMIN', 'MANAGER']), validate(paymentSchema), updatePayment);
router.delete('/:id', authenticate, authorize(['ADMIN']), deletePayment);

export default router;

