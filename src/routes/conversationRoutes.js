import express from 'express';
import * as conversationController from '../controllers/conversationController.js';
import {
  startChatByEmailValidator,
  createConversationValidator,
  conversationIdParamValidator,
} from '../validators/conversationValidator.js';
import { validateRequest } from '../middleware/validate.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.post('/start', startChatByEmailValidator, validateRequest, conversationController.startChatByEmail);
router.post('/', createConversationValidator, validateRequest, conversationController.createConversation);
router.get('/', conversationController.getMyConversations);
router.get('/:id', conversationIdParamValidator, validateRequest, conversationController.getConversationById);
router.put('/:id/archive', conversationIdParamValidator, validateRequest, conversationController.toggleArchive);
router.put('/:id/mute', conversationIdParamValidator, validateRequest, conversationController.toggleMute);
router.put('/:id/pin', conversationIdParamValidator, validateRequest, conversationController.togglePin);
router.delete('/:id', conversationIdParamValidator, validateRequest, conversationController.leaveOrDeleteConversation);

export default router;
