import mongoose from 'mongoose';

const saplingSchema = new mongoose.Schema({
    sapling_id: { type: String, required: true, unique: true }, // e.g., "SAP001"
    plant_name: { type: String, required: true },
    plant_type: { type: String, required: true },
    carbon_rate: { type: Number, required: true }, // kg CO2 per year
    qr_code: { type: String, required: true, unique: true },
    shop_id: { type: String, required: true },
    created_at: { type: Date, default: Date.now },
    is_assigned: { type: Boolean, default: false },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    location: { type: String },
    status: { type: String, default: 'available' }
});

export default mongoose.model('Sapling', saplingSchema);
