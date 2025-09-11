// /routes/index.js
import express from 'express';
import authRoutes from './authRoutes.js';
import userRoutes from './userRoutes.js';
import patientRoutes from './patientRoutes.js';
import appointmentRoutes from './appointmentRoutes.js';
import billingRoutes from './billingRoutes.js';
import receiptRoutes from './receiptRoutes.js';
import reportRoutes from './reportRoutes.js';
import deparmentRoutes from './departmentRoutes.js';
import categoryRoutes from './categoryRoutes.js';
import productRoutes from './productRoutes.js';
import migrationRoutes from './migrationRoutes.js';

const router = express.Router();

// Mount the routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/patients', patientRoutes);
router.use('/appointments', appointmentRoutes);
router.use('/bills', billingRoutes);
router.use('/receipts', receiptRoutes);
router.use('/reports', reportRoutes);
router.use('/department', deparmentRoutes);
router.use('/category', categoryRoutes);
router.use('/product', productRoutes);
router.use('/migrations', migrationRoutes);

export default router;