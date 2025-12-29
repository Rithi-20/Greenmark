import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';
import User from '../models/User.js';

const generateToken = (id, role) => {
    return jwt.sign({ id, role }, process.env.JWT_SECRET || 'secret123', {
        expiresIn: '30d',
    });
};

// Admin Login
export const adminLogin = async (req, res) => {
    const { email, password } = req.body;
    try {
        const admin = await Admin.findOne({ email });
        // For initial setup, if no admin exists, create one (FOR DEV ONLY - REMOVE IN PROD)
        // Or user can manually insert. Let's assume manual insert or we can seed it.
        // Actually, user gave "ADM001" example. Let's strictly check.

        if (!admin) {
            return res.status(401).json({ message: 'Invalid admin credentials' });
        }

        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid admin credentials' });
        }

        res.json({
            _id: admin._id,
            admin_id: admin.admin_id,
            name: admin.name,
            email: admin.email,
            role: admin.role,
            token: generateToken(admin._id, admin.role),
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// User Register
export const registerUser = async (req, res) => {
    const { name, email, mobile, password } = req.body;
    try {
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Simple ID generation logic (replace with better logic later)
        const count = await User.countDocuments();
        const user_id = `USR${String(count + 1).padStart(3, '0')}`;

        const user = await User.create({
            user_id,
            name,
            email,
            mobile,
            password: hashedPassword,
        });

        if (user) {
            res.status(201).json({
                _id: user._id,
                user_id: user.user_id,
                name: user.name,
                email: user.email,
                role: 'user',
                token: generateToken(user._id, 'user'),
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const loginUser = async (req, res) => {
    const { email, password } = req.body;
    try {
        console.log(`🔑 User Login Attempt: Input=${email}`);
        const user = await User.findOne({
            $or: [
                { email: email },
                { mobile: email }
            ]
        });

        if (!user) {
            console.log(`❌ User Login Failed: No user found for ${email}`);
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            console.log(`❌ User Login Failed: Password mismatch for ${email}`);
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        console.log(`✅ User Login Success: ${user.name}`);
        const token = generateToken(user._id, 'user');

        res.json({
            _id: user._id,
            user_id: user.user_id,
            name: user.name,
            email: user.email,
            mobile: user.mobile,
            points: user.reward_points,
            role: 'user',
            token
        });
    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
