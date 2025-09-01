// /routes/userRoutes.js
import express from 'express';
// import { getAllUsers, updateUser, deleteUser } from '../controllers/userController.js';
import { authenticateJWT, authorizeRoles } from '../middleware/authMiddleware.js';
import {
    createUser,
    getAllUsers,
    getUserById,
    updateUser,
    deleteUser, getDoctorById, getDoctorsByDepartment,
    getDoctors,
    searchDoctor
  } from '../controllers/userController.js';
const router = express.Router();


router.get('/doctors/department/:departmentId', authenticateJWT, authorizeRoles('Doctor', 'Receptionist', 'Admin','superAdmin', 'Accountant'), getDoctorsByDepartment);

// Get doctor by ID
router.get('/doctors/:id', authenticateJWT, authorizeRoles('Doctor', 'Receptionist', 'Admin','superAdmin', 'Accountant'), getDoctorById);
router.get('/doctors', authenticateJWT, authorizeRoles('Doctor', 'Receptionist', 'Admin','superAdmin', 'Accountant'), getDoctors);

router.post('/',authenticateJWT, authorizeRoles('Doctor', 'Receptionist', 'Admin','superAdmin', 'Accountant'), createUser);
// Get all users (Super Admin)
router.get('/', authenticateJWT, authorizeRoles('Doctor', 'Receptionist', 'Admin','superAdmin', 'Accountant'), getAllUsers);

// Get a single user by ID (Super Admin)
router.get('/:id',authenticateJWT, authorizeRoles('Doctor', 'Receptionist', 'Admin','superAdmin', 'Accountant'), getUserById);
// Update a user (Super Admin)
router.put('/:id', authenticateJWT, authorizeRoles('Doctor', 'Receptionist', 'Admin','superAdmin', 'Accountant'), updateUser);

// Delete a user (Super Admin)
router.delete('/:userId', authenticateJWT, authorizeRoles('Doctor', 'Receptionist', 'Admin','superAdmin', 'Accountant'), deleteUser);
router.get('/search', authenticateJWT, authorizeRoles('Doctor', 'Receptionist', 'Admin', 'superAdmin'), searchDoctor);
// router.get('/search', searchDoctor);

export default router;
