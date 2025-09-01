// /models/reportModel.js
import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['Financial', 'Patient', 'Appointment'],
      required: true,
    },
    data: {
      type: Object,
      required: true,
    },
    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // Reference to the user who generated the report
    },
    generatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

const Report = mongoose.model('Report', reportSchema);

export default Report;
