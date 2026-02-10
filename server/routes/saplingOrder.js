import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Lazy load controller actions
const getController = async () => await import('../controllers/saplingOrderController.js');

const router = express.Router();

// Multer Config: Use OS temporary directory for Vercel compatibility
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Use /tmp in Vercel (Linux) or local temp in Windows
        const tempDir = os.tmpdir();
        const uploadPath = path.join(tempDir, 'greenmark_uploads');

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

// Route wrappers for lazy loading
router.post('/create', upload.single('image'), async (req, res, next) => {
    try {
        const { createSaplingOrder } = await getController();
        return createSaplingOrder(req, res, next);
    } catch (err) { next(err); }
});

router.get('/list', async (req, res, next) => {
    try {
        const { getSaplingOrders } = await getController();
        return getSaplingOrders(req, res, next);
    } catch (err) { next(err); }
});

router.post('/:orderId/upload-photo', upload.single('image'), async (req, res, next) => {
    try {
        const { adminUploadSaplingPhoto } = await getController();
        return adminUploadSaplingPhoto(req, res, next);
    } catch (err) { next(err); }
});

router.patch('/:orderId/status', async (req, res, next) => {
    try {
        const { updateSaplingOrderStatus } = await getController();
        return updateSaplingOrderStatus(req, res, next);
    } catch (err) { next(err); }
});

export default router;
