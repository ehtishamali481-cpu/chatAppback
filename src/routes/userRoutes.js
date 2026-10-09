import express from 'express';
import * as userController from '../controllers/userController.js';
import { updateProfileValidator, userIdParamValidator } from '../validators/userValidator.js';
import { validateRequest } from '../middleware/validate.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/me', userController.getCurrentUser);
router.get('/search', userController.searchUsers);
router.get('/by-email', userController.getUserByEmail);
router.get('/:id', userIdParamValidator, validateRequest, userController.getUserById);
router.get('/:id/last-seen', userIdParamValidator, validateRequest, userController.getLastSeen);
router.put('/profile', updateProfileValidator, validateRequest, userController.updateProfile);
router.put('/profile/image', userController.updateProfileImage);
router.put('/profile/about', userController.updateAbout);
router.put('/status/online', userController.updateOnlineStatus);

export default router;
