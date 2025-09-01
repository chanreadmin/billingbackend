import express from 'express';
import { createAppointment, deleteAppointment, getAppointmentById, getAppointments, getAppointmentsByPatientId, updateAppointment, updateAppointmentStatus } from '../controllers/appointmentController.js';
import { authenticateJWT, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/',authenticateJWT, authorizeRoles('Doctor', 'Receptionist', 'Admin','superAdmin', 'Accountant'), createAppointment);
router.get('/', authenticateJWT, authorizeRoles('Doctor', 'Receptionist', 'Admin','superAdmin', 'Accountant'), getAppointments);
router.put('/:id', authenticateJWT, authorizeRoles('Doctor', 'Receptionist', 'Admin','superAdmin', 'Accountant'), updateAppointment); // Update an appointment by ID
router.delete('/:id',authenticateJWT, authorizeRoles('Doctor', 'Receptionist', 'Admin','superAdmin', 'Accountant'), deleteAppointment); // Delete an appointment by ID
router.patch('/:id/status',authenticateJWT, authorizeRoles('Doctor', 'Receptionist', 'Admin','superAdmin', 'Accountant'), updateAppointmentStatus); 
router.get('/:id', authenticateJWT, authorizeRoles('Doctor', 'Receptionist', 'Admin','superAdmin', 'Accountant'), getAppointmentById);

router.get('/patient/:patientId',authenticateJWT, authorizeRoles('Doctor', 'Receptionist', 'Admin','superAdmin', 'Accountant'), getAppointmentsByPatientId);

export default router;

