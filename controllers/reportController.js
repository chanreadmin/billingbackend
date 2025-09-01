// /controllers/reportController.js
import Report from '../models/reportModel.js';
import Patient from '../models/patientModel.js';
import Appointment from '../models/appointmentModel.js';
import Billing from '../models/billingModel.js';

// Generate report based on the type (Admin, Super Admin)
export const generateReport = async (req, res) => {
  const { type } = req.body; // Type of report (Financial, Patient, Appointment)
  let data;

  try {
    if (type === 'Patient') {
      // Generate patient report
      data = await Patient.find().lean();
    } else if (type === 'Appointment') {
      // Generate appointment report
      data = await Appointment.find().populate('patient').populate('doctor').lean();
    } else if (type === 'Financial') {
      // Generate financial report (billing and payment)
      data = await Billing.find().populate('patient').lean();
    } else {
      return res.status(400).json({ message: 'Invalid report type' });
    }

    // Save the generated report in the database
    const report = await Report.create({
      type,
      data,
      generatedBy: req.user.id,
    });

    return res.status(201).json({ message: 'Report generated successfully', report });
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error });
  }
};

// Get all reports (Admin, Super Admin)
export const getAllReports = async (req, res) => {
  try {
    const reports = await Report.find().populate('generatedBy', 'name').lean();
    return res.status(200).json({ reports });
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error });
  }
};

// Get a report by ID (Admin, Super Admin)
export const getReportById = async (req, res) => {
  const { reportId } = req.params;

  try {
    const report = await Report.findById(reportId).populate('generatedBy', 'name').lean();

    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    return res.status(200).json({ report });
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error });
  }
};
