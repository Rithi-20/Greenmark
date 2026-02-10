import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

// Import and register routes inline to avoid top-level import issues
const registerRoutes = async () => {
    try {
        const { default: authRoutes } = await import('./routes/auth.js');
        const { default: adminRoutes } = await import('./routes/admin.js');
        const { default: userRoutes } = await import('./routes/user.js');
        const { default: deliveryRoutes } = await import('./routes/delivery.js');
        const { default: saplingOrderRoutes } = await import('./routes/saplingOrder.js');

        app.use('/api/auth', authRoutes);
        app.use('/api/admin', adminRoutes);
        app.use('/api/user', userRoutes);
        app.use('/api/delivery', deliveryRoutes);
        app.use('/api/sapling-orders', saplingOrderRoutes);

        console.log('✅ All routes registered');
    } catch (err) {
        console.error('❌ Route registration failed:', err.message);
    }
};

// Call immediately
registerRoutes();

// DB
const MONGO_URI = process.env.MONGODB_URI;
if (MONGO_URI) {
    mongoose.connect(MONGO_URI)
        .then(() => console.log('✅ MongoDB Connected'))
        .catch(err => console.error('❌ DB Error:', err.message));
}

export default app;
