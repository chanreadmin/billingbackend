// controllers/appointmentController.js
import Appointment from '../models/appointmentModel.js';
import Patient from '../models/patientModel.js';
import User from '../models/userModel.js';

// Existing createAppointment function

export const createAppointment = async (req, res) => {
  try {
    const { patientId, doctor, department, appointmentDate, notes, consultationCharge, paymentStatus } = req.body;
    const patient = await Patient.findById(patientId);
    const fdoctor = await User.findById(doctor);

    if (!patient || !doctor) {
      return res.status(404).json({ message: 'Patient or Doctor not found' });
    }

    const appointment = new Appointment({
      patient: patientId,
      doctor: doctor,
      department: department,
      date: appointmentDate,
      consultationFee: consultationCharge,
      notes,
      paymentStatus,
    });

    await appointment.save();
    res.status(201).json({ message: 'Appointment created successfully', appointment });
  } catch (error) {
    res.status(500).json({ message: 'Error creating appointment', error });
  }
};

// Existing getAppointments function

export const getAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find()
      .populate('patient')
      .populate('doctor')
      .populate('department');
    res.status(200).json(appointments);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching appointments', error });
  }
};

// New updateAppointment function

export const updateAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const { doctor, department, appointmentDate, notes, consultationCharge } = req.body;

    const updatedAppointment = await Appointment.findByIdAndUpdate(
      id,
      {
        doctor,
        department,
        date: appointmentDate,
        consultationFee: consultationCharge,
        notes,
      },
      { new: true }
    );

    if (!updatedAppointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    res.status(200).json({ message: 'Appointment updated successfully', appointment: updatedAppointment });
  } catch (error) {
    res.status(500).json({ message: 'Error updating appointment', error });
  }
};

// New deleteAppointment function

export const deleteAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedAppointment = await Appointment.findByIdAndDelete(id);

    if (!deletedAppointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    res.status(200).json({ message: 'Appointment deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting appointment', error });
  }
};


export const updateAppointmentStatus = async (req, res) => {
  try {
    const { id } = req.params; // appointment ID
    const { status } = req.body; // new status

    // Check if the status is provided in the request
    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }

    // Find and update the appointment status
    const updatedAppointment = await Appointment.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!updatedAppointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    res.status(200).json({ message: 'Appointment status updated successfully', appointment: updatedAppointment });
  } catch (error) {
    res.status(500).json({ message: 'Error updating appointment status', error });
  }
};

export const getAppointmentById = async (req, res) => {
  try {
    const { id } = req.params;
    const appointment = await Appointment.findById(id)
      .populate('patient')
      .populate('doctor')
      .populate('department');
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    res.status(200).json(appointment);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching appointment', error });
  }
};

export const getAppointmentsByPatientId = async (req, res) => {
  const { patientId } = req.params;
  console.log(patientId)
  try {
    const appointments = await Appointment.find({ patient:patientId }).populate('patient').populate('doctor').populate('department');
    console.log(appointments)
    res.status(200).json(appointments);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching appointments', error });
  }
};