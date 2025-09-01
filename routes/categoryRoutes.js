import express from 'express';
import { createCategory, getAllCategories, getCategoryById, updateCategory, deleteCategory } from '../controllers/categoryController.js';

const router = express.Router();

// Route to create a category
router.post('/', createCategory);

// Route to get all categories
router.get('/', getAllCategories);

// Route to get a single category by ID
router.get('/:id', getCategoryById);

// Route to update a category
router.put('/:id', updateCategory);

// Route to delete a category
router.delete('/:id', deleteCategory);

export default router;
