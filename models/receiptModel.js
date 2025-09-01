import mongoose from 'mongoose';

const ReceiptSchema = new mongoose.Schema({
  receiptNumber: { 
    type: String, 
    unique: true, 
    index: true,
    required: true
  },
  billNumber: { 
    type: String, 
    required: true,
    index: true
  },
  billingId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Billing', 
    required: true 
  },
  type: { 
    type: String, 
    enum: ['payment', 'modification', 'cancellation', 'creation'], 
    required: true 
  },
  amount: { type: Number, default: 0 },
  paymentMethod: {
    type: { type: String, enum: ['cash', 'card', 'upi', 'NEFT'] },
    cardNumber: { type: String }, 
    utrNumber: { type: String }  
  },
  previousStatus: { type: String },
  newStatus: { type: String },
  changes: {
    previousData: { type: Object },
    newData: { type: Object },
    description: { type: String }
  },
  remarks: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, default: Date.now }
}, { timestamps: true });

const Receipt = mongoose.model('Receipt', ReceiptSchema);

export default Receipt;