// controllers/migrationController.js
import Billing from "../models/billingModel.js";
import Receipt from "../models/receiptModel.js";
import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

const generateReceiptNumber = () => {
  const uniqueId = uuidv4().slice(-8).toUpperCase();
  return `REC${uniqueId}`;
};

// Create missing receipts for bills that don't have them
export const createMissingReceipts = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Find all bills
    const allBills = await Billing.find({}).session(session);

    // Find all existing receipts
    const existingReceipts = await Receipt.find({}).session(session);
    const existingBillNumbers = new Set(
      existingReceipts.map((r) => r.billNumber)
    );

    // Find bills without receipts
    const billsWithoutReceipts = allBills.filter(
      (bill) => !existingBillNumbers.has(bill.billNumber)
    );

    console.log(`Found ${billsWithoutReceipts.length} bills without receipts`);

    const createdReceipts = [];

    for (const bill of billsWithoutReceipts) {
      // Only create receipts for paid bills or bills with payments
      if (bill.payment.paid > 0) {
        const receiptData = {
          receiptNumber: generateReceiptNumber(),
          billNumber: bill.billNumber,
          billingId: bill._id,
          type: "creation",
          amount: bill.payment.paid,
          paymentMethod: {
            type: bill.payment.type,
            cardNumber: bill.payment.cardNumber || "",
            utrNumber: bill.payment.utrNumber || "",
          },
          newStatus: bill.status,
          remarks: "Receipt created during migration",
          createdBy: bill.createdBy,
          date: bill.date, // Use original bill date
        };

        const receipt = new Receipt(receiptData);
        await receipt.save({ session });
        createdReceipts.push(receipt);
      }
    }

    await session.commitTransaction();

    res.status(200).json({
      message: `Successfully created ${createdReceipts.length} missing receipts`,
      createdCount: createdReceipts.length,
      totalBillsChecked: allBills.length,
      success: true,
    });
  } catch (error) {
    await session.abortTransaction();
    console.error("Migration error:", error);
    res.status(500).json({
      message: "Error creating missing receipts",
      error: error.message,
      success: false,
    });
  } finally {
    session.endSession();
  }
};

// Fix receipts with zero amounts that should have non-zero amounts
export const fixZeroAmountReceipts = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Find all receipts with zero amounts
    const zeroAmountReceipts = await Receipt.find({
      amount: { $lte: 0 },
    }).session(session);

    console.log(
      `Found ${zeroAmountReceipts.length} receipts with zero or negative amounts`
    );

    const fixedReceipts = [];

    for (const receipt of zeroAmountReceipts) {
      // Get the corresponding billing record
      const billing = await Billing.findById(receipt.billingId).session(
        session
      );

      if (!billing) {
        console.log(`No billing found for receipt ${receipt.receiptNumber}`);
        continue;
      }

      let correctAmount = 0;

      // Determine the correct amount based on receipt type
      if (receipt.type === "creation") {
        // For creation receipts, use the paid amount from billing
        correctAmount = billing.payment.paid;
      } else if (receipt.type === "payment") {
        // For payment receipts, we need to calculate based on context
        // This is more complex and might need manual review
        console.log(
          `Payment receipt ${receipt.receiptNumber} needs manual review`
        );
        continue;
      } else if (receipt.type === "cancellation") {
        // For cancellation receipts, use the original paid amount
        correctAmount = billing.payment.paid;
      }

      // Only update if we have a valid amount and it's different
      if (correctAmount > 0 && correctAmount !== receipt.amount) {
        await Receipt.findByIdAndUpdate(
          receipt._id,
          { amount: correctAmount },
          { session }
        );

        fixedReceipts.push({
          receiptNumber: receipt.receiptNumber,
          billNumber: receipt.billNumber,
          oldAmount: receipt.amount,
          newAmount: correctAmount,
          type: receipt.type,
        });

        console.log(
          `Fixed receipt ${receipt.receiptNumber}: ${receipt.amount} → ${correctAmount}`
        );
      }
    }

    await session.commitTransaction();

    res.status(200).json({
      message: `Successfully fixed ${fixedReceipts.length} receipts`,
      fixedReceipts,
      totalChecked: zeroAmountReceipts.length,
      success: true,
    });
  } catch (error) {
    await session.abortTransaction();
    console.error("Fix error:", error);
    res.status(500).json({
      message: "Error fixing zero amount receipts",
      error: error.message,
      success: false,
    });
  } finally {
    session.endSession();
  }
};

// Fix specific bill number receipts
export const fixSpecificBillReceipt = async (req, res) => {
  const { billNumber } = req.params;
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Find the billing record
    const billing = await Billing.findOne({ billNumber }).session(session);

    if (!billing) {
      await session.abortTransaction();
      return res.status(404).json({
        message: `Bill ${billNumber} not found`,
        success: false,
      });
    }

    // Find receipts for this bill
    const receipts = await Receipt.find({ billNumber }).session(session);

    const fixedReceipts = [];

    for (const receipt of receipts) {
      let correctAmount = 0;

      if (receipt.type === "creation") {
        correctAmount = billing.payment.paid;
      } else if (receipt.type === "cancellation") {
        correctAmount = billing.payment.paid;
      }

      if (correctAmount > 0 && correctAmount !== receipt.amount) {
        await Receipt.findByIdAndUpdate(
          receipt._id,
          { amount: correctAmount },
          { session }
        );

        fixedReceipts.push({
          receiptNumber: receipt.receiptNumber,
          oldAmount: receipt.amount,
          newAmount: correctAmount,
        });
      }
    }

    await session.commitTransaction();

    res.status(200).json({
      message: `Fixed ${fixedReceipts.length} receipts for bill ${billNumber}`,
      billNumber,
      fixedReceipts,
      success: true,
    });
  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({
      message: `Error fixing receipts for bill ${billNumber}`,
      error: error.message,
      success: false,
    });
  } finally {
    session.endSession();
  }
};

// Get detailed report of missing/problematic receipts
export const getReceiptAuditReport = async (req, res) => {
  try {
    // Find all bills
    const allBills = await Billing.find({});

    // Find all receipts
    const allReceipts = await Receipt.find({});

    // Create maps for easier lookup
    const receiptsByBillNumber = new Map();
    allReceipts.forEach((receipt) => {
      if (!receiptsByBillNumber.has(receipt.billNumber)) {
        receiptsByBillNumber.set(receipt.billNumber, []);
      }
      receiptsByBillNumber.get(receipt.billNumber).push(receipt);
    });

    const report = {
      totalBills: allBills.length,
      totalReceipts: allReceipts.length,
      billsWithoutReceipts: [],
      zeroAmountReceipts: [],
      duplicateReceipts: [],
      orphanedReceipts: [],
    };

    // Check each bill
    for (const bill of allBills) {
      const receipts = receiptsByBillNumber.get(bill.billNumber) || [];

      // Bills without receipts
      if (receipts.length === 0 && bill.payment.paid > 0) {
        report.billsWithoutReceipts.push({
          billNumber: bill.billNumber,
          paidAmount: bill.payment.paid,
          status: bill.status,
          date: bill.date,
        });
      }

      // Check for zero amount receipts
      receipts.forEach((receipt) => {
        if (receipt.amount <= 0 && bill.payment.paid > 0) {
          report.zeroAmountReceipts.push({
            receiptNumber: receipt.receiptNumber,
            billNumber: bill.billNumber,
            receiptAmount: receipt.amount,
            expectedAmount: bill.payment.paid,
            type: receipt.type,
          });
        }
      });

      // Check for duplicate receipts of same type
      const creationReceipts = receipts.filter((r) => r.type === "creation");
      if (creationReceipts.length > 1) {
        report.duplicateReceipts.push({
          billNumber: bill.billNumber,
          duplicateType: "creation",
          count: creationReceipts.length,
          receipts: creationReceipts.map((r) => r.receiptNumber),
        });
      }
    }

    // Check for orphaned receipts (receipts without corresponding bills)
    const billNumbers = new Set(allBills.map((b) => b.billNumber));
    allReceipts.forEach((receipt) => {
      if (!billNumbers.has(receipt.billNumber)) {
        report.orphanedReceipts.push({
          receiptNumber: receipt.receiptNumber,
          billNumber: receipt.billNumber,
          amount: receipt.amount,
          type: receipt.type,
        });
      }
    });

    res.status(200).json({
      message: "Receipt audit report generated successfully",
      report,
      success: true,
    });
  } catch (error) {
    console.error("Audit report error:", error);
    res.status(500).json({
      message: "Error generating audit report",
      error: error.message,
      success: false,
    });
  }
};
