import { body, param } from 'express-validator';

export const updateProfileValidator = [
  body('fullName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters'),
  body('about')
    .optional()
    .trim()
    .isLength({ max: 250 })
    .withMessage('About cannot exceed 250 characters'),
  body('username')
    .optional()
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain alphanumeric characters and underscores'),
  body('profileImage')
    .optional(),
];

export const userIdParamValidator = [
  param('id')
    .isMongoId()
    .withMessage('Invalid User ID format'),
];
