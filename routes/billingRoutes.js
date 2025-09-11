// /routes/billingRoutes.js
import express from "express";
import {
  authenticateJWT,
  authorizeRoles,
} from "../middleware/authMiddleware.js";
import {
  createBilling,
  getBillings,
  getBillingById,
  getBillingByBillNumber,
  updateBillingById,
  addPayment,
  cancelBill,
  getDueAmountReport,
  migrateBillNumbers,
} from "../controllers/billingController.js";

const router = express.Router();

// Migration route (run once to add bill numbers to existing bills)
router.post(
  "/migrate-bill-numbers",
  authenticateJWT,
  authorizeRoles("Doctor", "Receptionist", "Admin", "superAdmin", "Accountant"),
  migrateBillNumbers
);

// Create a new billing record
router.post(
  "/",
  authenticateJWT,
  authorizeRoles("Doctor", "Receptionist", "Admin", "superAdmin", "Accountant"),
  createBilling
);

// Get all billing records
router.get(
  "/",
  authenticateJWT,
  authorizeRoles("Doctor", "Receptionist", "Admin", "superAdmin", "Accountant"),
  getBillings
);

// Get due amount report
router.get(
  "/due-report",
  authenticateJWT,
  authorizeRoles("Doctor", "Receptionist", "Admin", "superAdmin", "Accountant"),
  getDueAmountReport
);

// Get a specific billing record by ID
router.get(
  "/:id",
  authenticateJWT,
  authorizeRoles("Doctor", "Receptionist", "Admin", "superAdmin", "Accountant"),
  getBillingById
);

// Get billing by bill number
router.get(
  "/bill-number/:billNumber",
  authenticateJWT,
  authorizeRoles("Doctor", "Receptionist", "Admin", "superAdmin", "Accountant"),
  getBillingByBillNumber
);

// Update a billing record
router.put(
  "/:id",
  authenticateJWT,
  authorizeRoles("Doctor", "Receptionist", "Admin", "superAdmin", "Accountant"),
  updateBillingById
);

// Add payment to existing bill
router.post(
  "/:id/payment",
  authenticateJWT,
  authorizeRoles("Doctor", "Receptionist", "Admin", "superAdmin", "Accountant"),
  addPayment
);

// Cancel a bill
router.patch(
  "/:id/cancel",
  authenticateJWT,
  authorizeRoles("Doctor", "Admin", "superAdmin"),
  cancelBill
);

export default router;
