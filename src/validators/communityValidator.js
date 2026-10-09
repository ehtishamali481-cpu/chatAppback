import { body, param } from 'express-validator';

export const createCommunityValidator = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Community name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Community name must be between 2 and 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters'),
];

export const updateCommunityValidator = [
  param('id')
    .isMongoId()
    .withMessage('Invalid Community ID format'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Community name must be between 2 and 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters'),
];

export const communityGroupActionValidator = [
  param('id')
    .isMongoId()
    .withMessage('Invalid Community ID format'),
  body('groupId')
    .notEmpty()
    .withMessage('Group ID is required')
    .isMongoId()
    .withMessage('Invalid Group ID format'),
];

export const communityAdminActionValidator = [
  param('id')
    .isMongoId()
    .withMessage('Invalid Community ID format'),
  body('userId')
    .notEmpty()
    .withMessage('User ID is required')
    .isMongoId()
    .withMessage('Invalid User ID format'),
];

export const communityIdParamValidator = [
  param('id')
    .isMongoId()
    .withMessage('Invalid Community ID format'),
];
