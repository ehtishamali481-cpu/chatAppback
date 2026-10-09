import express from 'express';
import * as messageController from '../controllers/messageController.js';
import {
  sendMessageValidator,
  editMessageValidator,
  reactMessageValidator,
  messageIdParamValidator,
} from '../validators/messageValidator.js';
import { conversationIdParamValidator } from '../validators/conversationValidator.js';
import { validateRequest } from '../middleware/validate.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.post('/', sendMessageValidator, validateRequest, messageController.sendMessage);
router.get('/conversation/:conversationId', messageController.getMessages);
router.get('/conversation/:conversationId/search', messageController.searchMessages);
router.put('/:id/edit', editMessageValidator, validateRequest, messageController.editMessage);
router.delete('/:id/everyone', messageIdParamValidator, validateRequest, messageController.deleteForEveryone);
router.delete('/:id/me', messageIdParamValidator, validateRequest, messageController.deleteForMe);
router.post('/:id/reaction', reactMessageValidator, validateRequest, messageController.reactToMessage);
router.put('/conversation/:conversationId/read', messageController.markAsRead);

export default router;
