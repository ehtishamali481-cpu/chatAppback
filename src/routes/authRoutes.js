import express from 'express';
import * as authController from '../controllers/authController.js';
import { signupValidator, loginValidator } from '../validators/authValidator.js';
import { validateRequest } from '../middleware/validate.js';
import { protect } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';

import * as userController from '../controllers/userController.js';
import { updateProfileValidator } from '../validators/userValidator.js';

const router = express.Router();

router.post('/signup', authLimiter, signupValidator, validateRequest, authController.register);
router.post('/login', authLimiter, loginValidator, validateRequest, authController.login);
router.post('/logout', protect, authController.logout);
router.get('/me', protect, authController.getMe);
router.put('/profile', protect, updateProfileValidator, validateRequest, userController.updateProfile);

export default router;
