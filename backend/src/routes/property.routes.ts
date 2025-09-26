import { Router } from 'express';
import {
  getAllProperties,
  getPropertyById,
  createProperty,
  updateProperty,
  deleteProperty,
  createLocal,
  updateLocal,
  deleteLocal
} from '../controllers/property.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validation.middleware.js';
import Joi from 'joi';

const router = Router();

// Validation schemas
const propertySchema = Joi.object({
  name: Joi.string().min(2).required(),
  location: Joi.string().min(2).required(),
  description: Joi.string().optional(),
});

const localSchema = Joi.object({
  reference_code: Joi.string().min(2).required(),
  floor: Joi.string().optional(),
  unit_type: Joi.string().optional(),
  size_m2: Joi.number().positive().optional(),
  status: Joi.string().valid('AVAILABLE', 'OCCUPIED', 'MAINTENANCE').optional(),
});

/**
 * @swagger
 * components:
 *   schemas:
 *     Property:
 *       type: object
 *       required:
 *         - name
 *         - location
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *         location:
 *           type: string
 *         description:
 *           type: string
 *         created_at:
 *           type: string
 *           format: date-time
 *         locals:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Local'
 *     Local:
 *       type: object
 *       required:
 *         - reference_code
 *       properties:
 *         id:
 *           type: string
 *         reference_code:
 *           type: string
 *         floor:
 *           type: string
 *         unit_type:
 *           type: string
 *         size_m2:
 *           type: number
 *         status:
 *           type: string
 *           enum: [AVAILABLE, OCCUPIED, MAINTENANCE]
 */

/**
 * @swagger
 * /api/properties:
 *   get:
 *     summary: Get all properties
 *     tags: [Properties]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of properties
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Property'
 *   post:
 *     summary: Create a new property
 *     tags: [Properties]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Property'
 *     responses:
 *       201:
 *         description: Property created successfully
 *       400:
 *         description: Validation error
 */
router.get('/', authenticate, getAllProperties);
router.post('/', authenticate, authorize(['ADMIN', 'MANAGER']), validate(propertySchema), createProperty);

/**
 * @swagger
 * /api/properties/{id}:
 *   get:
 *     summary: Get property by ID
 *     tags: [Properties]
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
 *         description: Property details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Property'
 *       404:
 *         description: Property not found
 *   put:
 *     summary: Update property
 *     tags: [Properties]
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
 *             $ref: '#/components/schemas/Property'
 *     responses:
 *       200:
 *         description: Property updated successfully
 *       404:
 *         description: Property not found
 *   delete:
 *     summary: Delete property
 *     tags: [Properties]
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
 *         description: Property deleted successfully
 *       404:
 *         description: Property not found
 */
router.get('/:id', authenticate, getPropertyById);
router.put('/:id', authenticate, authorize(['ADMIN', 'MANAGER']), validate(propertySchema), updateProperty);
router.delete('/:id', authenticate, authorize(['ADMIN']), deleteProperty);

/**
 * @swagger
 * /api/properties/{propertyId}/locals:
 *   post:
 *     summary: Create a new local in a property
 *     tags: [Properties]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: propertyId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Local'
 *     responses:
 *       201:
 *         description: Local created successfully
 *       400:
 *         description: Validation error
 */
router.post('/:propertyId/locals', authenticate, authorize(['ADMIN', 'MANAGER']), validate(localSchema), createLocal);

/**
 * @swagger
 * /api/properties/locals/{id}:
 *   put:
 *     summary: Update local
 *     tags: [Properties]
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
 *             $ref: '#/components/schemas/Local'
 *     responses:
 *       200:
 *         description: Local updated successfully
 *       404:
 *         description: Local not found
 *   delete:
 *     summary: Delete local
 *     tags: [Properties]
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
 *         description: Local deleted successfully
 *       404:
 *         description: Local not found
 */
router.put('/locals/:id', authenticate, authorize(['ADMIN', 'MANAGER']), validate(localSchema), updateLocal);
router.delete('/locals/:id', authenticate, authorize(['ADMIN']), deleteLocal);

export default router;
