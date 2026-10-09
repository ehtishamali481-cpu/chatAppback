import * as messageService from '../services/messageService.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { getPagination } from '../utils/pagination.js';

export const sendMessage = async (req, res, next) => {
  try {
    const {
      conversationId,
      messageType,
      text,
      mediaUrl,
      mediaMeta,
      location,
      contact,
      replyTo,
      forwardedFrom,
    } = req.body;

    const result = await messageService.createMessage({
      conversationId,
      senderId: req.user._id,
      messageType,
      text,
      mediaUrl,
      mediaMeta,
      location,
      contact,
      replyTo,
      forwardedFrom,
    });

    const io = req.app.get('io');
    if (io) {
      io.to(`conversation_${conversationId}`).emit('message:new', result.message);
      io.to(`conversation_${conversationId}`).emit('conversation:updated', {
        conversationId,
        lastMessage: result.message,
      });
      if (result.conversation && Array.isArray(result.conversation.participants)) {
        result.conversation.participants.forEach((pId) => {
          io.to(`user_${pId.toString()}`).emit('message:new', result.message);
        });
      }
    }

    return sendSuccess(res, 'Message sent successfully', { message: result.message }, 201);
  } catch (error) {
    next(error);
  }
};

export const getMessages = async (req, res, next) => {
  try {
    const pagination = getPagination(req.query, 30, 100);
    const result = await messageService.getConversationMessages(
      req.params.conversationId,
      req.user._id,
      pagination
    );
    return sendSuccess(res, 'Messages retrieved', result);
  } catch (error) {
    next(error);
  }
};

export const editMessage = async (req, res, next) => {
  try {
    const { text } = req.body;
    const message = await messageService.editMessage(req.params.id, req.user._id, text);

    const io = req.app.get('io');
    if (io) {
      io.to(`conversation_${message.conversationId}`).emit('message:edit', message);
    }

    return sendSuccess(res, 'Message edited successfully', { message });
  } catch (error) {
    next(error);
  }
};

export const deleteForEveryone = async (req, res, next) => {
  try {
    const message = await messageService.deleteForEveryone(req.params.id, req.user._id);

    const io = req.app.get('io');
    if (io) {
      io.to(`conversation_${message.conversationId}`).emit('message:delete', {
        messageId: message._id,
        conversationId: message.conversationId,
        deletedForEveryone: true,
      });
    }

    return sendSuccess(res, 'Message deleted for everyone', { message });
  } catch (error) {
    next(error);
  }
};

export const deleteForMe = async (req, res, next) => {
  try {
    const result = await messageService.deleteForMe(req.params.id, req.user._id);
    return sendSuccess(res, 'Message deleted for you', result);
  } catch (error) {
    next(error);
  }
};

export const reactToMessage = async (req, res, next) => {
  try {
    const { emoji } = req.body;
    const message = await messageService.reactToMessage(req.params.id, req.user._id, emoji);

    const io = req.app.get('io');
    if (io) {
      io.to(`conversation_${message.conversationId}`).emit('message:reaction', {
        messageId: message._id,
        conversationId: message.conversationId,
        reactions: message.reactions,
      });
    }

    return sendSuccess(res, 'Reaction updated', { message });
  } catch (error) {
    next(error);
  }
};

export const markAsRead = async (req, res, next) => {
  try {
    const result = await messageService.markMessagesAsRead(req.params.conversationId, req.user._id);

    const io = req.app.get('io');
    if (io) {
      io.to(`conversation_${req.params.conversationId}`).emit('message:read', result);
      const Conversation = (await import('../models/Conversation.js')).default;
      const conv = await Conversation.findById(req.params.conversationId).select('participants');
      if (conv && Array.isArray(conv.participants)) {
        conv.participants.forEach((pId) => {
          io.to(`user_${pId.toString()}`).emit('message:read', result);
        });
      }
    }

    return sendSuccess(res, 'Messages marked as read', result);
  } catch (error) {
    next(error);
  }
};

export const searchMessages = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const searchTerm = req.query.q || '';
    const pagination = getPagination(req.query);

    const result = await messageService.searchMessages(
      conversationId,
      req.user._id,
      searchTerm,
      pagination
    );
    return sendSuccess(res, 'Search results', result);
  } catch (error) {
    next(error);
  }
};
