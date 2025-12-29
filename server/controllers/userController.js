import User from '../models/User.js';
import Sapling from '../models/Sapling.js';
import Upload from '../models/Upload.js';
import UserSapling from '../models/UserSapling.js';
import Reward from '../models/Reward.js';
import Notification from '../models/Notification.js';
import mongoose from 'mongoose';
import Redemption from '../models/Redemption.js';
import Admin from '../models/Admin.js';
import Certificate from '../models/Certificate.js';
import bcrypt from 'bcrypt';
import fs from 'fs';
import path from 'path';

// IPFS and Verification Services
import { uploadToIPFS, isIPFSConfigured } from '../services/ipfsService.js';
import { analyzePhotoAuthenticity, quickAuthenticityCheck } from '../services/photoAuthenticityService.js';
import { verifyGrowthUpdate, estimateGrowth } from '../services/imageComparisonService.js';
import { recognizeSapling, validateSaplingPhoto } from '../services/saplingRecognitionService.js';
import { calculateUploadCredits } from '../services/creditCalculationService.js';

// Get User Dashboard Stats
export const getUserStats = async (req, res) => {
    try {
        const { userId } = req.params;
        console.log(`📨 Fetching stats for: ${userId}`);

        let actor = await User.findOne({ user_id: userId });
        if (!actor && userId && mongoose.Types.ObjectId.isValid(userId)) {
            actor = await User.findById(userId);
        }

        if (!actor) {
            actor = await Admin.findOne({ admin_id: userId });
            if (!actor && userId && mongoose.Types.ObjectId.isValid(userId)) {
                actor = await Admin.findById(userId);
            }
        }

        if (!actor) return res.status(404).json({ message: 'User not found' });

        const saplingsCount = await Sapling.countDocuments({ owner: actor._id });
        const actorPublicId = actor.user_id || actor.admin_id;
        const uploads = await Upload.find({ user_id: actorPublicId, verified: true });
        const totalCarbon = uploads.reduce((acc, curr) => acc + (curr.carbon_calculated || 0), 0);

        // SYNC REWARD COLLECTION (Ensures it is never empty for active users)
        try {
            console.log(`💎 Syncing Reward for: ${actorPublicId} with ${actor.reward_points} pts`);
            const rewardSync = await Reward.findOneAndUpdate(
                { user_id: actorPublicId },
                {
                    $set: { total_points: actor.reward_points || 0 },
                    $setOnInsert: { reward_level: 'Bronze' }
                },
                { upsert: true, new: true }
            );
            console.log(`✅ Reward Collection Synced: ${rewardSync.user_id}`);
        } catch (syncErr) {
            console.error('⚠️ Reward Sync Failed:', syncErr);
        }

        res.json({
            totalSaplings: saplingsCount,
            totalCarbon,
            ecoCoins: actor.reward_points || 0,
            plantHealth: 'Good'
        });
    } catch (error) {
        console.error('❌ Stats Error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Register Sapling (Scan QR + Initial Photo)
export const registerSapling = async (req, res) => {
    const { userId, qrCode, location } = req.body;
    try {
        console.log('📨 Register Sapling Request:', { userId, qrCode, hasFile: !!req.file });

        let user = await User.findOne({ user_id: userId });
        if (!user && userId && mongoose.Types.ObjectId.isValid(userId)) {
            user = await User.findById(userId);
        }

        if (!user) return res.status(404).json({ message: 'User not found' });

        const sapling = await Sapling.findOne({ qr_code: qrCode });
        if (!sapling) return res.status(404).json({ message: 'Invalid QR Code' });

        if (sapling.is_assigned) return res.status(400).json({ message: 'Sapling already registered' });

        // 1. Assign Sapling
        sapling.owner = user._id;
        sapling.is_assigned = true;
        sapling.status = 'registered';
        if (location) {
            sapling.location = typeof location === 'string' ? location : JSON.stringify(location);
        }
        await sapling.save();

        // 2. Create UserSapling record
        await UserSapling.create({
            user_id: user.user_id,
            sapling_id: sapling.sapling_id,
            location: typeof location === 'string' ? JSON.parse(location) : location,
            registered_date: new Date()
        });

        if (!user.saplingsOwned) user.saplingsOwned = [];
        user.saplingsOwned.push(sapling._id);

        // Award Registration Bonus
        const registrationBonus = 50;
        user.reward_points = (user.reward_points || 0) + registrationBonus;
        await user.save();

        // 3. Process Initial Photo (Compulsory for baseline)
        let uploadData = null;
        if (req.file) {
            console.log('📸 Processing Initial Registration Photo...');
            const localFilePath = path.join(process.cwd(), 'uploads', req.file.filename);
            const relativePath = `/uploads/${req.file.filename}`;

            try {
                // Authenticity Check
                const authResult = await analyzePhotoAuthenticity(localFilePath);

                // Recognition Check
                const recognitionResult = await recognizeSapling(localFilePath, sapling.plant_name);

                if (recognitionResult.verdict === 'WRONG_SPECIES') {
                    // Rollback Registration if species is wrong!
                    sapling.is_assigned = false;
                    sapling.owner = null;
                    await sapling.save();

                    // Remove form user list too? Yes, ideally. 
                    // But for now let's just error out and user can retry.
                    // (Simplification: assuming mostly happy path or soft checks)
                    console.warn('⚠️ Warning: Initial photo species mismatch:', recognitionResult.message);
                    // We WON'T rollback for now to avoid complex transaction rollback logic, 
                    // but we will flag the upload as unverified or send a specific warning.
                }

                // IPFS Upload
                let ipfsResult = { success: false };
                if (isIPFSConfigured()) {
                    ipfsResult = await uploadToIPFS(localFilePath, {
                        name: `initial_${sapling.sapling_id}_${Date.now()}`,
                        user_id: user.user_id,
                        sapling_id: sapling.sapling_id,
                        upload_type: 'initial_photo'
                    });
                }

                // Create Initial Upload Record
                uploadData = await Upload.create({
                    user_id: user.user_id,
                    sapling_id: sapling.sapling_id,
                    image_ipfs_hash: ipfsResult.success ? ipfsResult.ipfsHash : relativePath,
                    ipfs_gateway_url: ipfsResult.gatewayUrl,
                    local_path: relativePath,
                    ipfs_uploaded: ipfsResult.success,
                    plant_status: 'Initial',
                    growth_indicators: 'Registration Baseline',
                    location: location ? (typeof location === 'string' ? JSON.parse(location) : location) : {},
                    verified: true,
                    is_initial_photo: true, // Key for periodic comparison
                    authenticity: { score: authResult.authenticityScore, isAuthentic: authResult.isAuthentic },
                    recognition: { confidence: recognitionResult.plantConfidence },
                    carbon_calculated: 0,
                    eco_coins_awarded: 0
                });
                console.log('✅ Initial Photo Saved as Baseline');

            } catch (imgError) {
                console.error('⚠️ Initial Photo Processing Error:', imgError);
                // Don't fail the whole registration if image processing hiccups, 
                // but ideally we should hint the user to re-upload via "Upload Update" later?
                // Or just proceed.
            }
        }

        res.json({
            message: 'Sapling registered successfully! 50 Bonus Coins Added. 🌿',
            sapling,
            upload: uploadData
        });
    } catch (error) {
        console.error('❌ Register Error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get My Saplings
export const getMySaplings = async (req, res) => {
    const { userId } = req.params;
    try {
        let user = await User.findOne({ user_id: userId });
        if (!user && userId && mongoose.Types.ObjectId.isValid(userId)) {
            user = await User.findById(userId);
        }

        if (!user) return res.status(404).json({ message: 'User not found' });

        // Find all saplings where owner matches this user's _id
        const saplings = await Sapling.find({ owner: user._id }).sort({ created_at: -1 });
        res.json(saplings);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Upload Image with IPFS and Verification (Enhanced Module)
export const uploadImage = async (req, res) => {
    const { userId, saplingId, sapling_id, plant_status, growth_indicators, location, is_initial_photo } = req.body;
    const finalSaplingId = saplingId || sapling_id;

    try {
        console.log(`📸 Processing upload for User: ${userId}, Sapling: ${finalSaplingId}`);

        // 1. Validate User & Sapling
        const actor = await User.findOne({ user_id: userId }) || await Admin.findOne({ admin_id: userId });
        if (!actor) return res.status(404).json({ message: `User not found: ${userId}` });

        const sapling = await Sapling.findOne({ sapling_id: finalSaplingId });
        if (!sapling) return res.status(404).json({ message: `Sapling not found: ${finalSaplingId}` });

        // 2. Validate File
        if (!req.file) return res.status(400).json({ message: "Image file is required" });
        const localFilePath = path.join(process.cwd(), 'uploads', req.file.filename);
        const relativePath = `/uploads/${req.file.filename}`;

        // ============================================
        // STEP 0: MONTHLY LIMIT CHECK (Strict: Verified Only)
        // ============================================
        if (!is_initial_photo) {
            // Find the last VERIFIED upload for this specific sapling
            const lastVerifiedUpload = await Upload.findOne({
                sapling_id: finalSaplingId,
                verified: true,
                is_initial_photo: { $ne: true } // Don't count the initial baseline as a monthly update
            }).sort({ upload_date: -1 });

            if (lastVerifiedUpload) {
                const daysSinceLast = (Date.now() - new Date(lastVerifiedUpload.upload_date).getTime()) / (1000 * 60 * 60 * 24);
                // Limit: 25 days (approx a month with buffer)
                if (daysSinceLast < 25) {
                    fs.unlinkSync(localFilePath); // Cleanup uploaded file
                    return res.status(400).json({
                        message: `⏳ Monthly Limit Reached`,
                        details: `You already have a verified growth update from ${Math.round(daysSinceLast)} days ago.`,
                        nextUploadDate: new Date(new Date(lastVerifiedUpload.upload_date).getTime() + 25 * 24 * 60 * 60 * 1000).toDateString()
                    });
                }
            }
        }

        // ============================================
        // STEP 1: AUTHENTICITY CHECK
        // ============================================
        console.log('🔍 1. Authenticity Check...');
        const authResult = await analyzePhotoAuthenticity(localFilePath);

        if (!authResult.isAuthentic) {
            fs.unlinkSync(localFilePath);
            return res.status(400).json({
                message: '❌ Photo Check Failed: Not an original camera photo.',
                details: authResult.recommendation,
                issues: authResult.issues,
                authenticityScore: authResult.authenticityScore,
                suggestion: 'Please take a NEW photo directly with your camera app.'
            });
        }
        console.log(`   ✅ Authentic (Score: ${authResult.authenticityScore})`);

        // ============================================
        // STEP 2: SAPLING RECOGNITION (Plant.id)
        // ============================================
        console.log('🌱 2. Plant Recognition...');
        const recognitionResult = await recognizeSapling(localFilePath, sapling.plant_name);

        if (!recognitionResult.isSapling) {
            fs.unlinkSync(localFilePath);
            // Specific handling for Wrong Species
            if (recognitionResult.verdict === 'WRONG_SPECIES') {
                return res.status(400).json({
                    message: recognitionResult.message || 'Wrong plant species detected.',
                    details: recognitionResult.issues.join(', '),
                    verdict: recognitionResult.verdict,
                    plantConfidence: recognitionResult.plantConfidence
                });
            }

            // General non-plant rejection
            if (recognitionResult.plantConfidence < 40) {
                return res.status(400).json({
                    message: '❌ Photo Rejected: Does not look like a plant/sapling.',
                    details: recognitionResult.message,
                    issues: recognitionResult.issues,
                    plantConfidence: recognitionResult.plantConfidence
                });
            }
        }
        console.log(`   ✅ Valid Plant (Confidence: ${recognitionResult.plantConfidence}%)`);

        // ============================================
        // STEP 3: FRAUD/DUPLICATE & SAME SAPLING CHECK
        // ============================================
        console.log('🔒 3. Fraud & Consistency Detection...');

        // Fetch previous VERIFIED uploads to compare against valid history
        const previousUploads = await Upload.find({
            sapling_id: finalSaplingId,
            verified: true
        }).sort({ upload_date: -1 });

        const fraudResult = await verifyGrowthUpdate(localFilePath, previousUploads);

        if (fraudResult.verdict === 'FRAUD_DETECTED') {
            fs.unlinkSync(localFilePath);
            return res.status(400).json({
                message: '❌ Duplicate Photo Detected',
                details: 'This specific photo seems to have been used before.',
                fraudScore: fraudResult.fraudScore
            });
        }

        // "Same Sapling" Identity Check - Compare with the most recent verified photo
        let heuristicMessage = "Growth verified.";
        let growthEstimate = 0;
        let comparedWithDate = null;
        let comparisonScore = 0;

        if (previousUploads.length > 0) {
            const comparisonBase = previousUploads[0]; // Most recent verified

            // Resolve path (prefer local, fallback to trying to find it)
            let baseParams = null;
            if (comparisonBase.local_path && fs.existsSync(path.join(process.cwd(), comparisonBase.local_path))) {
                baseParams = path.join(process.cwd(), comparisonBase.local_path);
            }

            if (baseParams) {
                console.log(`   Comparing with last verified photo from: ${new Date(comparisonBase.upload_date).toDateString()}`);
                const growthCheck = await estimateGrowth(localFilePath, baseParams);

                growthEstimate = growthCheck.growthEstimate;
                comparisonScore = growthCheck.comparisonScore;
                comparedWithDate = comparisonBase.upload_date;

                // CRITICAL: Check if it's the SAME plant (Similarity > Threshold)
                // If similarity is < 20%, it's likely a completely different subject or plant
                // A growing plant should maintain some structural similarity (30-80%)
                if (comparisonScore < 20) {
                    // Flag as potentially different plant
                    console.warn(`   ⚠️ LOW SIMILARITY (${comparisonScore}%). Might be a different plant.`);
                    // Strict mode: Reject
                    // fs.unlinkSync(localFilePath);
                    // return res.status(400).json({
                    //    message: '❌ Verification Failed: Different Plant Detected',
                    //    details: 'This photo looks completely different from your previous sapling photos.',
                    //    similarity: comparisonScore
                    // });
                    // Permissive mode for MVP: Just warn/log, maybe reduce score
                    heuristicMessage = "⚠️ Warning: Plant looks significantly different.";
                } else {
                    console.log(`   ✅ Visual match confirmed (Similarity: ${comparisonScore}%)`);
                }
            }
        }

        // ============================================
        // STEP 5: IPFS UPLOAD
        // ============================================
        let ipfsData = { success: false, hash: null, url: null };

        if (!isIPFSConfigured()) {
            console.log('   📝 IPFS Not fully configured (missing keys/JWT). Skipping IPFS upload.');
        } else {
            console.log('☁️ 5. Uploading to IPFS...');
            const uploadRes = await uploadToIPFS(localFilePath, {
                name: `sapling_${finalSaplingId}_${Date.now()}`,
                sapling_id: finalSaplingId,
                user_id: userId
            });

            if (uploadRes.success) {
                ipfsData = {
                    success: true,
                    hash: uploadRes.ipfsHash,
                    url: uploadRes.gatewayUrl
                };
                console.log(`   ✅ IPFS Uploaded: ${uploadRes.ipfsHash}`);
            } else {
                console.warn('   ⚠️ IPFS Upload Failed (using local fallback)');
            }
        }

        // ============================================
        // STEP 6: CALCULATE & AWARD CREDITS
        // ============================================
        const tokenResult = await calculateUploadCredits({
            userId,
            saplingId: finalSaplingId,
            authenticityScore: authResult.authenticityScore,
            plantConfidence: recognitionResult.plantConfidence,
            growthEstimate,
            isFirstUpload: !!is_initial_photo || previousUploads.length === 0,
            fraudScore: fraudResult.fraudScore || 0
        });

        const totalCoins = tokenResult.totalEcoCoins;
        const totalCarbon = tokenResult.carbonCalculated;

        // ============================================
        // STEP 7: SAVE & UPDATE USER
        // ============================================
        const newUpload = await Upload.create({
            user_id: userId,
            sapling_id: finalSaplingId,
            image_ipfs_hash: ipfsData.hash || relativePath,
            ipfs_gateway_url: ipfsData.url,
            local_path: relativePath,
            ipfs_uploaded: ipfsData.success,

            plant_status: plant_status || 'Healthy',
            growth_indicators: growth_indicators || heuristicMessage,
            location: location ? (typeof location === 'string' ? JSON.parse(location) : location) : { latitude: 0, longitude: 0 },

            verified: true, // AUTO-VERIFIED because it passed all checks

            authenticity: { score: authResult.authenticityScore, isAuthentic: true },
            recognition: { confidence: recognitionResult.plantConfidence },
            growthComparison: {
                growthEstimate,
                comparedWithDate,
                similarityScore: comparisonScore
            },

            eco_coins_awarded: totalCoins,
            carbon_calculated: totalCarbon,
            creditBreakdown: tokenResult.breakdown,
            is_initial_photo: !!is_initial_photo
        });

        // Update User Balance
        if (actor) {
            actor.reward_points = (actor.reward_points || 0) + totalCoins;
            actor.total_carbon = (actor.total_carbon || 0) + totalCarbon;
            await actor.save();

            // Sync with Rewards collection
            await Reward.findOneAndUpdate(
                { user_id: userId },
                { $set: { total_points: actor.reward_points } },
                { upsert: true }
            );
        }

        console.log(`✅ Success! Awarded ${totalCoins} coins.`);

        res.status(201).json({
            message: 'Photo Verified & Credits Awarded! 🎉',
            upload: newUpload,
            credits: {
                coins: totalCoins,
                carbon: totalCarbon,
                newBalance: actor.reward_points,
                breakdown: tokenResult.breakdown
            }
        });

    } catch (error) {
        console.error('❌ Upload Error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Request Reward Redemption
export const requestRedemption = async (req, res) => {
    const { userId, reward_id, method, amount_value } = req.body;

    // amount_value required only if reward type is money (though handled via catalog usually)

    try {
        let user = await User.findOne({ user_id: userId });
        if (!user && userId && mongoose.Types.ObjectId.isValid(userId)) {
            user = await User.findById(userId);
        }
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Fetch Reward Details
        const reward = await RewardCatalog.findOne({ reward_id });
        if (!reward) return res.status(404).json({ message: 'Reward not found' });
        if (!reward.active) return res.status(400).json({ message: 'Reward is inactive' });

        if ((user.reward_points || 0) < reward.eco_coins_required) {
            return res.status(400).json({ message: 'Insufficient EcoCoins' });
        }

        // Generate Request ID: RED-YYYYMMDD-XXXX
        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        const requestId = `RED-${dateStr}-${randomNum}`;

        await Redemption.create({
            request_id: requestId,
            user_id: user.user_id,
            reward_id: reward.reward_id,
            reward_name: reward.reward_name,
            redeem_type: reward.reward_type,
            method: method || 'online',
            eco_coins_used: reward.eco_coins_required,
            amount_value: reward.reward_type === 'money' ? reward.money_value : undefined,
            status: 'Pending'
        });

        res.status(201).json({ message: 'Redemption request submitted successfully', request_id: requestId });
    } catch (error) {
        console.error('Redemption Request Error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get Available Saplings
export const getAvailableSaplings = async (req, res) => {
    try {
        const saplings = await Sapling.find({ is_assigned: false, status: 'available' });
        res.json(saplings);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

import RewardCatalog from '../models/RewardCatalog.js';

// Get Rewards Catalog
export const getRewards = async (req, res) => {
    try {
        const rewards = await RewardCatalog.find({ active: true }).sort({ eco_coins_required: 1 });
        res.json(rewards);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
// Get Detailed Sapling Statistics & History
export const getSaplingStats = async (req, res) => {
    let { saplingId } = req.params;
    saplingId = saplingId.trim();

    try {
        const sapling = await Sapling.findOne({ sapling_id: saplingId });
        if (!sapling) return res.status(404).json({ message: `Sapling ${saplingId} not found` });

        const uploads = await Upload.find({ sapling_id: saplingId }).sort({ upload_date: -1 });

        res.json({
            sapling,
            history: uploads
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
// Get User Notifications
export const getNotifications = async (req, res) => {
    const { userId } = req.params;
    try {
        const notifications = await Notification.find({ user_id: userId }).sort({ sent_date: -1 }).limit(20);
        res.json(notifications);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Mark Notification as Read
export const markNotificationRead = async (req, res) => {
    const { notificationId } = req.params;
    try {
        await Notification.findByIdAndUpdate(notificationId, { read: true });
        res.json({ message: 'Notification marked as read' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get User Certificates
export const getUserCertificates = async (req, res) => {
    const { userId } = req.params;
    try {
        const certificates = await Certificate.find({ user_id: userId }).sort({ issue_date: -1 });
        res.json(certificates);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Update User Settings
export const updateUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const { name, mobile, password } = req.body;

        console.log(' Updating user settings for:', userId);

        // Find user
        let user = await User.findOne({ user_id: userId });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Update fields
        if (name) user.name = name;
        if (mobile) user.mobile = mobile;
        if (password) {
            // Hash password before saving
            user.password = await bcrypt.hash(password, 10);
        }

        await user.save();

        res.json({
            message: 'Settings updated successfully',
            user: {
                user_id: user.user_id,
                name: user.name,
                email: user.email,
                mobile: user.mobile
            }
        });
    } catch (error) {
        console.error(' Update User Error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

import Order from '../models/Order.js';

// OpenRouteService Helper
const calculateRouteDistance = async (origin, destination) => {
    // origin/destination = { lat, long }
    // Using OpenRouteService API
    const apiKey = process.env.OPENROUTESERVICE_API_KEY;
    if (!apiKey) {
        console.warn('⚠️ No OpenRouteService API Key found. Using fallback calculation.');
        return null;
    }

    // ORS expects [long, lat]
    const url = `https://api.openrouteservice.org/v2/directions/driving-car?api_key=${apiKey}&start=${origin.long},${origin.lat}&end=${destination.long},${destination.lat}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.features && data.features.length > 0) {
            const props = data.features[0].properties;
            const distanceKm = (props.segments[0].distance / 1000).toFixed(2);
            // distance in meters
            return parseFloat(distanceKm);
        }
        return null;
    } catch (e) {
        console.error('ORS API Error:', e);
        return null;
    }
};

// Fallback Haversine
const calculateHaversine = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return parseFloat((R * c).toFixed(2));
};

// Place Order
export const placeOrder = async (req, res) => {
    try {
        const { userId, reward_id, type, product_name, amount_value, delivery_address, delivery_lat, delivery_long, method } = req.body;

        // 1. Validate User
        const user = await User.findOne({ user_id: userId });
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Normalize Address (Handle line1 vs address_line_1 mismatch)
        let finalAddress = { ...delivery_address };
        if (delivery_address.line1 && !delivery_address.address_line_1) {
            finalAddress.address_line_1 = delivery_address.line1;
        }
        if (delivery_address.line2 && !delivery_address.address_line_2) {
            finalAddress.address_line_2 = delivery_address.line2;
        }

        // 2. Validate Origin (Shop)
        const shopLocation = { lat: 11.0601, long: 77.0270 }; // Dr. N.G.P Institute
        const userLocation = { lat: parseFloat(delivery_lat), long: parseFloat(delivery_long) };

        // 3. Calculate Distance
        let distanceKm = await calculateRouteDistance(shopLocation, userLocation);

        // Fallback if ORS fails or no key
        if (distanceKm === null) {
            distanceKm = calculateHaversine(shopLocation.lat, shopLocation.long, userLocation.lat, userLocation.long);
        }

        // 4. Determine Estimated Days
        // Rule: 50-70km -> 1 day, >70km -> 3-5 days. If <50km, assume Same Day or 1 Day
        let estimatedDays = "1 day";
        if (distanceKm > 70) {
            estimatedDays = "3-5 days";
        } else if (distanceKm >= 50) {
            estimatedDays = "1 day";
        } else {
            estimatedDays = "Same Day / 1 Day"; // Closer than 50km
        }

        // 5. Create Order
        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        const orderId = `ORD-${dateStr}-${randomNum}`;
        const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digit

        const newOrder = await Order.create({
            order_id: orderId,
            user_id: userId,
            reward_id,
            type,
            product_name,
            amount_value,
            delivery_address: finalAddress,
            delivery_lat,
            delivery_long,
            distance_km: distanceKm,
            estimated_days: estimatedDays,
            verification_code: otp,
            status: 'Order Placed',
            method // 'online' or 'offline' (Shop Pickup)
        });

        // Also deduct points if not handled by Redemption
        if (reward_id) {
            const reward = await RewardCatalog.findOne({ reward_id });
            if (reward) {
                user.reward_points -= reward.eco_coins_required;
                await user.save();

                // Create a redemption record too for syncing history?
                // Or we can just use Order as the primal record.
                // For now, let's also create a Redemption record so existing admin panel sees it partially
                await Redemption.create({
                    request_id: `RED-${dateStr}-${randomNum}`,
                    user_id: user.user_id,
                    reward_id: reward.reward_id,
                    reward_name: reward.reward_name,
                    redeem_type: reward.reward_type,
                    method: method || 'online',
                    eco_coins_used: reward.eco_coins_required,
                    amount_value: reward.reward_type === 'money' ? reward.money_value : undefined,
                    status: 'Pending', // Will be marked 'Redeemed' only after delivery verification
                    order_id: orderId,
                    redeemed: false
                });
            }
        }

        // Send Notification
        await Notification.create({
            user_id: userId,
            title: 'Order Placed',
            message: `Your order ${orderId} has been placed. Estimated delivery: ${estimatedDays}.`,
            type: 'system'
        });

        res.status(201).json({
            message: 'Order placed successfully',
            order_id: orderId,
            distance_km: distanceKm,
            estimated_days: estimatedDays,
            otp: otp
        });

    } catch (err) {
        console.error("Place Order Error:", err);
        res.status(500).json({ message: err.message });
    }
};

// Get User Orders
export const getUserOrders = async (req, res) => {
    try {
        const { userId } = req.params;
        const orders = await Order.find({ user_id: userId }).sort({ order_date: -1 });
        res.json(orders);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Upload Initial Photo (At sapling handover)
export const uploadInitialPhoto = async (req, res) => {
    const { userId, saplingId, sapling_id, location } = req.body;
    const finalSaplingId = saplingId || sapling_id;

    try {
        console.log('📸 Uploading initial sapling photo at handover...');

        // Validate User
        const actor = await User.findOne({ user_id: userId }) || await Admin.findOne({ admin_id: userId });
        if (!actor) return res.status(404).json({ message: `User not found: ${userId}` });

        // Validate Sapling
        const sapling = await Sapling.findOne({ sapling_id: finalSaplingId });
        if (!sapling) return res.status(404).json({ message: `Sapling not found: ${finalSaplingId}` });

        // Validate File
        if (!req.file) return res.status(400).json({ message: "Image file is required" });

        const localFilePath = path.join(process.cwd(), 'uploads', req.file.filename);
        const relativePath = `/uploads/${req.file.filename}`;

        // Run authenticity check
        const authenticityResult = await analyzePhotoAuthenticity(localFilePath);

        // Run plant recognition
        const recognitionResult = await recognizeSapling(localFilePath, sapling.plant_name);

        if (!recognitionResult.isSapling) {
            // Specific handling for Wrong Species (Initial Upload)
            if (recognitionResult.verdict === 'WRONG_SPECIES') {
                fs.unlinkSync(localFilePath);
                return res.status(400).json({
                    message: recognitionResult.message,
                    details: recognitionResult.issues.join(', '),
                    verdict: recognitionResult.verdict
                });
            }

            if (recognitionResult.plantConfidence < 20) {
                fs.unlinkSync(localFilePath);
                return res.status(400).json({
                    message: 'Photo rejected: Please take a clear photo of the sapling.',
                    plantConfidence: recognitionResult.plantConfidence
                });
            }
        }

        // Upload to IPFS if configured
        let ipfsResult = { success: false };
        if (isIPFSConfigured()) {
            ipfsResult = await uploadToIPFS(localFilePath, {
                name: `initial_${finalSaplingId}_${Date.now()}`,
                user_id: userId,
                sapling_id: finalSaplingId,
                upload_type: 'initial_photo'
            });
        }

        // Create upload record
        const upload = await Upload.create({
            user_id: userId,
            sapling_id: finalSaplingId,
            image_ipfs_hash: ipfsResult.success ? ipfsResult.ipfsHash : relativePath,
            ipfs_gateway_url: ipfsResult.gatewayUrl || null,
            local_path: relativePath,
            ipfs_uploaded: ipfsResult.success,
            plant_status: 'Initial',
            growth_indicators: 'Sapling received and planted',
            location: location ? (typeof location === 'string' ? JSON.parse(location) : location) : {},
            verified: true, // Initial photos are auto-verified
            authenticity: {
                score: authenticityResult.authenticityScore,
                verdict: authenticityResult.verdict,
                isAuthentic: authenticityResult.isAuthentic
            },
            recognition: {
                isSapling: recognitionResult.isSapling,
                confidence: recognitionResult.plantConfidence,
                verdict: recognitionResult.verdict
            },
            fraud: { score: 0, verdict: 'FIRST_UPLOAD' },
            carbon_calculated: 0,
            eco_coins_awarded: 20, // Initial registration bonus
            processing_status: 'completed',
            is_initial_photo: true
        });

        // Award initial registration coins
        if (actor.user_id) {
            const user = await User.findOne({ user_id: userId });
            if (user) {
                user.reward_points = (user.reward_points || 0) + 20;
                await user.save();
            }
        }

        res.status(201).json({
            message: 'Initial sapling photo captured successfully! +20 EcoCoins awarded.',
            upload: {
                _id: upload._id,
                image_url: ipfsResult.gatewayUrl || `http://localhost:5000${relativePath}`,
                ipfs_hash: ipfsResult.success ? ipfsResult.ipfsHash : null
            },
            credits: {
                ecoCoins: 20,
                message: 'Welcome bonus for registering your sapling!'
            }
        });

    } catch (error) {
        console.error('❌ Initial Photo Upload Error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get Upload History with Verification Data
export const getUploadHistory = async (req, res) => {
    try {
        const { userId } = req.params;
        const { saplingId } = req.query;

        const query = { user_id: userId };
        if (saplingId) {
            query.sapling_id = saplingId;
        }

        const uploads = await Upload.find(query)
            .sort({ upload_date: -1 })
            .lean();

        // Enrich with IPFS gateway URLs
        const enrichedUploads = uploads.map(upload => ({
            ...upload,
            image_url: upload.ipfs_gateway_url || `http://localhost:5000${upload.local_path || upload.image_ipfs_hash}`,
            verification_summary: {
                authenticity: upload.authenticity?.verdict || 'UNKNOWN',
                plantRecognition: upload.recognition?.verdict || 'UNKNOWN',
                fraud: upload.fraud?.verdict || 'UNKNOWN'
            }
        }));

        res.json(enrichedUploads);
    } catch (error) {
        console.error('❌ Get Upload History Error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get Verification Details for a specific upload
export const getVerificationDetails = async (req, res) => {
    try {
        const { uploadId } = req.params;

        const upload = await Upload.findById(uploadId).lean();
        if (!upload) {
            return res.status(404).json({ message: 'Upload not found' });
        }

        // Get sapling info
        const sapling = await Sapling.findOne({ sapling_id: upload.sapling_id }).lean();

        // Get comparison upload if exists
        let comparisonUpload = null;
        if (upload.growthComparison?.comparedWithUploadId) {
            comparisonUpload = await Upload.findById(upload.growthComparison.comparedWithUploadId)
                .select('upload_date image_ipfs_hash local_path ipfs_gateway_url')
                .lean();
        }

        res.json({
            upload: {
                _id: upload._id,
                upload_date: upload.upload_date,
                image_url: upload.ipfs_gateway_url || `http://localhost:5000${upload.local_path || upload.image_ipfs_hash}`,
                ipfs_hash: upload.ipfs_uploaded ? upload.image_ipfs_hash : null,
                is_initial_photo: upload.is_initial_photo
            },
            sapling: sapling ? {
                sapling_id: sapling.sapling_id,
                plant_name: sapling.plant_name,
                plant_type: sapling.plant_type,
                carbon_rate: sapling.carbon_rate
            } : null,
            verification: {
                authenticity: {
                    score: upload.authenticity?.score || 0,
                    verdict: upload.authenticity?.verdict || 'UNKNOWN',
                    isAuthentic: upload.authenticity?.isAuthentic || false,
                    issues: upload.authenticity?.issues || [],
                    validations: upload.authenticity?.validations || []
                },
                plantRecognition: {
                    isSapling: upload.recognition?.isSapling || false,
                    confidence: upload.recognition?.confidence || 0,
                    verdict: upload.recognition?.verdict || 'UNKNOWN',
                    colorAnalysis: upload.recognition?.colorAnalysis || {}
                },
                fraud: {
                    score: upload.fraud?.score || 0,
                    verdict: upload.fraud?.verdict || 'UNKNOWN',
                    isExactMatch: upload.fraud?.isExactMatch || false
                },
                growthComparison: {
                    growthEstimate: upload.growthComparison?.growthEstimate || null,
                    comparedWith: comparisonUpload ? {
                        _id: comparisonUpload._id,
                        date: comparisonUpload.upload_date,
                        image_url: comparisonUpload.ipfs_gateway_url || `http://localhost:5000${comparisonUpload.local_path || comparisonUpload.image_ipfs_hash}`
                    } : null
                }
            },
            credits: {
                ecoCoins: upload.eco_coins_awarded || 0,
                carbonOffset: upload.carbon_calculated || 0,
                breakdown: upload.creditBreakdown || {}
            },
            status: {
                verified: upload.verified,
                processing_status: upload.processing_status,
                rejection_reason: upload.rejection_reason
            }
        });
    } catch (error) {
        console.error('❌ Get Verification Details Error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
