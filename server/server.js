import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();
dotenv.config({ path: path.join(process.cwd(), '.env') });
dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();

// CORS - Must be first
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

console.log('✅ Server initializing...');

// Health check (always available)
app.get('/api/ping', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
});

app.get('/', (req, res) => {
    res.send('GreenMark API is running');
});

// Load routes immediately with dynamic imports
(async () => {
    try {
        const authModule = await import('./routes/auth.js');
        const adminModule = await import('./routes/admin.js');
        const userModule = await import('./routes/user.js');
        const deliveryModule = await import('./routes/delivery.js');
        const saplingModule = await import('./routes/saplingOrder.js');

        app.use('/api/auth', authModule.default);
        app.use('/api/admin', adminModule.default);
        app.use('/api/user', userModule.default);
        app.use('/api/delivery', deliveryModule.default);
        app.use('/api/sapling-orders', saplingModule.default);

        console.log('✅ Routes loaded successfully');
    } catch (error) {
        console.error('❌ Route loading error:', error);
    }
})();

// DB Connection (runs in parallel, doesn't block routes)
const MONGO_URI = process.env.MONGODB_URI;
if (MONGO_URI) {
    mongoose.connect(MONGO_URI)
        .then(() => console.log('✅ MongoDB Connected'))
        .catch(err => console.error('❌ MongoDB Error:', err.message));
} else {
    console.error('❌ MONGODB_URI not found in environment!');
}

export default app;
