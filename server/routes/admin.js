import express from 'express';
import {
    getDashboardStats,
    addSapling,
    getAllSaplings,
    getAllUsers,
    getPendingVerifications,
    verifyImage,
    deleteSapling,
    getRedemptions,
    handleRedemption,
    getUserHistory,
    getEligibleUsers,
    issueCertificate,
    getAdminRewardCatalog,
    addRewardToCatalog,
    updateRewardCatalog,
    approveRedemption,
    rejectRedemption,
    markRedeemed,
    getAllOrders,
    getAllDeliveryStaff,
    assignOrder,
    verifyPickup,
    getVerifiedUploads
} from '../controllers/adminController.js';

const router = express.Router();

// Middleware to check admin role could be added here
// router.use(protectAdmin);

router.get('/stats', getDashboardStats);
router.post('/saplings/add', addSapling);
router.get('/saplings', getAllSaplings);
router.delete('/saplings/:id', deleteSapling);
router.get('/users', getAllUsers);
router.get('/pending-verifications', getPendingVerifications);
router.get('/verified-uploads', getVerifiedUploads);
router.post('/verify/:uploadId', verifyImage);

// Orders
router.get('/orders', getAllOrders);
router.get('/delivery-staff', getAllDeliveryStaff);
router.post('/orders/:orderId/assign', assignOrder);
router.post('/orders/verify-pickup', verifyPickup);

// Redemption & Rewards
router.get('/redemptions', getRedemptions);
router.post('/redemptions/:redemptionId', handleRedemption); // Keep legacy generic handler if needed, or deprecate
router.post('/redemptions/:redemptionId/approve', approveRedemption);
router.post('/redemptions/:redemptionId/reject', rejectRedemption);
router.post('/redemptions/:redemptionId/redeem', markRedeemed);

router.get('/catalog', getAdminRewardCatalog);
router.post('/catalog', addRewardToCatalog);
router.put('/catalog/:id', updateRewardCatalog);

router.get('/users/:userId/history', getUserHistory);
router.get('/certificates/eligible', getEligibleUsers);
router.post('/certificates/issue/:userId', issueCertificate);

export default router;
