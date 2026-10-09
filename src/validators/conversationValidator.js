import { body, param } from 'express-validator';

export const startChatByEmailValidator = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Recipient email is required')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
];

export const createConversationValidator = [
  body('participantIds')
    .isArray({ min: 1 })
    .withMessage('participantIds must be a non-empty array of user IDs'),
  body('participantIds.*')
    .isMongoId()
    .withMessage('Each participant ID must be a valid MongoDB ObjectId'),
];

export const conversationIdParamValidator = [
  param('id')
    .isMongoId()
    .withMessage('Invalid Conversation ID format'),
];
