import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
    order_id: { type: String, required: true, unique: true }, // e.g., "ORD-20251220-001"
    user_id: { type: String, required: true },
    reward_id: { type: String }, // Optional, linking back to RewardCatalog
    type: { type: String, enum: ['product', 'money'], required: true },
    product_name: { type: String, required: true },
    amount_value: { type: Number }, // If type is money
    quantity: { type: Number, default: 1 },

    // Delivery Details
    delivery_address: {
        address_line_1: { type: String },
        address_line_2: { type: String },
        city: { type: String },
        state: { type: String },
        pincode: { type: String }
    },
    delivery_lat: { type: Number, required: true },
    delivery_long: { type: Number, required: true },

    // Distance & Time
    distance_km: { type: Number },
    estimated_days: { type: String }, // "1 day", "3-5 days"

    // Verification
    verification_code: { type: String, required: true }, // 6-digit OTP
    assigned_delivery_person: { type: mongoose.Schema.Types.Mixed }, // String or ObjectId for flexibility

    // Status Flow
    status: {
        type: String,
        enum: ['Order Placed', 'Assigned', 'Out for Delivery', 'Delivered', 'Cancelled', 'Paid at Shop', 'Money Delivered'],
        default: 'Order Placed'
    },

    method: { type: String, enum: ['online', 'offline'], default: 'online' }, // 'offline' could mean Shop Pickup

    order_date: { type: Date, default: Date.now },
    delivered_date: { type: Date }
});

export default mongoose.model('Order', orderSchema);
