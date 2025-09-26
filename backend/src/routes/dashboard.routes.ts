import { Router } from 'express';
import {
  getDashboardStats,
  getRevenueReport,
  getOccupancyReport
} from '../controllers/dashboard.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

/**
 * @swagger
 * /api/dashboard/stats:
 *   get:
 *     summary: Get dashboard statistics
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 stats:
 *                   type: object
 *                   properties:
 *                     totalProperties:
 *                       type: number
 *                     totalLocals:
 *                       type: number
 *                     availableLocals:
 *                       type: number
 *                     occupiedLocals:
 *                       type: number
 *                     totalTenants:
 *                       type: number
 *                     activeLeases:
 *                       type: number
 *                     totalPayments:
 *                       type: number
 *                     monthlyRevenue:
 *                       type: number
 *                     overduePayments:
 *                       type: number
 *                     occupancyRate:
 *                       type: number
 *                 recentActivities:
 *                   type: array
 *                   items:
 *                     type: object
 *                 paymentTrends:
 *                   type: array
 *                   items:
 *                     type: object
 *                 topProperties:
 *                   type: array
 *                   items:
 *                     type: object
 */
router.get('/stats', authenticate, getDashboardStats);

/**
 * @swagger
 * /api/dashboard/revenue:
 *   get:
 *     summary: Get revenue report
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for the report
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for the report
 *       - in: query
 *         name: group_by
 *         schema:
 *           type: string
 *           enum: [day, month]
 *         description: Group data by day or month
 *     responses:
 *       200:
 *         description: Revenue report data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 revenueData:
 *                   type: array
 *                   items:
 *                     type: object
 *                 revenueByPaymentMode:
 *                   type: array
 *                   items:
 *                     type: object
 *                 totalRevenue:
 *                   type: number
 *                 totalTransactions:
 *                   type: number
 */
router.get('/revenue', authenticate, getRevenueReport);

/**
 * @swagger
 * /api/dashboard/occupancy:
 *   get:
 *     summary: Get occupancy report
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Occupancy report data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 properties:
 *                   type: array
 *                   items:
 *                     type: object
 *                 overallStats:
 *                   type: object
 */
router.get('/occupancy', authenticate, getOccupancyReport);

export default router;

