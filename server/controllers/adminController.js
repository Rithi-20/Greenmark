import Admin from '../models/Admin.js';
import User from '../models/User.js';
import Sapling from '../models/Sapling.js';
import Upload from '../models/Upload.js';
import QRCode from 'qrcode';
import mongoose from 'mongoose';
import Notification from '../models/Notification.js';
import Redemption from '../models/Redemption.js';
import Certificate from '../models/Certificate.js';
import Order from '../models/Order.js';
import DeliveryUser from '../models/DeliveryUser.js';

// Dashboard Stats
export const getDashboardStats = async (req, res) => {
    try {
        const totalSaplings = await Sapling.countDocuments();
        const availableSaplings = await Sapling.countDocuments({ is_assigned: false });
        const totalUsers = await User.countDocuments();

        // Calculate total carbon from Verified Uploads
        const allVerified = await Upload.find({ verified: true }).select('carbon_calculated upload_date').lean();
        const totalCarbon = allVerified.reduce((acc, curr) => acc + (curr.carbon_calculated || 0), 0);

        const pendingVerifications = await Upload.countDocuments({ verified: false });

        // Latest activity
        const recentUploads = await Upload.find({ verified: true }).sort({ upload_date: -1 }).limit(5).lean();
        const userIds = [...new Set(recentUploads.map(u => u.user_id))];
        const users = await User.find({ user_id: { $in: userIds } }).select('user_id name').lean();
        const userMap = {};
        users.forEach(u => userMap[u.user_id] = u.name);

        const recentActivity = recentUploads.map(u => ({
            id: u._id,
            userName: userMap[u.user_id] || 'Unknown User',
            saplingId: u.sapling_id,
            carbon: u.carbon_calculated,
            date: u.upload_date
        }));

        // Top Contributors (Users with highest reward points/carbon)
        const topUsers = await User.find()
            .sort({ total_carbon: -1 }) // Sort by Carbon Impact
            .limit(5)
            .select('name reward_points total_carbon')
            .lean();

        // Monthly Carbon Metrics for Graph (Last 6 months)
        const monthlyCarbon = [];
        const now = new Date();

        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthName = d.toLocaleString('default', { month: 'short' });
            const yearName = d.getFullYear();
            const monthKey = `${monthName} ${yearName}`;

            // Calculate carbon for this month
            const monthCarbon = allVerified
                .filter(u => {
                    const ud = new Date(u.upload_date);
                    return ud.getMonth() === d.getMonth() && ud.getFullYear() === d.getFullYear();
                })
                .reduce((acc, curr) => acc + (curr.carbon_calculated || 0), 0);

            monthlyCarbon.push({
                name: monthKey,
                carbon: parseFloat(monthCarbon.toFixed(2))
            });
        }

        res.json({
            totalSaplings,
            availableSaplings,
            totalUsers,
            totalCarbon: parseFloat(totalCarbon.toFixed(2)),
            pendingVerifications,
            recentActivity,
            topUsers,
            monthlyCarbon
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Add Sapling (Support Bulk)
export const addSapling = async (req, res) => {
    console.log('📦 Add Sapling Request:', req.body);
    const { plant_name, plant_type, carbon_rate, shop_id, quantity = 1 } = req.body;
    try {
        const createdSaplings = [];

        // Find the last sapling to get the highest numeric ID
        const lastSapling = await Sapling.findOne().sort({ created_at: -1 });
        let lastIdNum = 0;
        if (lastSapling && lastSapling.sapling_id) {
            const match = lastSapling.sapling_id.match(/\d+/);
            if (match) lastIdNum = parseInt(match[0]);
        }

        for (let i = 0; i < quantity; i++) {
            const nextIdNum = lastIdNum + i + 1;
            const sapling_id = `SAP${String(nextIdNum).padStart(3, '0')}`;
            const qr_code_string = `QR_${sapling_id}`;

            console.log(`Creating sapling ${i + 1}/${quantity}: ${sapling_id}`);

            // Generate QR Data URL
            const qrDataUrl = await QRCode.toDataURL(qr_code_string);

            const newSapling = await Sapling.create({
                sapling_id,
                plant_name: plant_name || 'Unknown Plant',
                plant_type: plant_type || 'General',
                carbon_rate: carbon_rate || 20,
                qr_code: qr_code_string,
                shop_id: shop_id || 'MAIN_STORE',
                is_assigned: false,
                status: 'available'
            });
            createdSaplings.push({ sapling: newSapling, qrDataUrl });
        }

        console.log(`✅ Successfully added ${quantity} saplings`);
        res.status(201).json({
            message: `${quantity} sapling(s) added successfully`,
            saplings: createdSaplings
        });
    } catch (error) {
        console.error('❌ Add Sapling Error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get All Saplings (With Owner Info)
export const getAllSaplings = async (req, res) => {
    try {
        const saplings = await Sapling.find()
            .populate('owner', 'name email')
            .sort({ created_at: -1 });
        res.json(saplings);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get Users
export const getAllUsers = async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get Pending Verifications
export const getPendingVerifications = async (req, res) => {
    try {
        const uploads = await Upload.find({ verified: false }).sort({ upload_date: -1 }).lean();

        const userIds = [...new Set(uploads.map(u => u.user_id))];
        const users = await User.find({ user_id: { $in: userIds } }).select('user_id name email').lean();

        const userMap = {};
        users.forEach(u => userMap[u.user_id] = u);

        const enrichedUploads = uploads.map(u => ({
            ...u,
            userName: userMap[u.user_id]?.name || 'Unknown User',
            userEmail: userMap[u.user_id]?.email || 'N/A'
        }));

        res.json(enrichedUploads);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get All Delivery Staff
export const getAllDeliveryStaff = async (req, res) => {
    try {
        const staff = await mongoose.model('DeliveryUser').find({ status: 'active' }).select('name mobile');
        res.json(staff);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get All Orders (New)
export const getAllOrders = async (req, res) => {
    try {
        const orders = await Order.find()
            .sort({ order_date: -1 }).lean();

        // 1. Manual Populate User Details (Customers)
        const userIds = [...new Set(orders.map(o => o.user_id))];
        const users = await mongoose.model('User').find({ user_id: { $in: userIds } }).select('user_id name mobile');
        const userMap = {};
        users.forEach(u => userMap[u.user_id] = u);

        // 2. Manual Populate Delivery Details
        const deliveryIds = [...new Set(orders.map(o => o.assigned_delivery_person))].filter(Boolean);
        const deliveryStaff = await DeliveryUser.find({ _id: { $in: deliveryIds } }).select('name mobile');
        const deliveryMap = {};
        deliveryStaff.forEach(d => deliveryMap[d._id.toString()] = d);

        const enrichedOrders = orders.map(order => {
            const deliveryIdStr = order.assigned_delivery_person?.toString();
            return {
                ...order,
                customer_name: userMap[order.user_id]?.name || 'Unknown',
                customer_mobile: userMap[order.user_id]?.mobile || 'N/A',
                assigned_delivery_person: deliveryMap[deliveryIdStr] || (order.assigned_delivery_person ? { name: 'Assigned (ID: ' + deliveryIdStr + ')' } : null)
            };
        });

        res.json(enrichedOrders);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Verify Shop Pickup
export const verifyPickup = async (req, res) => {
    const { orderId, otp } = req.body;
    try {
        const order = await Order.findOne({ order_id: orderId });
        if (!order) return res.status(404).json({ message: 'Order not found' });

        if (order.verification_code !== otp) {
            return res.status(400).json({ message: 'Incorrect OTP' });
        }

        order.status = 'Delivered'; // Or 'Picked Up'
        order.delivered_date = Date.now();
        await order.save();

        res.json({ message: 'Pickup Verified Successfully', order });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Assign Order to Delivery Person
export const assignOrder = async (req, res) => {
    const { orderId } = req.params;
    const { deliveryId } = req.body;

    try {
        const order = await Order.findOne({ order_id: orderId });
        if (!order) return res.status(404).json({ message: 'Order not found' });

        // Find Delivery Person
        const deliveryPerson = await mongoose.model('DeliveryUser').findById(deliveryId);
        if (!deliveryPerson) return res.status(404).json({ message: 'Delivery person not found' });

        order.assigned_delivery_person = deliveryId;
        order.status = 'Assigned';
        await order.save();

        // Also update Delivery User's assigned orders list (optional but good for ref)
        deliveryPerson.assigned_orders.push(order._id);
        await deliveryPerson.save();

        res.json({ message: 'Order assigned successfully', order });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};


// Verify Image
export const verifyImage = async (req, res) => {
    const { uploadId } = req.params;
    const { status } = req.body; // status: 'approved' or 'rejected'

    try {
        const upload = await Upload.findById(uploadId);
        if (!upload) return res.status(404).json({ message: 'Upload not found' });

        if (status === 'approved') {
            upload.verified = true;
            await upload.save();

            // Logic to award coins (Fixed amount if not using dynamic formula anymore)
            const user = await User.findOne({ user_id: upload.user_id });
            if (user) {
                user.reward_points += 50; // Original fixed reward
                user.total_carbon += 20; // Original fixed carbon
                await user.save();
            }
        } else {
            // Just delete or mark as rejected
            await Upload.findByIdAndDelete(uploadId);
        }

        res.json({ message: 'Verification processed' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get All Redemption Requests
export const getRedemptions = async (req, res) => {
    try {
        const redemptions = await Redemption.find().sort({ request_date: -1 });
        res.json(redemptions);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Handle Redemption (Approve/Reject)
export const handleRedemption = async (req, res) => {
    const { redemptionId } = req.params;
    const { status, adminRemarks } = req.body; // status: 'Approved' or 'Rejected'

    try {
        const redemption = await Redemption.findById(redemptionId);
        if (!redemption) return res.status(404).json({ message: 'Redemption request not found' });

        redemption.status = status;
        redemption.admin_remarks = adminRemarks;
        redemption.processed_date = Date.now();
        await redemption.save();

        // Deduct points if approved
        if (status === 'Approved') {
            const user = await User.findOne({ user_id: redemption.user_id });
            if (user) {
                user.reward_points -= redemption.eco_coins_required;
                await user.save();
            }
        }

        res.json({ message: `Redemption ${status}`, redemption });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Delete Sapling
export const deleteSapling = async (req, res) => {
    let { id } = req.params;
    id = id.trim(); // Sanitize
    console.log(`🗑️ Deleting sapling attempt. Provided ID: [${id}]`);

    try {
        // 1. Try deleting by Mongo _id
        let sapling = null;
        if (mongoose.Types.ObjectId.isValid(id)) {
            sapling = await Sapling.findByIdAndDelete(id);
        }

        // 2. Fallback: Try deleting by sapling_id (e.g., SAP001) if not found or not valid _id
        if (!sapling) {
            console.log(`🔍 Not found by hex ID, trying by sapling_id: [${id}]`);
            sapling = await Sapling.findOneAndDelete({ sapling_id: id });
        }

        if (!sapling) {
            console.log('❌ Sapling not found in database by any identifier');
            return res.status(404).json({ message: 'Sapling not found' });
        }

        console.log(`✅ Sapling [${sapling.sapling_id}] deleted successfully`);
        res.json({ message: 'Sapling deleted successfully' });
    } catch (error) {
        console.error('❌ Delete Sapling Error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
// Get Detailed User Activity History
export const getUserHistory = async (req, res) => {
    let { userId } = req.params;
    userId = userId.trim();
    try {
        console.log(`📊 Fetching history for user: [${userId}]`);
        let user = await User.findOne({ user_id: userId }).select('-password').lean();

        // Fallback: Try case-insensitive if exact match fails
        if (!user) {
            user = await User.findOne({ user_id: { $regex: new RegExp(`^${userId}$`, 'i') } }).select('-password').lean();
        }

        if (!user) {
            console.warn(`❌ User not found even with fallback: [${userId}]`);
            return res.status(404).json({ message: 'User not found' });
        }

        const finalUserId = user.user_id; // Use the actual ID from DB
        const uploads = await Upload.find({ user_id: finalUserId }).sort({ upload_date: -1 }).lean();
        const redemptions = await Redemption.find({ user_id: finalUserId }).sort({ request_date: -1 }).lean();

        res.json({
            user,
            uploads,
            redemptions
        });
    } catch (error) {
        console.error('❌ User History Error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
// Get Users eligible for Certification (Threshold based)
export const getEligibleUsers = async (req, res) => {
    try {
        // Thresholds: 50, 100, 500 kg
        const users = await User.find({ total_carbon: { $gte: 1 } }) // Lowered for demo/testing if needed, but logic remains
            .select('user_id name total_carbon registered_date')
            .lean();

        // Add level based on carbon and check if certificate exists
        const enrichedUsers = await Promise.all(users.map(async (u) => {
            const level = u.total_carbon >= 500 ? 'Platinum' : u.total_carbon >= 100 ? 'Gold' : u.total_carbon >= 50 ? 'Silver' : 'Seedling';

            // Check if certificate has been issued for this user and level
            const certificate = await Certificate.findOne({
                user_id: u.user_id,
                certificate_type: level
            });

            return {
                ...u,
                level,
                certificateIssued: !!certificate,
                certificateDate: certificate?.issue_date
            };
        }));

        res.json(enrichedUsers);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Issue Carbon Certificate
export const issueCertificate = async (req, res) => {
    const { userId } = req.params;
    const { certificateType } = req.body;
    try {
        const user = await User.findOne({ user_id: userId });
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Check if certificate already exists for this user and type
        const existingCert = await Certificate.findOne({ user_id: userId, certificate_type: certificateType });
        if (existingCert) {
            return res.status(400).json({ message: `Certificate of type ${certificateType} already issued for this user.` });
        }

        console.log(`📜 Issuing ${certificateType} Certificate to ${user.name} (${userId})`);

        // Generate serial number: GM-CERT-20251219-XXXXX
        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        const serialNumber = `GM-CERT-${dateStr}-${randomNum}`;

        const newCertificate = await Certificate.create({
            user_id: userId,
            user_name: user.name,
            certificate_type: certificateType,
            total_carbon: user.total_carbon,
            eco_coins: user.reward_points,
            serial_number: serialNumber
        });

        await Notification.create({
            user_id: userId,
            title: 'Certification Issued! 📜',
            message: `Congratulations! You have been awarded the ${certificateType} Carbon Offset Certificate (Serial: ${serialNumber}) for your outstanding environmental contribution.`,
            type: 'reward'
        });

        res.json({
            message: 'Certificate issued successfully and user notified.',
            certificate: newCertificate
        });
    } catch (error) {
        console.error('❌ Issue Certificate Error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// --- REWARD CATALOG MODULE ---

import RewardCatalog from '../models/RewardCatalog.js';

// Get Reward Catalog
export const getAdminRewardCatalog = async (req, res) => {
    try {
        const catalog = await RewardCatalog.find().sort({ created_at: -1 });
        res.json(catalog);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Add Reward Item
export const addRewardToCatalog = async (req, res) => {
    try {
        const { reward_id, reward_name, reward_type, eco_coins_required, money_value, description, image_url } = req.body;

        // Check if exists
        const existing = await RewardCatalog.findOne({ reward_id });
        if (existing) return res.status(400).json({ message: 'Reward ID already exists' });

        const newReward = await RewardCatalog.create({
            reward_id,
            reward_name,
            reward_type,
            eco_coins_required,
            money_value: reward_type === 'money' ? money_value : undefined,
            description,
            image_url,
            active: true
        });

        res.status(201).json({ message: 'Reward added to catalog', reward: newReward });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Update Reward (Stock or Active Status)
export const updateRewardCatalog = async (req, res) => {
    const { id } = req.params;
    const { active, stock } = req.body;
    try {
        const reward = await RewardCatalog.findByIdAndUpdate(id, { active, stock }, { new: true });
        res.json({ message: 'Reward updated', reward });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// --- REDEMPTION MODULE UPDATE ---

// Approve Redemption & Generate Code
export const approveRedemption = async (req, res) => {
    const { redemptionId } = req.params;
    const { adminId } = req.body; // Pass admin ID for audit

    try {
        const redemption = await Redemption.findById(redemptionId);
        if (!redemption) return res.status(404).json({ message: 'Redemption not found' });
        if (redemption.status !== 'Pending') return res.status(400).json({ message: 'Request is not pending' });

        const user = await User.findOne({ user_id: redemption.user_id });
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Double check balance
        if ((user.reward_points || 0) < redemption.eco_coins_used) {
            return res.status(400).json({ message: 'User has insufficient coins balance' });
        }

        // Deduct Coins
        user.reward_points -= redemption.eco_coins_used;
        await user.save();

        // Generate Unique Code
        const code = `GM-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

        redemption.status = 'Approved';
        redemption.redemption_code = code;
        redemption.approved_by = adminId || 'Admin';
        redemption.approved_at = Date.now();
        redemption.admin_remarks = 'Approved. Code generated.';
        await redemption.save();

        // Notify User
        await Notification.create({
            user_id: user.user_id,
            title: 'Redemption Approved! 🎉',
            message: `Your request for ${redemption.reward_name} is approved. Code: ${code}. Show this at the center to claim.`,
            type: 'reward'
        });

        res.json({ message: 'Approved successfully', redemption });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Reject Redemption
export const rejectRedemption = async (req, res) => {
    const { redemptionId } = req.params;
    const { remarks } = req.body;

    try {
        const redemption = await Redemption.findByIdAndUpdate(redemptionId, {
            status: 'Rejected',
            admin_remarks: remarks || 'Rejected by Admin',
            processed_date: Date.now()
        }, { new: true });

        // Notify User
        await Notification.create({
            user_id: redemption.user_id,
            title: 'Redemption Rejected ❌',
            message: `Your request for ${redemption.reward_name} was rejected. Note: ${remarks}`,
            type: 'alert'
        });

        res.json({ message: 'Rejected', redemption });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Mark as Redeemed (Shop Action)
export const markRedeemed = async (req, res) => {
    const { redemptionId } = req.params;
    try {
        const redemption = await Redemption.findByIdAndUpdate(redemptionId, {
            status: 'Redeemed',
            redeemed: true,
            redeemed_date: Date.now()
        }, { new: true });

        res.json({ message: 'Marked as Redeemed', redemption });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get Verified Uploads (History)
export const getVerifiedUploads = async (req, res) => {
    try {
        const uploads = await Upload.find({ verified: true })
            .sort({ upload_date: -1 })
            .limit(50)
            .lean(); // Limit to last 50 verified uploads

        res.json(uploads);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
