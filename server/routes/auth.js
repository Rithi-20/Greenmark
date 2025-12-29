import express from 'express';
import { adminLogin, registerUser, loginUser } from '../controllers/authController.js';

const router = express.Router();

router.post('/admin/login', adminLogin);
router.post('/user/register', registerUser);
router.post('/user/login', loginUser);

export default router;
