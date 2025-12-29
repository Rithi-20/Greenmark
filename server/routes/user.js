import express from 'express';
import {
    getUserStats,
    registerSapling,
    getMySaplings,
    uploadImage,
    getRewards,
    getAvailableSaplings,
    requestRedemption,
    getSaplingStats,
    getNotifications,
    markNotificationRead,
    getUserCertificates,
    updateUser,
    placeOrder,
    getUserOrders,
    uploadInitialPhoto,
    getUploadHistory,
    getVerificationDetails
} from '../controllers/userController.js';

import multer from 'multer';
import path from 'path';

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage });

const router = express.Router();

// Debug middleware for this router
router.use((req, res, next) => {
    console.log(`🛣️ User Router: ${req.method} ${req.url}`);
    next();
});

// Specific routes first
router.get('/test', (req, res) => res.json({ message: 'User router is active' }));
router.get('/saplings/:saplingId/stats', (req, res, next) => {
    console.log(`🔍 Stats Route Hit: ${req.params.saplingId}`);
    next();
}, getSaplingStats);
router.post('/saplings/register', upload.single('image'), registerSapling);

// Photo Upload Routes
router.post('/upload', upload.single('image'), uploadImage);
router.post('/upload/initial', upload.single('image'), uploadInitialPhoto); // Initial photo at handover
router.get('/uploads/:uploadId/verification', getVerificationDetails); // Get verification details

// Parameterized routes last
router.get('/available', getAvailableSaplings);
router.get('/rewards', getRewards);
router.post('/redeem', requestRedemption);
router.get('/:userId/stats', getUserStats);
router.get('/:userId/saplings', getMySaplings);
router.get('/:userId/notifications', getNotifications);
router.post('/notifications/:notificationId/read', markNotificationRead);
router.get('/:userId/certificates', getUserCertificates);
router.put('/:userId/update', updateUser);
router.post('/order/place', placeOrder);
router.get('/:userId/orders', getUserOrders);
router.get('/:userId/uploads', getUploadHistory); // Get upload history with verification data

export default router;

