import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Import Routes at the top
import authRoutes from './routes/auth.js';
import adminRoutes from './routes/admin.js';
import userRoutes from './routes/user.js';
import deliveryRoutes from './routes/delivery.js';
import saplingOrderRoutes from './routes/saplingOrder.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables immediately
dotenv.config();
dotenv.config({ path: path.join(process.cwd(), '.env') });
dotenv.config({ path: path.join(process.cwd(), 'server', '.env') });

const app = express();
const PORT = process.env.PORT || 5000;

// 1. ABSOLUTE TOP: CORS Headers
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Log status
console.log('✅ Server Starting...');
console.log('✅ DB Config Present:', !!process.env.MONGODB_URI);

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// DB Connection Check Middleware
app.use((req, res, next) => {
    const state = mongoose.connection.readyState;
    if (state !== 1 && state !== 2 && req.path.startsWith('/api')) {
        return res.status(503).json({
            message: 'Database connection is not established.',
            currentState: state
        });
    }
    next();
});

// Request logging
app.use((req, res, next) => {
    console.log(`📨 [${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Routes
app.get('/api/ping', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/user', userRoutes);
app.use('/api/delivery', deliveryRoutes);
app.use('/api/sapling-orders', saplingOrderRoutes);

// Fallback for direct routes
app.use('/auth', authRoutes);
app.use('/admin', adminRoutes);
app.use('/user', userRoutes);
app.use('/delivery', deliveryRoutes);
app.use('/sapling-orders', saplingOrderRoutes);

app.get('/', (req, res) => res.send('GreenMark API is running'));

const MONGO_URI = process.env.MONGODB_URI;

if (!MONGO_URI) {
    console.error('❌ CRITICAL: MONGODB_URI is missing from environment variables!');
} else {
    mongoose.connect(MONGO_URI)
        .then(() => console.log('✅ MongoDB Connected'))
        .catch(err => console.error('❌ MongoDB Error:', err.message));
}

export default app;

if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}
