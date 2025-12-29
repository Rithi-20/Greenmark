import express from 'express';
import bcrypt from 'bcryptjs';
import DeliveryUser from '../models/DeliveryUser.js';
import Order from '../models/Order.js';
import Redemption from '../models/Redemption.js';
import mongoose from 'mongoose';
import User from '../models/User.js';

const router = express.Router();

// Delivery Registration
router.post('/register', async (req, res) => {
    try {
        const { name, email, mobile, password } = req.body;

        // Check if exists
        const exists = await DeliveryUser.findOne({ $or: [{ mobile }, { email }] });
        if (exists) {
            if (exists.mobile === mobile) return res.status(400).json({ message: 'Mobile number already registered' });
            if (exists.email === email) return res.status(400).json({ message: 'Email address already registered' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await DeliveryUser.create({
            name,
            email,
            mobile,
            password: hashedPassword,
            status: 'active'
        });

        res.status(201).json({ message: 'Registration successful! Please login.' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { mobile, password } = req.body;
        console.log(`🔑 Login Attempt: Mobile/Email=${mobile}`);

        // Support both mobile and email for login
        const staff = await DeliveryUser.findOne({
            $or: [{ mobile: mobile }, { email: mobile }]
        });

        if (!staff) {
            console.log(`❌ Login Failed: Staff not found for ${mobile}`);
            return res.status(404).json({ message: 'Delivery staff not found' });
        }

        const isMatch = await bcrypt.compare(password, staff.password);
        if (!isMatch) {
            console.log(`❌ Login Failed: Password mismatch for ${mobile}`);
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        console.log(`✅ Login Success: ${staff.name}`);
        res.json({
            _id: staff._id,
            name: staff.name,
            mobile: staff.mobile
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get Assigned Orders (Pending/Out for Delivery)
router.get('/orders/:deliveryId', async (req, res) => {
    try {
        const orders = await Order.find({
            assigned_delivery_person: req.params.deliveryId,
            status: { $in: ['Assigned', 'Out for Delivery'] }
        }).sort({ order_date: -1 }).lean();

        // Manual Populate User Details (since user_id is a string, not ObjectId ref)
        const userIds = [...new Set(orders.map(o => o.user_id))];
        const users = await mongoose.model('User').find({ user_id: { $in: userIds } }).select('user_id name mobile default_address');

        const userMap = {};
        users.forEach(u => userMap[u.user_id] = u);

        const enrichedOrders = orders.map(order => ({
            ...order,
            customer_name: userMap[order.user_id]?.name || 'Unknown',
            customer_mobile: userMap[order.user_id]?.mobile || 'N/A',
            customer_address: userMap[order.user_id]?.default_address || ''
        }));

        res.json(enrichedOrders);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Verify Delivery (OTP Check)
router.post('/verify', async (req, res) => {
    try {
        const { order_id, otp } = req.body;
        const order = await Order.findOne({ order_id });

        if (!order) return res.status(404).json({ message: 'Order not found' });

        if (order.verification_code !== otp) {
            return res.status(400).json({ message: 'Incorrect OTP' });
        }

        // Update Status
        order.status = order.type === 'money' ? 'Money Delivered' : 'Delivered';
        order.delivered_date = new Date();
        await order.save();

        // Sync with Redemption Record
        await Redemption.findOneAndUpdate(
            { order_id: order_id },
            {
                status: 'Redeemed',
                redeemed: true,
                redeemed_date: new Date(),
                admin_remarks: `Delivered by staff: ${order.assigned_delivery_person}`
            }
        );

        res.json({ message: 'Delivery Verified Successfully. Admin panel updated to Redeemed.', order });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Delivery History
router.get('/history/:deliveryId', async (req, res) => {
    try {
        const orders = await Order.find({
            assigned_delivery_person: req.params.deliveryId,
            status: { $in: ['Delivered', 'Money Delivered'] }
        }).sort({ delivered_date: -1 });
        res.json(orders);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get Available Orders (Unassigned)
router.get('/available', async (req, res) => {
    try {
        const allOrders = await Order.find().sort({ order_date: -1 }).lean();
        console.log(`[DELIVERY] Scanning ${allOrders.length} total orders for available broadcasts...`);

        const orders = allOrders.filter(o => {
            // Check if unassigned
            const isUnassigned = !o.assigned_delivery_person ||
                o.assigned_delivery_person === "" ||
                o.assigned_delivery_person === "null" ||
                (typeof o.assigned_delivery_person === 'object' && Object.keys(o.assigned_delivery_person).length === 0);

            // Check if status is appropriate (any initial status)
            const isPlaced = !o.status || /placed|order/i.test(o.status);

            // Match criteria
            return isUnassigned && isPlaced;
        });

        console.log(`[DELIVERY] Found ${orders.length} available orders.`);

        // Manual Populate User Details
        const userIds = [...new Set(orders.map(o => o.user_id))];
        const users = await User.find({ user_id: { $in: userIds } }).select('user_id name mobile default_address');

        const userMap = {};
        users.forEach(u => userMap[u.user_id] = u);

        const enrichedOrders = orders.map(order => ({
            ...order,
            customer_name: userMap[order.user_id]?.name || 'Unknown',
            customer_mobile: userMap[order.user_id]?.mobile || 'N/A',
            customer_address: userMap[order.user_id]?.default_address || ''
        }));

        res.json(enrichedOrders);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Accept Order
router.post('/accept', async (req, res) => {
    const { order_id, delivery_id } = req.body;
    try {
        const order = await Order.findOne({ order_id });
        if (!order) return res.status(404).json({ message: 'Order not found' });

        if (order.assigned_delivery_person) {
            return res.status(400).json({ message: 'Order already taken by another partner.' });
        }

        order.assigned_delivery_person = delivery_id;
        order.status = 'Assigned';
        await order.save();

        // Sync with DeliveryUser model
        await DeliveryUser.findByIdAndUpdate(delivery_id, {
            $addToSet: { assigned_orders: order._id }
        });

        res.json({ message: 'Order accepted successfully!', order });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

export default router;
