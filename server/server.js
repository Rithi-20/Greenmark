import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 5000;

import authRoutes from './routes/auth.js';
import adminRoutes from './routes/admin.js';
import userRoutes from './routes/user.js';
import deliveryRoutes from './routes/delivery.js';
import saplingOrderRoutes from './routes/saplingOrder.js';


app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


// DB Connection Check Middleware
app.use(async (req, res, next) => {
    // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
    const state = mongoose.connection.readyState;

    if (state !== 1 && state !== 2 && req.path.startsWith('/api')) {
        console.error(`❌ DB Connection State: ${state}. Returning 503.`);
        return res.status(503).json({
            message: 'Database connection is not established. Please check server logs and Atlas IP whitelist.',
            currentState: state
        });
    }
    next();
});

// Request logging middleware
app.use((req, res, next) => {
    console.log(`📨 ${req.method} ${req.url}`);
    console.log('Body:', req.body);
    next();
});

app.get('/api/test', (req, res) => res.json({ message: 'Main API is reachable' }));
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
console.log('🔗 Wiring up /api/user routes...');
app.use('/api/user', userRoutes);
app.use('/api/delivery', deliveryRoutes);
console.log('🔗 Wiring up /api/sapling-orders routes...');
app.use('/api/sapling-orders', saplingOrderRoutes);



// Routes Placeholder
app.get('/', (req, res) => {
    res.send('GreenMark API is running');
});

// Catch-all for 404
app.use((req, res) => {
    console.log(`🚫 GreenMark 404 Not Found: ${req.method} ${req.url}`);
    res.status(404).json({ message: `Route ${req.method} ${req.url} not found on this server` });
});

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/greenmark';

mongoose.connect(MONGO_URI)
    .then(() => console.log('✅ MongoDB Connected Successfully'))
    .catch(err => {
        console.error('❌ MongoDB Connection Error:', err.message);
        if (err.message.includes('MongooseServerSelectionError')) {
            console.log('\n--- ⚠️ DATABASE CONNECTIVITY ALERT ---');
            console.log('Your IP address might not be whitelisted in MongoDB Atlas.');
            console.log('1. Go to cloud.mongodb.com');
            console.log('2. Click "Network Access"');
            console.log('3. Click "Add IP Address" -> "Allow Access From Anywhere" (or add your current IP)');
            console.log('--------------------------------------\n');
        }
    });

// Export the app for Vercel
export default app;

// Only listen if not running in Vercel (or similar serverless environment that imports the app)
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}
