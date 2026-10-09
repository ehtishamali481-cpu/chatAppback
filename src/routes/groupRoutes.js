import express from 'express';
import * as groupController from '../controllers/groupController.js';
import {
  createGroupValidator,
  updateGroupValidator,
  memberActionValidator,
  groupIdParamValidator,
} from '../validators/groupValidator.js';
import { validateRequest } from '../middleware/validate.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.post('/', createGroupValidator, validateRequest, groupController.createGroup);
router.get('/:id', groupIdParamValidator, validateRequest, groupController.getGroupDetails);
router.put('/:id', updateGroupValidator, validateRequest, groupController.updateGroup);
router.post('/:id/members', memberActionValidator, validateRequest, groupController.addMember);
router.delete('/:id/members', memberActionValidator, validateRequest, groupController.removeMember);
router.post('/:id/leave', groupIdParamValidator, validateRequest, groupController.leaveGroup);
router.put('/:id/admins/promote', memberActionValidator, validateRequest, groupController.promoteToAdmin);
router.put('/:id/admins/demote', memberActionValidator, validateRequest, groupController.demoteAdmin);

export default router;
