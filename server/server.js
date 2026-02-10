import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

// CORS
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/api/ping', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
});

app.get('/', (req, res) => {
    res.send('GreenMark API is running');
});

// Import routes synchronously
let authRoutes, adminRoutes, userRoutes, deliveryRoutes, saplingOrderRoutes;

try {
    authRoutes = (await import('./routes/auth.js')).default;
    adminRoutes = (await import('./routes/admin.js')).default;
    userRoutes = (await import('./routes/user.js')).default;
    deliveryRoutes = (await import('./routes/delivery.js')).default;
    saplingOrderRoutes = (await import('./routes/saplingOrder.js')).default;

    // Register routes
    app.use('/api/auth', authRoutes);
    app.use('/api/admin', adminRoutes);
    app.use('/api/user', userRoutes);
    app.use('/api/delivery', deliveryRoutes);
    app.use('/api/sapling-orders', saplingOrderRoutes);

    console.log('✅ Routes loaded');
} catch (error) {
    console.error('❌ Failed to load routes:', error.message);
}

// DB
const MONGO_URI = process.env.MONGODB_URI;
if (MONGO_URI) {
    mongoose.connect(MONGO_URI)
        .then(() => console.log('✅ MongoDB Connected'))
        .catch(err => console.error('❌ DB Error:', err.message));
}

export default app;
