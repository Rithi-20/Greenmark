import mongoose from 'mongoose';

const deliveryUserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    mobile: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    assigned_orders: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Order' }],
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    created_at: { type: Date, default: Date.now }
});

export default mongoose.model('DeliveryUser', deliveryUserSchema);
