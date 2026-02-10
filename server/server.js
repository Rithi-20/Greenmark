import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Load environment variables immediately
dotenv.config();
// Fallback path in case process.cwd is different in deployment
dotenv.config({ path: path.join(process.cwd(), '.env') });
dotenv.config({ path: path.join(process.cwd(), 'server', '.env') });

const app = express();
const PORT = process.env.PORT || 5000;

import authRoutes from './routes/auth.js';
import adminRoutes from './routes/admin.js';
import userRoutes from './routes/user.js';
import deliveryRoutes from './routes/delivery.js';
import saplingOrderRoutes from './routes/saplingOrder.js';


// Manual CORS implementation to be 100% sure headers are sent even on errors or preflights
app.use((req, res, next) => {
    const origin = req.headers.origin;
    // Allow all origins for now to solve the issue, can restrict later
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');

    // Handle Preflight
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Log important config status (DO NOT LOG SECRETS)
console.log('✅ Server Starting...');
console.log('✅ DB Config Present:', !!process.env.MONGODB_URI);
console.log('✅ JWT Config Present:', !!process.env.JWT_SECRET);

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
    console.log(`📨 [${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

app.get('/api/ping', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));
app.get('/api/test', (req, res) => res.json({ message: 'Main API is reachable' }));
app.get('/test', (req, res) => res.json({ message: 'Main API is reachable (no prefix)' }));

// Standard /api routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/user', userRoutes);
app.use('/api/delivery', deliveryRoutes);
app.use('/api/sapling-orders', saplingOrderRoutes);

// Aliased routes (for when Vercel strips /api)
app.use('/auth', authRoutes);
app.use('/admin', adminRoutes);
app.use('/user', userRoutes);
app.use('/delivery', deliveryRoutes);
app.use('/sapling-orders', saplingOrderRoutes);

// Routes Placeholder
app.get('/', (req, res) => {
    res.send('GreenMark API is running');
});

// Catch-all for 404
app.use((req, res) => {
    console.log(`🚫 GreenMark 404 Not Found: ${req.method} ${req.url}`);
    res.status(404).json({
        message: `Route ${req.method} ${req.url} not found on this server`,
        path: req.url,
        method: req.method
    });
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
