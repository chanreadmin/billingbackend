// /routes/reportRoutes.js
import express from 'express';
import {
  generateReport,
  getAllReports,
  getReportById,
} from '../controllers/reportController.js';
import { authenticateJWT, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();
// Generate a new report (Admin, Super Admin)
router.post('/', authenticateJWT, authorizeRoles( 'Admin','superAdmin', 'Accountant'), generateReport);

// Get all reports (Admin, Super Admin)
router.get('/', authenticateJWT, authorizeRoles('Admin','superAdmin', 'Accountant'), getAllReports);

// Get a report by ID (Admin, Super Admin)
router.get('/:reportId', authenticateJWT, authorizeRoles('Admin','superAdmin', 'Accountant'), getReportById);

export default router;
