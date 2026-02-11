import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// STATIC IMPORTS 
import authRoutes from './routes/auth.js';
import adminRoutes from './routes/admin.js';
import userRoutes from './routes/user.js';
import deliveryRoutes from './routes/delivery.js';
import saplingOrderRoutes from './routes/saplingOrder.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();

// CORS
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'Accept']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Legacy local upload support (new uploads go to Pinata/Base64)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- MAGIC IMAGE FALLBACK FOR VERCEL ---
// If a local file is missing, try to serve it from the DB base64
app.get('/uploads/:filename', async (req, res, next) => {
    const { filename } = req.params;
    const localPath = path.join(__dirname, 'uploads', filename);

    // If file exists locally, express.static would have handled it. 
    // But if we're here, it's either not there or skipped.
    if (fs.existsSync(localPath)) return next();

    try {
        // 1. Check Uploads collection
        let record = await mongoose.model('Upload').findOne({
            $or: [
                { local_path: new RegExp(filename + '$') },
                { image_ipfs_hash: filename }
            ]
        });

        // 2. Check SaplingOrders if not found
        if (!record) {
            record = await mongoose.model('SaplingOrder').findOne({
                $or: [
                    { initial_photo: new RegExp(filename + '$') },
                    { initial_photo_base64: { $exists: true, $ne: null } } // This is tricky, maybe search by ID if possible
                ]
            });

            if (record && record.initial_photo_base64) {
                const base64Data = record.initial_photo_base64.split(',')[1];
                const img = Buffer.from(base64Data, 'base64');
                res.writeHead(200, {
                    'Content-Type': 'image/jpeg',
                    'Content-Length': img.length
                });
                return res.end(img);
            }
        }

        if (record && record.image_base64) {
            // Serve from base64
            const base64Data = record.image_base64.split(',')[1];
            const img = Buffer.from(base64Data, 'base64');
            res.writeHead(200, {
                'Content-Type': 'image/jpeg', // Fallback to jpeg, usually fine
                'Content-Length': img.length
            });
            return res.end(img);
        }

        // 3. Last chance: Redirect to IPFS if we have a hash/url
        if (record && record.ipfs_gateway_url) {
            return res.redirect(record.ipfs_gateway_url);
        }

        next(); // Not found, continue to regular 404
    } catch (err) {
        console.error('Fallback Image Error:', err);
        next();
    }
});

// --- DATABASE CONNECTION OPTIMIZATION (Serverless) ---
const MONGO_URI = process.env.MONGODB_URI;

if (!MONGO_URI) {
    console.error("❌ MONGODB_URI is missing from environment variables!");
}

// Global cached connection for hot-reloads/container reuse
let cached = global.mongoose;
if (!cached) {
    cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
    if (cached.conn) {
        return cached.conn;
    }

    if (!cached.promise) {
        const opts = {
            bufferCommands: false, // Fail fast if not connected
            serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
            maxPoolSize: 10 // Efficient connection usage
        };

        console.log('🔄 Initializing new MongoDB connection...');
        cached.promise = mongoose.connect(MONGO_URI, opts).then((mongoose) => {
            console.log('✅ MongoDB Connected Successfully'); // Should only print once on cold start
            return mongoose;
        });
    }

    try {
        cached.conn = await cached.promise;
    } catch (e) {
        cached.promise = null;
        console.error('❌ MongoDB Connection Error:', e);
        throw e;
    }

    return cached.conn;
}

// Middleware: Ensure DB is connected before handling requests
app.use(async (req, res, next) => {
    // Skip DB connect for simple health check or static files or OPTIONS
    if (req.path === '/api/ping' || req.method === 'OPTIONS' || req.path === '/favicon.ico' || req.path.startsWith('/uploads/')) {
        return next();
    }

    try {
        await connectDB();
        next();
    } catch (error) {
        console.error("❌ Critical: DB Connection Failed for Request", error.message);
        res.status(500).json({
            message: 'Database connection failed. Please ensure IP Whitelist is set to 0.0.0.0/0 in Atlas.',
            error: error.message
        });
    }
});

// Health check
app.get('/api/ping', (req, res) => {
    res.json({
        status: 'ok',
        time: new Date().toISOString(),
        dbState: mongoose.connection.readyState
    });
});
app.get('/favicon.ico', (req, res) => res.status(204).end());
app.get('/favicon.png', (req, res) => res.status(204).end());

app.get('/', (req, res) => {
    res.send('GreenMark API is running');
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/user', userRoutes);
app.use('/api/delivery', deliveryRoutes);
app.use('/api/sapling-orders', saplingOrderRoutes);

console.log('✅ All routes loaded successfully');

// Start server locally
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, async () => {
        console.log(`🚀 Server running on port ${PORT}`);
        // Ensure DB connects on startup locally
        try { await connectDB(); } catch (e) { console.error(e); }
    });
}

export default app;
