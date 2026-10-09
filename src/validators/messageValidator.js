import { body, param } from 'express-validator';
import { MESSAGE_TYPES } from '../config/constants.js';

export const sendMessageValidator = [
  body('conversationId')
    .notEmpty()
    .withMessage('Conversation ID is required')
    .isMongoId()
    .withMessage('Invalid Conversation ID format'),
  body('messageType')
    .optional()
    .isIn(Object.values(MESSAGE_TYPES))
    .withMessage(`Invalid message type. Allowed: ${Object.values(MESSAGE_TYPES).join(', ')}`),
  body('text')
    .optional()
    .isString(),
  body('mediaUrl')
    .optional()
    .isString(),
  body('replyTo')
    .optional()
    .isMongoId()
    .withMessage('Invalid replyTo message ID'),
  body('forwardedFrom')
    .optional()
    .isMongoId()
    .withMessage('Invalid forwardedFrom message ID'),
];

export const editMessageValidator = [
  param('id')
    .isMongoId()
    .withMessage('Invalid Message ID format'),
  body('text')
    .trim()
    .notEmpty()
    .withMessage('Updated message text is required'),
];

export const reactMessageValidator = [
  param('id')
    .isMongoId()
    .withMessage('Invalid Message ID format'),
  body('emoji')
    .trim()
    .notEmpty()
    .withMessage('Emoji reaction is required'),
];

export const messageIdParamValidator = [
  param('id')
    .isMongoId()
    .withMessage('Invalid Message ID format'),
];
