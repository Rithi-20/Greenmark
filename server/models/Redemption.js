import mongoose from 'mongoose';

const redemptionSchema = new mongoose.Schema({
    request_id: { type: String, required: true, unique: true }, // e.g., "RED-20251219-001"
    user_id: { type: String, required: true },
    reward_id: { type: String }, // Link to RewardCatalog if product
    reward_name: { type: String, required: true }, // Snapshot of name
    redeem_type: { type: String, enum: ['product', 'money'], required: true },
    method: { type: String, enum: ['online', 'offline'], required: true },
    eco_coins_used: { type: Number, required: true },
    amount_value: { type: Number }, // For money redemption

    status: { type: String, enum: ['Pending', 'Approved', 'Rejected', 'Redeemed'], default: 'Pending' },

    // Approval Details
    redemption_code: { type: String }, // Generated on Approval
    approved_by: { type: String }, // Admin ID
    approved_at: { type: Date },
    admin_remarks: { type: String },

    // Final Redemption (Shop or Delivery)
    order_id: { type: String }, // Links to Order.order_id if delivery is involved
    redeemed: { type: Boolean, default: false },
    redeemed_date: { type: Date },

    created_at: { type: Date, default: Date.now }
});

export default mongoose.model('Redemption', redemptionSchema);
