import mongoose from 'mongoose';

const rewardSchema = new mongoose.Schema({
    user_id: { type: String, required: true, unique: true },
    total_points: { type: Number, default: 0 },
    reward_level: { type: String, default: 'Bronze' }, // Silver, Gold, etc.
    certificate_generated: { type: Boolean, default: false },
    reward_claimed: { type: Boolean, default: false },
    claimed_date: { type: Date, default: null }
});

export default mongoose.model('Reward', rewardSchema);
