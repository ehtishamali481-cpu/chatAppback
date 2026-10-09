import { body, param } from 'express-validator';
import { STATUS_TYPES } from '../config/constants.js';

export const createStatusValidator = [
  body('type')
    .optional()
    .isIn(Object.values(STATUS_TYPES))
    .withMessage(`Invalid status type. Allowed: ${Object.values(STATUS_TYPES).join(', ')}`),
  body('text')
    .optional()
    .isString()
    .isLength({ max: 500 })
    .withMessage('Status text cannot exceed 500 characters'),
  body('mediaUrl')
    .optional()
    .isString(),
];

export const statusIdParamValidator = [
  param('id')
    .isMongoId()
    .withMessage('Invalid Status ID format'),
];
