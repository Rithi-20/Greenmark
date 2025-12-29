import mongoose from 'mongoose';

const userSaplingSchema = new mongoose.Schema({
    user_id: { type: String, required: true }, // Link to User.user_id
    sapling_id: { type: String, required: true }, // Link to Sapling.sapling_id
    location: {
        latitude: { type: Number },
        longitude: { type: Number }
    },
    registered_date: { type: Date, default: Date.now },
    current_health: { type: String, default: 'healthy' } // healthy, dry, needs_water
});

export default mongoose.model('UserSapling', userSaplingSchema);
