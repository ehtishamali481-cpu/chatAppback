import express from 'express';
import * as copilotController from '../controllers/copilotController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.post('/query', copilotController.handleQuery);

export default router;
