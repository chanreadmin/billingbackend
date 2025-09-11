// /routes/migrationRoutes.js
import express from 'express';
import { authenticateJWT, authorizeRoles } from '../middleware/authMiddleware.js';
import {
  fixZeroAmountReceipts,
  fixSpecificBillReceipt,
  getReceiptAuditReport,
  createMissingReceipts,
} from '../controllers/migrationController.js';

const router = express.Router();

// Generate audit report for receipts/bills
router.get(
  '/audit-report',
  authenticateJWT,
  authorizeRoles('Admin', 'superAdmin', 'Accountant'),
  getReceiptAuditReport
);

// Create missing receipts for paid bills
router.post(
  '/create-missing-receipts',
  authenticateJWT,
  authorizeRoles('Admin', 'superAdmin'),
  createMissingReceipts
);

// Fix receipts with zero or negative amounts
router.post(
  '/fix-zero-amounts',
  authenticateJWT,
  authorizeRoles('Admin', 'superAdmin'),
  fixZeroAmountReceipts
);

// Fix receipts for a specific bill number
router.post(
  '/fix-bill/:billNumber',
  authenticateJWT,
  authorizeRoles('Admin', 'superAdmin'),
  fixSpecificBillReceipt
);

export default router;


