import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Billing from '../models/billingModel.js';
import Receipt from '../models/receiptModel.js';
import Counter from '../models/counterModel.js';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

const generateReceiptNumber = () => {
  const uniqueId = uuidv4().slice(-8).toUpperCase();
  return `REC${uniqueId}`;
};

const generateBillNumber = async () => {
  try {
    const counter = await Counter.findOneAndUpdate(
      { id: 'billNumber' },
      { $inc: { sequenceValue: 1 } },
      { new: true, upsert: true }
    );
    if (counter) {
      const baseNumber = 100000000;
      const finalNumber = baseNumber + counter.sequenceValue;
      return finalNumber.toString().padStart(9, '0');
    }
  } catch (error) {}
  try {
    const highestBill = await Billing.findOne({ billNumber: { $exists: true, $ne: null, $ne: '' } }).sort({ billNumber: -1 });
    let nextNumber = 100000001;
    if (highestBill && highestBill.billNumber) {
      const currentNumber = parseInt(highestBill.billNumber);
      nextNumber = currentNumber + 1;
    }
    return nextNumber.toString().padStart(9, '0');
  } catch (error) {
    throw new Error('Unable to generate bill number');
  }
};

const createReceiptForBill = async (bill, billNumber, session) => {
  try {
    const existingReceipt = await Receipt.findOne({ billingId: bill._id, type: 'creation' }).session(session);
    if (existingReceipt) {
      if (existingReceipt.billNumber !== billNumber) {
        await Receipt.findByIdAndUpdate(existingReceipt._id, { billNumber }, { session });
      }
      return existingReceipt;
    }
    let receiptNumber;
    let receiptAttempts = 0;
    const maxReceiptAttempts = 5;
    do {
      receiptNumber = generateReceiptNumber();
      receiptAttempts++;
      const existingReceiptWithNumber = await Receipt.findOne({ receiptNumber }).session(session);
      if (!existingReceiptWithNumber) break;
      if (receiptAttempts >= maxReceiptAttempts) throw new Error(`Failed to generate unique receipt number after ${maxReceiptAttempts} attempts`);
    } while (receiptAttempts < maxReceiptAttempts);
    const receipt = new Receipt({
      receiptNumber,
      billNumber,
      billingId: bill._id,
      type: 'creation',
      amount: bill.payment?.paid || 0,
      paymentMethod: {
        type: bill.payment?.type || 'cash',
        cardNumber: bill.payment?.cardNumber,
        utrNumber: bill.payment?.utrNumber
      },
      newStatus: bill.status,
      remarks: 'Bill created - Generated during migration',
      createdBy: bill.createdBy,
      date: bill.date || bill.createdAt || new Date()
    });
    await receipt.save({ session });
    return receipt;
  } catch (error) {
    throw error;
  }
};

const migrateBillNumbersBatch = async (bills, batchNumber, totalBatches) => {
  let batchMigrated = 0;
  let batchFailed = 0;
  let receiptsCreated = 0;
  let receiptsUpdated = 0;
  const batchFailedBills = [];
  for (let i = 0; i < bills.length; i++) {
    const bill = bills[i];
    const session = await mongoose.startSession();
    try {
      session.startTransaction();
      let billNumber;
      let attempts = 0;
      const maxAttempts = 5;
      do {
        billNumber = await generateBillNumber();
        attempts++;
        const existingBill = await Billing.findOne({ billNumber, _id: { $ne: bill._id } }).session(session);
        if (!existingBill) break;
        if (attempts >= maxAttempts) throw new Error(`Failed to generate unique bill number after ${maxAttempts} attempts`);
      } while (attempts < maxAttempts);
      await Billing.findByIdAndUpdate(bill._id, { billNumber }, { session });
      const receipt = await createReceiptForBill(bill, billNumber, session);
      if (receipt.isNew !== false) receiptsCreated++;
      else receiptsUpdated++;
      await Receipt.updateMany({ billingId: bill._id, _id: { $ne: receipt._id } }, { $set: { billNumber } }, { session });
      await session.commitTransaction();
      batchMigrated++;
    } catch (error) {
      await session.abortTransaction();
      batchFailed++;
      batchFailedBills.push({ billId: bill._id, error: error.message });
    } finally {
      await session.endSession();
    }
  }
  return { batchMigrated, batchFailed, batchFailedBills, receiptsCreated, receiptsUpdated };
};

const migrateBillNumbers = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    await initializeCounter();
    const billsWithoutNumber = await Billing.find({ $or: [ { billNumber: { $exists: false } }, { billNumber: null }, { billNumber: '' } ] });
    if (billsWithoutNumber.length === 0) return;
    const batchSize = 50;
    const batches = [];
    for (let i = 0; i < billsWithoutNumber.length; i += batchSize) {
      batches.push(billsWithoutNumber.slice(i, i + batchSize));
    }
    let totalMigrated = 0;
    let totalFailed = 0;
    let totalReceiptsCreated = 0;
    let totalReceiptsUpdated = 0;
    const allFailedBills = [];
    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      const result = await migrateBillNumbersBatch(batch, batchIndex + 1, batches.length);
      totalMigrated += result.batchMigrated;
      totalFailed += result.batchFailed;
      totalReceiptsCreated += result.receiptsCreated;
      totalReceiptsUpdated += result.receiptsUpdated;
      allFailedBills.push(...result.batchFailedBills);
      if (batchIndex < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    if (totalFailed > 0) {
      const fs = await import('fs');
      const failedBillsFile = `failed_bills_${new Date().toISOString().split('T')[0]}.json`;
      fs.writeFileSync(failedBillsFile, JSON.stringify(allFailedBills, null, 2));
    }
    await verifyMigration();
  } catch (error) {
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
};

const verifyMigration = async () => {
  try {
    const billsWithoutNumber = await Billing.countDocuments({ $or: [ { billNumber: { $exists: false } }, { billNumber: null }, { billNumber: '' } ] });
    const billsWithoutReceipts = await Billing.aggregate([
      { $lookup: { from: 'receipts', let: { billId: '$_id' }, pipeline: [ { $match: { $expr: { $and: [ { $eq: ['$billingId', '$$billId'] }, { $eq: ['$type', 'creation'] } ] } } } ], as: 'creationReceipts' } },
      { $match: { creationReceipts: { $size: 0 } } },
      { $count: 'billsWithoutCreationReceipts' }
    ]);
    const billsWithoutCreationReceipts = billsWithoutReceipts[0]?.billsWithoutCreationReceipts || 0;
  } catch (error) {}
};

const initializeCounter = async () => {
  try {
    const existingCounter = await Counter.findOne({ id: 'billNumber' });
    if (!existingCounter) {
      const highestBill = await Billing.findOne({ billNumber: { $exists: true, $ne: null, $ne: '' } }).sort({ billNumber: -1 });
      let startingValue = 0;
      if (highestBill && highestBill.billNumber) {
        const currentNumber = parseInt(highestBill.billNumber);
        startingValue = currentNumber - 100000000;
      }
      await Counter.create({ id: 'billNumber', sequenceValue: startingValue });
    }
  } catch (error) {}
};

const validateMigration = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const collections = await mongoose.connection.db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    if (!collectionNames.includes('billings')) throw new Error('Billings collection not found');
    await mongoose.disconnect();
    return true;
  } catch (error) {
    return false;
  }
};

const createMissingReceipts = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const billsWithoutReceipts = await Billing.aggregate([
      { $lookup: { from: 'receipts', let: { billId: '$_id' }, pipeline: [ { $match: { $expr: { $and: [ { $eq: ['$billingId', '$$billId'] }, { $eq: ['$type', 'creation'] } ] } } } ], as: 'creationReceipts' } },
      { $match: { creationReceipts: { $size: 0 }, billNumber: { $exists: true, $ne: null, $ne: '' } } }
    ]);
    if (billsWithoutReceipts.length === 0) return;
    for (const bill of billsWithoutReceipts) {
      const session = await mongoose.startSession();
      try {
        session.startTransaction();
        await createReceiptForBill(bill, bill.billNumber, session);
        await session.commitTransaction();
      } catch (error) {
        await session.abortTransaction();
      } finally {
        await session.endSession();
      }
    }
  } catch (error) {}
  finally {
    await mongoose.disconnect();
  }
};

const main = async () => {
  const isValid = await validateMigration();
  if (!isValid) process.exit(1);
  const args = process.argv.slice(2);
  if (args.includes('--receipts-only')) {
    await createMissingReceipts();
  } else {
    await migrateBillNumbers();
  }
};

main().catch(error => {
  process.exit(1);
});