import express from 'express';
import authRoutes from './authRoutes.js';
import userRoutes from './userRoutes.js';
import conversationRoutes from './conversationRoutes.js';
import messageRoutes from './messageRoutes.js';
import statusRoutes from './statusRoutes.js';
import groupRoutes from './groupRoutes.js';
import communityRoutes from './communityRoutes.js';
import uploadRoutes from './uploadRoutes.js';
import copilotRoutes from './copilotRoutes.js';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/conversations', conversationRoutes);
router.use('/messages', messageRoutes);
router.use('/status', statusRoutes);
router.use('/groups', groupRoutes);
router.use('/communities', communityRoutes);
router.use('/uploads', uploadRoutes);
router.use('/copilot', copilotRoutes);

export default router;
