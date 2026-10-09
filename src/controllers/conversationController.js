import * as conversationService from '../services/conversationService.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { getPagination } from '../utils/pagination.js';

export const startChatByEmail = async (req, res, next) => {
  try {
    const { email } = req.body;
    const result = await conversationService.startChatByEmail(req.user._id, email);
    const statusCode = result.isNew ? 201 : 200;
    return sendSuccess(
      res,
      result.isNew ? 'New conversation created' : 'Existing conversation retrieved',
      result,
      statusCode
    );
  } catch (error) {
    next(error);
  }
};

export const createConversation = async (req, res, next) => {
  try {
    const { name, participantIds, description, image } = req.body;
    const conversation = await conversationService.createGroupConversation(req.user._id, {
      name,
      participantIds,
      description,
      image,
    });
    return sendSuccess(res, 'Group conversation created successfully', { conversation }, 201);
  } catch (error) {
    next(error);
  }
};

export const getMyConversations = async (req, res, next) => {
  try {
    const pagination = getPagination(req.query);
    const result = await conversationService.getUserConversations(req.user._id, pagination);
    return sendSuccess(res, 'Conversations retrieved successfully', result);
  } catch (error) {
    next(error);
  }
};

export const getConversationById = async (req, res, next) => {
  try {
    const conversation = await conversationService.getConversationById(req.params.id, req.user._id);
    return sendSuccess(res, 'Conversation details retrieved', { conversation });
  } catch (error) {
    next(error);
  }
};

export const toggleArchive = async (req, res, next) => {
  try {
    const result = await conversationService.toggleArchiveConversation(req.params.id, req.user._id);
    return sendSuccess(
      res,
      result.archived ? 'Conversation archived' : 'Conversation unarchived',
      result
    );
  } catch (error) {
    next(error);
  }
};

export const toggleMute = async (req, res, next) => {
  try {
    const result = await conversationService.toggleMuteConversation(req.params.id, req.user._id);
    return sendSuccess(
      res,
      result.muted ? 'Conversation muted' : 'Conversation unmuted',
      result
    );
  } catch (error) {
    next(error);
  }
};

export const togglePin = async (req, res, next) => {
  try {
    const result = await conversationService.togglePinConversation(req.params.id, req.user._id);
    return sendSuccess(
      res,
      result.pinned ? 'Conversation pinned' : 'Conversation unpinned',
      result
    );
  } catch (error) {
    next(error);
  }
};

export const leaveOrDeleteConversation = async (req, res, next) => {
  try {
    const result = await conversationService.leaveOrDeleteConversation(req.params.id, req.user._id);
    return sendSuccess(res, result.message, result);
  } catch (error) {
    next(error);
  }
};
