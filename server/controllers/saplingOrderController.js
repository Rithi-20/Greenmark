import SaplingOrder from '../models/SaplingOrder.js';
import Sapling from '../models/Sapling.js';
import User from '../models/User.js';
import Upload from '../models/Upload.js';
import { v4 as uuidv4 } from 'uuid';

// Helper to create the initial Upload record so it shows in stats
const createInitialUploadRecord = async (userId, saplingId, photoPath, location) => {
    try {
        console.log(`📸 Creating Initial Upload Record for ${saplingId}...`);

        // Check if already exists to prevent duplicates
        const existing = await Upload.findOne({ sapling_id: saplingId, is_initial_photo: true });
        if (existing) {
            console.log('⚠️ Initial upload already exists, skipping.');
            return;
        }

        await Upload.create({
            user_id: userId,
            sapling_id: saplingId,
            image_ipfs_hash: photoPath, // Storing local path here if IPFS not used yet
            local_path: photoPath,
            ipfs_uploaded: false,
            plant_status: 'Initial',
            growth_indicators: 'Sapling received',
            location: location || {},
            verified: true, // Initial photos from admin/shop are trusted
            carbon_calculated: 0,
            eco_coins_awarded: 0, // Coins usually awarded via Order/Redemption logic, not here to avoid double dip? Or maybe 20? 
            // User logic says "Initial sapling photo captured... +20 EcoCoins". 
            // Let's assume the Order flow might handle rewards separately or we trigger it here.
            // For now, setting 0 to be safe unless specified.
            is_initial_photo: true,
            upload_date: new Date()
        });
        console.log('✅ Initial Upload Record Created Successfully');
    } catch (error) {
        console.error('❌ Failed to create initial upload record:', error);
    }
};

export const createSaplingOrder = async (req, res) => {
    try {
        const { userId, saplingId, deliveryMethod, address, location } = req.body;

        // Handle file upload if present
        let initialPhoto = req.body.initialPhoto;
        if (req.file) {
            initialPhoto = `/uploads/saplings/${req.file.filename}`;
            console.log(`📸 Initial photo received via file upload: ${initialPhoto}`);
        } else {
            // If manual string provided (rare usually for dev testing or existing logic)
        }

        // Find the sapling template (available sapling)
        const sapling = await Sapling.findOne({ sapling_id: saplingId });
        if (!sapling) return res.status(404).json({ message: 'Sapling not found' });

        const orderId = `SORD-${Date.now()}`;

        // Determine initial status
        let initialStatus = 'pending_photo';
        if (deliveryMethod === 'shop_pickup' && initialPhoto) {
            initialStatus = 'delivered';
            console.log('✅ Shop Pickup with Photo -> Status: DELIVERED');
        }

        const newOrder = new SaplingOrder({
            order_id: orderId,
            user_id: userId,
            sapling_id: saplingId,
            plant_name: sapling.plant_name,
            plant_type: sapling.plant_type,
            qr_code: sapling.qr_code,
            delivery_method: deliveryMethod,
            delivery_address: deliveryMethod === 'online_delivery' ? JSON.parse(address) : null,
            location: location ? JSON.parse(location) : null,
            initial_photo: initialPhoto || null,
            status: initialStatus,
            otp: Math.floor(1000 + Math.random() * 9000).toString()
        });

        await newOrder.save();

        if (deliveryMethod === 'shop_pickup' && initialStatus === 'delivered') {
            const userObj = await User.findOne({ user_id: userId });
            sapling.is_assigned = true;
            sapling.owner = userObj ? userObj._id : userId;
            sapling.status = 'active';
            await sapling.save();

            if (initialPhoto) {
                await createInitialUploadRecord(userId, saplingId, initialPhoto, location ? JSON.parse(location) : null);
            }
        }

        res.status(201).json({
            success: true,
            message: 'Order placed successfully!',
            order: newOrder
        });

    } catch (error) {
        console.error('Create Sapling Order Error:', error);
        res.status(500).json({ message: error.message });
    }
};

export const adminUploadSaplingPhoto = async (req, res) => {
    try {
        console.log('📸 Photo Upload Request for:', req.params.orderId);
        const { orderId } = req.params;

        if (!req.file) {
            return res.status(400).json({ message: 'Photo is required' });
        }

        const initialPhoto = `/uploads/saplings/${req.file.filename}`;

        const order = await SaplingOrder.findOne({ order_id: orderId });
        if (!order) return res.status(404).json({ message: 'Order not found' });

        order.initial_photo = initialPhoto;

        // If it was already delivered (legacy bug), try to fix upload
        if (order.status === 'delivered') {
            console.log('⚠️ Order was already delivered but missing photo. Backfilling...');
            await createInitialUploadRecord(order.user_id, order.sapling_id, initialPhoto, order.location);
        } else {
            order.status = 'ready_for_pickup';
        }

        await order.save();

        res.json({ success: true, message: 'Photo uploaded.', order });
    } catch (error) {
        console.error('❌ Admin Photo Upload Error:', error);
        res.status(500).json({ message: error.message });
    }
};

export const getSaplingOrders = async (req, res) => {
    try {
        const { role, userId, partnerId } = req.query;
        let query = {};

        if (role === 'user') {
            query.user_id = userId;
        } else if (role === 'delivery') {
            if (partnerId && partnerId !== 'undefined' && partnerId !== 'null') {
                // Return ONLY orders assigned to this partner that aren't delivered
                query = {
                    delivery_partner_id: partnerId,
                    status: { $ne: 'delivered' }
                };
            } else {
                // Return ONLY available ones that have photos and NO partner yet
                query = {
                    status: 'ready_for_pickup',
                    $or: [
                        { delivery_partner_id: { $exists: false } },
                        { delivery_partner_id: null },
                        { delivery_partner_id: "" }
                    ]
                };
            }
        } else if (role === 'admin') {
            query = {}; // Admin sees all
        }

        console.log(`🔍 [${role}] Fetching Sapling Orders Query:`, JSON.stringify(query));
        const orders = await SaplingOrder.find(query).sort({ order_date: -1 });
        console.log(`✅ Found ${orders.length} orders`);
        res.json(orders);
    } catch (error) {
        console.error('❌ Get Sapling Orders Error:', error);
        res.status(500).json({ message: error.message });
    }
};

export const updateSaplingOrderStatus = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { status, deliveryPartnerId, otp } = req.body;

        console.log(`📝 Updating Sapling Order ${orderId} to status: ${status}`);

        const order = await SaplingOrder.findOne({ order_id: orderId });
        if (!order) return res.status(404).json({ message: 'Order not found' });

        if (status === 'delivered') {
            if (order.otp !== otp) {
                console.error(`❌ Invalid OTP: expected ${order.otp}, got ${otp}`);
                return res.status(400).json({ message: 'Invalid OTP' });
            }

            // Mark the sapling as assigned to user
            const sapling = await Sapling.findOne({ sapling_id: order.sapling_id });
            if (sapling) {
                console.log(`🌳 Assigning sapling ${order.sapling_id} to user ${order.user_id}`);

                const userObj = await User.findOne({ user_id: order.user_id });
                if (userObj) {
                    sapling.owner = userObj._id;
                    sapling.is_assigned = true;
                    sapling.status = 'active';
                    await sapling.save();
                    console.log('✅ Sapling assigned to user successfully');

                    // --- NEW: Generate Initial Upload Record ---
                    if (order.initial_photo) {
                        await createInitialUploadRecord(
                            order.user_id,
                            order.sapling_id,
                            order.initial_photo,
                            order.location
                        );
                    }
                } else {
                    console.error('❌ User not found while delivering sapling');
                }
            }
            order.delivery_date = new Date();
        }

        if (deliveryPartnerId) {
            order.delivery_partner_id = deliveryPartnerId;
            console.log(`👤 Assigned to partner: ${deliveryPartnerId}`);
        }

        order.status = status;
        await order.save();
        console.log('✅ Order status updated successfully');

        res.json({ success: true, message: `Status updated to ${status}`, order });
    } catch (error) {
        console.error('❌ Update Sapling Order Error:', error);
        res.status(500).json({ message: error.message });
    }
};
