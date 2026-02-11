import SaplingOrder from '../models/SaplingOrder.js';
import Sapling from '../models/Sapling.js';
import User from '../models/User.js';
import Upload from '../models/Upload.js';
import fs from 'fs';
import path from 'path';
import { uploadToIPFS, isIPFSConfigured } from '../services/ipfsService.js';

// Pinata Config
const PINATA_API_KEY = process.env.PINATA_API_KEY;
const PINATA_SECRET_KEY = process.env.PINATA_SECRET_KEY;

// Helper to upload file to IPFS
const uploadToPinata = async (filePath) => {
    try {
        const result = await uploadToIPFS(filePath, { upload_type: 'sapling_order' });
        if (result.success) return result.gatewayUrl;
        return null;
    } catch (error) {
        console.error('Error uploading to IPFS:', error);
        return null; // Fallback handled by caller
    }
};

const createInitialUploadRecord = async (userId, saplingId, photoUrl, location, base64) => {
    try {
        console.log(`📸 [createInitialUploadRecord] Starting for Sapling: ${saplingId}, User: ${userId}`);

        // Check if already exists to prevent duplicates
        const existing = await Upload.findOne({ sapling_id: saplingId, is_initial_photo: true });
        if (existing) {
            console.log(`⚠️ Initial upload for ${saplingId} already exists (ID: ${existing._id}), skipping.`);
            return;
        }

        console.log(`🚀 Creating new Initial Upload record for ${saplingId}...`);

        await Upload.create({
            user_id: userId,
            sapling_id: saplingId,
            image_ipfs_hash: photoUrl,
            image_base64: base64, // Store Base64 for faster retrieval on Vercel
            local_path: photoUrl, // Use URL for both fields for compatibility
            ipfs_uploaded: photoUrl?.startsWith('http'),
            plant_status: 'Initial',
            growth_indicators: 'Sapling received',
            location: location || {},
            verified: true, // Initial photos from admin/shop are trusted
            carbon_calculated: 0,
            eco_coins_awarded: 0,
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
        let initialPhotoBase64 = null;

        if (req.file) {
            console.log('📤 Processing initial photo...');

            // Read Base64 immediately for persistence
            try {
                const buffer = fs.readFileSync(req.file.path);
                initialPhotoBase64 = `data:${req.file.mimetype};base64,${buffer.toString('base64')}`;
            } catch (err) {
                console.error('Failed to generate base64:', err);
            }

            try {
                // Upload the file from temp storage to Pinata
                initialPhoto = await uploadToPinata(req.file.path);
                console.log(`✅ Image uploaded to Pinata: ${initialPhoto}`);

                // Clean up temp file
                if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
            } catch (err) {
                console.error('Failed to upload to Pinata, falling back to local filename:', err);
                initialPhoto = req.file.filename;
            }
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
            initial_photo_base64: initialPhotoBase64,
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
                await createInitialUploadRecord(userId, saplingId, initialPhoto, location ? JSON.parse(location) : null, initialPhotoBase64);
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

        let initialPhoto;
        let initialPhotoBase64 = null;
        try {
            // Read Base64 immediately
            const buffer = fs.readFileSync(req.file.path);
            initialPhotoBase64 = `data:${req.file.mimetype};base64,${buffer.toString('base64')}`;

            initialPhoto = await uploadToPinata(req.file.path);
            if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path); // Clean up
        } catch (err) {
            console.error('Photo Process or Pinata Upload Failed:', err);
            initialPhoto = req.file.filename;
        }

        const order = await SaplingOrder.findOne({ order_id: orderId });
        if (!order) return res.status(404).json({ message: 'Order not found' });

        order.initial_photo = initialPhoto;
        order.initial_photo_base64 = initialPhotoBase64;

        // If it was already delivered (legacy bug), try to fix upload
        if (order.status === 'delivered') {
            console.log('⚠️ Order was already delivered but missing photo. Backfilling...');
            await createInitialUploadRecord(order.user_id, order.sapling_id, initialPhoto, order.location, initialPhotoBase64);
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
        const ordersRec = await SaplingOrder.find(query).sort({ order_date: -1 }).lean();

        // Enrich with proper image URL (prioritize base64)
        const orders = ordersRec.map(o => ({
            ...o,
            initial_photo: o.initial_photo_base64 || o.initial_photo
        }));

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
        let { status, deliveryPartnerId, otp } = req.body;

        if (status) status = status.toLowerCase(); // Standardize to match model enum

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
                } else {
                    console.warn(`⚠️ User record not found for user_id: ${order.user_id}, but continuing assignment...`);
                    sapling.is_assigned = true;
                    sapling.status = 'active';
                    await sapling.save();
                }

                // --- NEW: Generate Initial Upload Record ---
                // We run this even if userObj isn't perfectly matched in the lookup above
                if (order.initial_photo) {
                    await createInitialUploadRecord(
                        order.user_id,
                        order.sapling_id,
                        order.initial_photo,
                        order.location,
                        order.initial_photo_base64
                    );
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
