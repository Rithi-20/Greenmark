import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import {
    createSaplingOrder,
    adminUploadSaplingPhoto,
    getSaplingOrders,
    updateSaplingOrderStatus
} from '../controllers/saplingOrderController.js';

const router = express.Router();

// Multer Config for Sapling Photos
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '../uploads/saplings/');
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        cb(null, `sapling-${Date.now()}${path.extname(file.originalname)}`);
    }
});
const upload = multer({ storage });

router.post('/create', upload.single('image'), createSaplingOrder);
router.get('/list', getSaplingOrders);
router.post('/:orderId/upload-photo', upload.single('image'), adminUploadSaplingPhoto);
router.patch('/:orderId/status', updateSaplingOrderStatus);

export default router;
