// models/billingModel.js
import mongoose from 'mongoose';

const BillingItemSchema = new mongoose.Schema({
  name: String,
  code: String,
  category: String,
  price: Number,
  quantity: Number,
  tax: Number,
  total: Number
}, { _id: false });

const BillingSchema = new mongoose.Schema({
  billNumber: { 
    type: String, 
    unique: true, 
    index: true,
    required: true
  },
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  billingItems: [BillingItemSchema],
  discount: {
    type: { type: String, enum: ['percent', 'amount'], required: true },
    value: { type: Number, required: true, min: 0 }
  },
  payment: {
    type: { type: String, enum: ['cash', 'card', 'upi', 'NEFT'], required: true },
    paid: { type: Number, required: true },
    cardNumber: { type: String }, 
    utrNumber: { type: String }  
  },
  status: { 
    type: String, 
    enum: ['active', 'paid', 'cancelled', 'partial'], 
    default: 'active',
    required: true 
  },
  totals: {
    subtotal: { type: Number, required: true },
    totalTax: { type: Number, required: true },
    grandTotal: { type: Number, required: true },
    balance: { type: Number, required: true },
    dueAmount: { type: Number, default: 0 }
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, default: Date.now }
}, { timestamps: true });

const Billing = mongoose.models.Billing || mongoose.model('Billing', BillingSchema);

export default Billing;