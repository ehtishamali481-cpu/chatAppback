import express from 'express';
import * as uploadController from '../controllers/uploadController.js';
import { upload } from '../middleware/upload.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.post('/', upload.single('file'), uploadController.uploadMedia);

export default router;
