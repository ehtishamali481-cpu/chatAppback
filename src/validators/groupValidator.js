import { body, param } from 'express-validator';

export const createGroupValidator = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Group name is required')
    .isLength({ min: 1, max: 100 })
    .withMessage('Group name must be between 1 and 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 512 })
    .withMessage('Description cannot exceed 512 characters'),
  body('members')
    .optional()
    .isArray()
    .withMessage('Members must be an array of user IDs'),
  body('members.*')
    .optional()
    .isMongoId()
    .withMessage('Invalid member user ID'),
];

export const updateGroupValidator = [
  param('id')
    .isMongoId()
    .withMessage('Invalid Group ID format'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Group name must be between 1 and 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 512 })
    .withMessage('Description cannot exceed 512 characters'),
];

export const memberActionValidator = [
  param('id')
    .isMongoId()
    .withMessage('Invalid Group ID format'),
  body('userId')
    .notEmpty()
    .withMessage('User ID is required')
    .isMongoId()
    .withMessage('Invalid user ID format'),
];

export const groupIdParamValidator = [
  param('id')
    .isMongoId()
    .withMessage('Invalid Group ID format'),
];
