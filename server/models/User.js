import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    user_id: { type: String, required: true, unique: true }, // e.g., "USR001"
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    mobile: { type: String, unique: true, sparse: true }, // Sparse allows multiple nulls if not required
    password: { type: String, required: true },
    registered_date: { type: Date, default: Date.now },
    total_carbon: { type: Number, default: 0 },
    reward_points: { type: Number, default: 0 },
    status: { type: String, default: 'active' },
    saplingsOwned: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Sapling' }],
    // Address & Location for Delivery
    default_address: { type: String }, // Can store basic text or JSON string if needed, but simple string is often enough for a default
    latitude: { type: Number },
    longitude: { type: Number }
});

export default mongoose.model('User', userSchema);
