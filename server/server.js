import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Import routes FIRST (static imports)
import authRoutes from './routes/auth.js';
import adminRoutes from './routes/admin.js';
import userRoutes from './routes/user.js';
import deliveryRoutes from './routes/delivery.js';
import saplingOrderRoutes from './routes/saplingOrder.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();
dotenv.config({ path: path.join(process.cwd(), '.env') });
dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();

// CORS
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check
app.get('/api/ping', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString(), routes: 'loaded' });
});

app.get('/', (req, res) => {
    res.send('GreenMark API is running');
});

// Register routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/user', userRoutes);
app.use('/api/delivery', deliveryRoutes);
app.use('/api/sapling-orders', saplingOrderRoutes);

console.log('✅ Routes registered');

// 404 handler
app.use((req, res) => {
    console.log('❌ 404:', req.method, req.url);
    res.status(404).json({
        error: 'Route not found',
        method: req.method,
        path: req.url
    });
});

// DB Connection
const MONGO_URI = process.env.MONGODB_URI;
if (MONGO_URI) {
    mongoose.connect(MONGO_URI)
        .then(() => console.log('✅ MongoDB Connected'))
        .catch(err => console.error('❌ MongoDB Error:', err.message));
} else {
    console.error('❌ MONGODB_URI not set!');
}

export default app;
