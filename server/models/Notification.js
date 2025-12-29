import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
    user_id: { type: String, required: true },
    sapling_id: { type: String },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String, enum: ['health', 'reward', 'system'], default: 'system' },
    sent_date: { type: Date, default: Date.now },
    read: { type: Boolean, default: false }
});

export default mongoose.model('Notification', notificationSchema);
