import mongoose from 'mongoose';

const saplingOrderSchema = new mongoose.Schema({
    order_id: { type: String, required: true, unique: true },
    user_id: { type: String, required: true },
    sapling_id: { type: String, required: true }, // The ID from available saplings
    plant_name: { type: String, required: true },
    plant_type: { type: String, required: true },
    qr_code: { type: String, required: true },

    delivery_method: {
        type: String,
        enum: ['shop_pickup', 'online_delivery'],
        required: true
    },

    // For Online Delivery
    delivery_address: {
        full_address: String,
        city: String,
        pincode: String,
        phone: String
    },
    location: {
        latitude: Number,
        longitude: Number
    },

    // Initial Photo (Baseline)
    initial_photo: { type: String }, // URL or Path
    is_initial_photo_verified: { type: Boolean, default: false },

    status: {
        type: String,
        enum: ['pending_photo', 'ready_for_pickup', 'assigned', 'in_transit', 'delivered', 'cancelled'],
        default: 'pending_photo'
    },

    delivery_partner_id: { type: String },
    otp: { type: String },

    order_date: { type: Date, default: Date.now },
    delivery_date: { type: Date }
});

export default mongoose.model('SaplingOrder', saplingOrderSchema);
