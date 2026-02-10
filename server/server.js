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
    res.json({ status: 'ok', time: new Date().toISOString(), routes: 'checking...' });
});

app.get('/', (req, res) => {
    res.send('GreenMark API is running');
});

// Test route to verify routing works
app.post('/api/auth/user/login', async (req, res) => {
    try {
        console.log('Login attempt:', req.body);

        // Import controller dynamically only when needed
        const { loginUser } = await import('./controllers/authController.js');
        return loginUser(req, res);
    } catch (error) {
        console.error('Login handler error:', error);
        res.status(500).json({
            message: 'Login handler error',
            error: error.message
        });
    }
});

// Test route for admin login
app.post('/api/auth/admin/login', async (req, res) => {
    try {
        const { adminLogin } = await import('./controllers/authController.js');
        return adminLogin(req, res);
    } catch (error) {
        console.error('Admin login error:', error);
        res.status(500).json({
            message: 'Admin login handler error',
            error: error.message
        });
    }
});

// Test route for user registration
app.post('/api/auth/user/register', async (req, res) => {
    try {
        const { registerUser } = await import('./controllers/authController.js');
        return registerUser(req, res);
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            message: 'Registration handler error',
            error: error.message
        });
    }
});

console.log('✅ Core routes registered inline');

// DB
const MONGO_URI = process.env.MONGODB_URI;
if (MONGO_URI) {
    mongoose.connect(MONGO_URI)
        .then(() => console.log('✅ MongoDB Connected'))
        .catch(err => console.error('❌ DB Error:', err.message));
}

export default app;
