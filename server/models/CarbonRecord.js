import mongoose from 'mongoose';

const carbonRecordSchema = new mongoose.Schema({
    user_id: { type: String, required: true },
    sapling_id: { type: String, required: true },
    month: { type: String, required: true }, // e.g., "March-2025"
    carbon_absorbed: { type: Number, required: true },
    calculated_at: { type: Date, default: Date.now }
});

export default mongoose.model('CarbonRecord', carbonRecordSchema);
