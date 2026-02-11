import mongoose from 'mongoose';

const uploadSchema = new mongoose.Schema({
    user_id: { type: String, required: true },
    sapling_id: { type: String, required: true },
    image_ipfs_hash: { type: String, required: true },
    image_base64: { type: String }, // Store Base64 for faster retrieval

    // IPFS Data
    ipfs_gateway_url: { type: String },
    local_path: { type: String },
    ipfs_uploaded: { type: Boolean, default: false },

    upload_date: { type: Date, default: Date.now },
    location: {
        latitude: { type: Number },
        longitude: { type: Number }
    },
    plant_status: { type: String, default: 'Healthy' },
    growth_indicators: { type: String },
    verified: { type: Boolean, default: false },
    carbon_calculated: { type: Number, default: 0 },
    eco_coins_awarded: { type: Number, default: 0 },
    admin_remarks: { type: String },

    // Photo Authenticity Data
    authenticity: {
        score: { type: Number, default: 0 },
        verdict: { type: String },
        isAuthentic: { type: Boolean, default: true },
        issues: [{ type: String }],
        validations: [{ type: String }]
    },

    // Plant/Sapling Recognition
    recognition: {
        isSapling: { type: Boolean, default: true },
        confidence: { type: Number, default: 0 },
        verdict: { type: String },
        colorAnalysis: {
            greenRatio: { type: Number },
            isLikelyPlant: { type: Boolean }
        }
    },

    // Fraud Detection
    fraud: {
        score: { type: Number, default: 0 },
        verdict: { type: String },
        isExactMatch: { type: Boolean, default: false },
        previousMatchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Upload' }
    },

    // Growth Comparison
    growthComparison: {
        comparedWithUploadId: { type: mongoose.Schema.Types.ObjectId, ref: 'Upload' },
        similarityScore: { type: Number },
        growthEstimate: { type: Number }
    },

    // Credit Breakdown
    creditBreakdown: {
        baseCoins: { type: Number, default: 0 },
        growthBonus: { type: Number, default: 0 },
        carbonBonus: { type: Number, default: 0 },
        authenticityBonus: { type: Number, default: 0 },
        plantConfidenceBonus: { type: Number, default: 0 },
        consecutiveBonus: { type: Number, default: 0 },
        firstUploadBonus: { type: Number, default: 0 },
        fraudPenalty: { type: Number, default: 0 }
    },

    // Processing Status
    processing_status: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'failed', 'rejected'],
        default: 'pending'
    },
    rejection_reason: { type: String },

    // Is this the initial photo taken at sapling handover?
    is_initial_photo: { type: Boolean, default: false }
});

// Index for efficient queries
uploadSchema.index({ user_id: 1, sapling_id: 1 });
uploadSchema.index({ upload_date: -1 });
uploadSchema.index({ verified: 1 });

export default mongoose.model('Upload', uploadSchema);
