import express from 'express';
import { createProduct, getAllProducts, getProductById, updateProduct, deleteProduct } from '../controllers/productController.js';

const router = express.Router();

// Route to create a product
router.post('/', createProduct);

// Route to get all products
router.get('/', getAllProducts);

// Route to get a single product by ID
router.get('/:id', getProductById);

// Route to update a product
router.put('/:id', updateProduct);

// Route to delete a product
router.delete('/:id', deleteProduct);

export default router;
