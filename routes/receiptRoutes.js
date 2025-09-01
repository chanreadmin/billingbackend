// /routes/receiptRoutes.js
import express from 'express';
import { authenticateJWT, authorizeRoles } from '../middleware/authMiddleware.js';
import {
  getAllReceipts,
  getReceiptByNumber,
  getReceiptStats,
  getReceiptsByBillNumber,
  getRecentReceipts,
  searchReceipts,
  deleteReceipt,
  getBillByReceiptNumber
} from '../controllers/receiptController.js';

const router = express.Router();

// Routes

// Get all receipts with pagination and filtering
router.get('/', 
  authenticateJWT, 
  authorizeRoles('Doctor', 'Receptionist', 'Admin', 'superAdmin', 'Accountant'), 
  getAllReceipts
);

// Get receipt statistics and analytics
router.get('/stats', 
  authenticateJWT, 
  authorizeRoles('Admin', 'superAdmin', 'Accountant'), 
  getReceiptStats
);

// Get recent receipts
router.get('/recent', 
  authenticateJWT, 
  authorizeRoles('Doctor', 'Receptionist', 'Admin', 'superAdmin', 'Accountant'), 
  getRecentReceipts
);

// Search receipts
router.get('/search', 
  authenticateJWT, 
  authorizeRoles('Doctor', 'Receptionist', 'Admin', 'superAdmin', 'Accountant'), 
  searchReceipts
);

// Get receipts by bill number
router.get('/bill/:billNumber', 
  authenticateJWT, 
  authorizeRoles('Doctor', 'Receptionist', 'Admin', 'superAdmin', 'Accountant'), 
  getReceiptsByBillNumber
);

// Get receipt by receipt number
router.get('/:receiptNumber', 
  authenticateJWT, 
  authorizeRoles('Doctor', 'Receptionist', 'Admin', 'superAdmin', 'Accountant'), 
  getReceiptByNumber
);

router.get('/bill-details/:receiptNumber', 
  authenticateJWT, 
  authorizeRoles('Doctor', 'Receptionist', 'Admin', 'superAdmin', 'Accountant'), 
  getBillByReceiptNumber  // Import this new function
);

// Delete receipt (Admin only)
router.delete('/:receiptNumber', 
  authenticateJWT, 
  authorizeRoles('Admin', 'superAdmin'), 
  deleteReceipt
);

export default router;