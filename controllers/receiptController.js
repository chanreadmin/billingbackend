// controllers/receiptController.js
import Receipt from '../models/receiptModel.js';

// Get all receipts
export const getAllReceipts = async (req, res) => {
  try {
    const { type, billNumber, startDate, endDate, page = 1, limit = 10 } = req.query;
    
    let filter = {};
    
    if (type) filter.type = type;
    if (billNumber) filter.billNumber = billNumber;
    if (startDate && endDate) {
      filter.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    const skip = (page - 1) * parseInt(limit);
    
    const receipts = await Receipt.find(filter)
      .populate({
        path: 'billingId',
        populate: [
          {
            path: 'patientId'
          },
          {
            path: 'doctorId', 
            select: 'name specialization department'
          }
        ]
      })
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Receipt.countDocuments(filter);
    
    res.status(200).json({
      receipts,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalReceipts: total,
        hasNext: skip + receipts.length < total,
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Error fetching receipts:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

// Get receipt by receipt number


// Get receipt statistics
export const getReceiptStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let matchCondition = {};
    if (startDate && endDate) {
      matchCondition.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    const stats = await Receipt.aggregate([
      { $match: matchCondition },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      }
    ]);
    
    const totalReceipts = await Receipt.countDocuments(matchCondition);
    
    // Get daily receipt count for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const dailyStats = await Receipt.aggregate([
      {
        $match: {
          date: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' },
            day: { $dayOfMonth: '$date' }
          },
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
      }
    ]);
    
    // Get top payment methods
    const paymentMethodStats = await Receipt.aggregate([
      {
        $match: {
          type: 'payment',
          ...matchCondition
        }
      },
      {
        $group: {
          _id: '$paymentMethod.type',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      },
      {
        $sort: { totalAmount: -1 }
      }
    ]);
    
    res.status(200).json({
      summary: {
        totalReceipts,
        totalAmount: stats.reduce((sum, stat) => sum + stat.totalAmount, 0)
      },
      byType: stats,
      dailyStats,
      paymentMethodStats
    });
  } catch (error) {
    console.error('Error fetching receipt statistics:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

// Get receipts by bill number
export const getReceiptsByBillNumber = async (req, res) => {
  try {
    const { billNumber } = req.params;
    const receipts = await Receipt.find({ billNumber })
      .populate('createdBy', 'name role')
      .sort({ createdAt: -1 });
    
    if (!receipts || receipts.length === 0) {
      return res.status(404).json({ message: 'No receipts found for this bill number' });
    }
    
    res.status(200).json(receipts);
  } catch (error) {
    console.error('Error fetching receipts by bill number:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

// Get recent receipts
export const getRecentReceipts = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const recentReceipts = await Receipt.find()
      .populate('billingId', 'billNumber')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));
    
    res.status(200).json(recentReceipts);
  } catch (error) {
    console.error('Error fetching recent receipts:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

// Search receipts
export const searchReceipts = async (req, res) => {
  try {
    const { 
      query, 
      type, 
      startDate, 
      endDate, 
      minAmount, 
      maxAmount,
      page = 1, 
      limit = 10 
    } = req.query;
    
    let searchConditions = {};
    
    // Text search in receipt number, bill number, or remarks
    if (query) {
      searchConditions.$or = [
        { receiptNumber: { $regex: query, $options: 'i' } },
        { billNumber: { $regex: query, $options: 'i' } },
        { remarks: { $regex: query, $options: 'i' } }
      ];
    }
    
    if (type) searchConditions.type = type;
    
    if (startDate && endDate) {
      searchConditions.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    if (minAmount || maxAmount) {
      searchConditions.amount = {};
      if (minAmount) searchConditions.amount.$gte = parseFloat(minAmount);
      if (maxAmount) searchConditions.amount.$lte = parseFloat(maxAmount);
    }
    
    const skip = (page - 1) * parseInt(limit);
    
    const receipts = await Receipt.find(searchConditions)
      .populate('billingId', 'billNumber patientId')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Receipt.countDocuments(searchConditions);
    
    res.status(200).json({
      receipts,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalReceipts: total,
        hasNext: skip + receipts.length < total,
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Error searching receipts:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

// Delete receipt (Admin only - for corrections)
export const deleteReceipt = async (req, res) => {
  try {
    const { receiptNumber } = req.params;
    const { reason } = req.body;
    
    if (!reason) {
      return res.status(400).json({ message: 'Reason for deletion is required' });
    }
    
    const receipt = await Receipt.findOne({ receiptNumber });
    if (!receipt) {
      return res.status(404).json({ message: 'Receipt not found' });
    }
    
    // For audit purposes, we might want to soft delete instead
    // Add a deleted flag and deletion reason
    await Receipt.findOneAndUpdate(
      { receiptNumber },
      { 
        deleted: true, 
        deletedBy: req.user.id,
        deletedAt: new Date(),
        deletionReason: reason
      }
    );
    
    res.status(200).json({ 
      message: 'Receipt marked as deleted successfully',
      receiptNumber 
    });
  } catch (error) {
    console.error('Error deleting receipt:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

// controllers/receiptController.js - Updated getReceiptByNumber function

// Get receipt by receipt number with complete bill details
export const getReceiptByNumber = async (req, res) => {
  try {
    const { receiptNumber } = req.params;
    const receipt = await Receipt.findOne({ receiptNumber })
      .populate({
        path: 'billingId',
        populate: [
          { 
            path: 'patientId', 
            select: 'firstName lastName patientId mobileNumber email address' // Fixed field names
          },
          { 
            path: 'doctorId', 
            select: 'name specialization department' // Added department
          },
          {
            path: 'createdBy',
            select: 'name role'
          }
        ]
      })
      .populate('createdBy', 'name role');
    
    if (!receipt) {
      return res.status(404).json({ message: 'Receipt not found' });
    }
    
    res.status(200).json(receipt);
  } catch (error) {
    console.error('Error fetching receipt:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

// NEW: Get complete bill details via receipt number (single API call optimization)
export const getBillByReceiptNumber = async (req, res) => {
  try {
    const { receiptNumber } = req.params;
    
    // Find the receipt first
    const receipt = await Receipt.findOne({ receiptNumber })
      .populate('createdBy', 'name role');
    
    if (!receipt) {
      return res.status(404).json({ message: 'Receipt not found' });
    }

    // Get the complete bill details
    const bill = await Billing.findById(receipt.billingId)
      .populate('patientId')
      .populate('doctorId')
      .populate('createdBy', 'name');

    if (!bill) {
      return res.status(404).json({ message: 'Associated bill not found' });
    }

    // Get all receipts for this bill
    const allReceipts = await Receipt.find({ billNumber: bill.billNumber })
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json({
      receipt,
      bill,
      allReceipts,
      message: 'Complete bill details retrieved via receipt number'
    });
  } catch (error) {
    console.error('Error fetching bill via receipt number:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};