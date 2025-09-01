import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
  },
  username:{
    type: String,
    required: [true, 'Username is required'],
    unique: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email'],
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password should be at least 6 characters'],
  },
  contactNumber: {
    type: String,
    required: [true, 'Contact number is required'],
    match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit contact number'],
  },
  role: {
    type: String,
    enum: {
      values: ['Admin', 'Doctor', 'Receptionist', 'Accountant', 'superAdmin'],
      message: '{VALUE} is not a valid role',
    },
    required: true,
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: function () {
      return this.role === 'Doctor';
    },
  },
  specialization: {
    type: String,
    required: function () {
      return this.role === 'Doctor';
    },
    trim: true,
  },
  consultationCharges: {
    type: Number,
    required: function () {
      return this.role === 'Doctor';
    },
    min: [0, 'Consultation charges cannot be negative'],
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  // Password reset fields
  resetPasswordToken: {
    type: String,
    default: null,
  },
  resetPasswordExpires: {
    type: Date,
    default: null,
  },
}, {
  timestamps: true,
});

const User = mongoose.model('User', userSchema);

export default User;