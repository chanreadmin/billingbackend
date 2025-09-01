import express from 'express';
import {
  createDepartment,
  getAllDepartments,
  getDepartmentById,
  updateDepartment,
  deleteDepartment,
} from '../controllers/departmentController.js';
import { authenticateJWT, authorizeRoles } from '../middleware/authMiddleware.js';
const router = express.Router();
// Department routes
router.post('/',authenticateJWT, createDepartment); // Create a new department
router.get('/',authenticateJWT, getAllDepartments); // Get all departments
router.get('/:id',authenticateJWT, getDepartmentById); // Get a single department by ID
router.put('/:id',authenticateJWT, updateDepartment); // Update a department by ID
router.delete('/:id',authenticateJWT, deleteDepartment); // Delete a department by ID

export default router;
