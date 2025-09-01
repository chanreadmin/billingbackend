import mongoose from 'mongoose';

const patientSchema = new mongoose.Schema({
  aadhaarId: String,
  title: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: String,
  dob: String,
  gender: { type: String },
  maritalStatus: String,
  mobileNumber: { type: String },
  phoneNumber: String,
  address: String,
  state: String,
  emailId: String,
  city: String,
  pinCode: String,
  bloodGroup: String,
  spouseName: String,
  husbandName: String,
  guardianName: String,
  guardianNumber: String,
  membershipType: String,
  nationality: { type: String, default: 'India' },
  patientSource: String,
  researchPatient: { type: String, },
  registrationDate: { type: String },
  registeredPatient: {
    type: Boolean,
    default: false,
  },
  diagnosis:{type: String},
  paymentStatus: {
    type: String,
    enum: ['Unpaid', 'Partially Paid', 'Paid'],
    default: 'Unpaid',
  },
  patientId: { type: String, required: true, unique: true },
});

const Patient = mongoose.model('Patient', patientSchema);

export default Patient;
