import mongoose from 'mongoose';

const rewardCatalogSchema = new mongoose.Schema({
    reward_id: { type: String, required: true, unique: true }, // e.g., "REW-001"
    reward_name: { type: String, required: true },
    reward_type: { type: String, enum: ['product', 'money'], required: true },
    eco_coins_required: { type: Number, required: true },
    money_value: { type: Number }, // Only if reward_type is 'money'
    description: { type: String },
    image_url: { type: String }, // Placeholder for future
    stock: { type: Number, default: 100 },
    active: { type: Boolean, default: true },
    created_at: { type: Date, default: Date.now }
});

export default mongoose.model('RewardCatalog', rewardCatalogSchema);
