import mongoose from 'mongoose';

const certificateSchema = new mongoose.Schema({
    user_id: { type: String, required: true },
    user_name: { type: String, required: true },
    certificate_type: { type: String, required: true }, // 'Silver', 'Gold', 'Platinum'
    total_carbon: { type: Number, required: true },
    eco_coins: { type: Number, required: true },
    issue_date: { type: Date, default: Date.now },
    serial_number: { type: String, required: true, unique: true }
});

export default mongoose.model('Certificate', certificateSchema);
