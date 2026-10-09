import express from 'express';
import * as communityController from '../controllers/communityController.js';
import {
  createCommunityValidator,
  updateCommunityValidator,
  communityGroupActionValidator,
  communityAdminActionValidator,
  communityIdParamValidator,
} from '../validators/communityValidator.js';
import { validateRequest } from '../middleware/validate.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.post('/', createCommunityValidator, validateRequest, communityController.createCommunity);
router.get('/:id', communityIdParamValidator, validateRequest, communityController.getCommunityDetails);
router.put('/:id', updateCommunityValidator, validateRequest, communityController.updateCommunity);
router.delete('/:id', communityIdParamValidator, validateRequest, communityController.deleteCommunity);
router.post('/:id/join', communityIdParamValidator, validateRequest, communityController.joinCommunity);
router.post('/:id/leave', communityIdParamValidator, validateRequest, communityController.leaveCommunity);
router.post('/:id/groups', communityGroupActionValidator, validateRequest, communityController.addGroup);
router.delete('/:id/groups', communityGroupActionValidator, validateRequest, communityController.removeGroup);
router.put('/:id/admins/promote', communityAdminActionValidator, validateRequest, communityController.promoteAdmin);
router.put('/:id/admins/demote', communityAdminActionValidator, validateRequest, communityController.demoteAdmin);

export default router;
