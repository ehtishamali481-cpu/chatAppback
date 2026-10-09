import express from 'express';
import * as statusController from '../controllers/statusController.js';
import { createStatusValidator, statusIdParamValidator } from '../validators/statusValidator.js';
import { validateRequest } from '../middleware/validate.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.post('/', createStatusValidator, validateRequest, statusController.createStatus);
router.get('/my', statusController.getMyStatuses);
router.get('/contacts', statusController.getContactsStatuses);
router.post('/:id/view', statusIdParamValidator, validateRequest, statusController.viewStatus);
router.get('/:id/viewers', statusIdParamValidator, validateRequest, statusController.getStatusViewers);
router.delete('/:id', statusIdParamValidator, validateRequest, statusController.deleteStatus);

export default router;
