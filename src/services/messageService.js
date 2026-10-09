import Message from '../models/Message.js';
import Conversation from '../models/Conversation.js';
import { TIME_LIMITS, MESSAGE_TYPES } from '../config/constants.js';
import { formatPaginatedResponse } from '../utils/pagination.js';

export const createMessage = async ({
  conversationId,
  senderId,
  messageType = MESSAGE_TYPES.TEXT,
  text = '',
  mediaUrl = '',
  mediaMeta = {},
  location = null,
  contact = null,
  replyTo = null,
  forwardedFrom = null,
}) => {
  
  const conversation = await Conversation.findOne({
    _id: conversationId,
    participants: senderId,
  });

  if (!conversation) {
    const error = new Error('Conversation not found or sender is not a participant');
    error.statusCode = 403;
    throw error;
  }

const messageData = {
    conversationId,
    senderId,
    messageType,
    text,
    mediaUrl,
    mediaMeta,
    location,
    contact,
    replyTo,
    forwardedFrom,
    deliveredTo: [{ userId: senderId, deliveredAt: new Date() }],
    readBy: [{ userId: senderId, readAt: new Date() }],
  };

  const message = await Message.create(messageData);

conversation.lastMessage = message._id;
  conversation.lastMessageAt = message.createdAt;

  if (!conversation.unreadCounts) {
    conversation.unreadCounts = new Map();
  }

  conversation.participants.forEach((pId) => {
    const idStr = pId.toString();
    if (idStr !== senderId.toString()) {
      const current = conversation.unreadCounts.get(idStr) || 0;
      conversation.unreadCounts.set(idStr, current + 1);
    }
  });

  await conversation.save();

  const populatedMessage = await Message.findById(message._id)
    .populate('senderId', 'fullName email profileImage')
    .populate('replyTo', 'text messageType senderId mediaUrl')
    .populate('forwardedFrom', 'text messageType senderId');

  return {
    message: populatedMessage,
    conversation,
  };
};

export const getConversationMessages = async (conversationId, userId, pagination) => {
  const { page, limit, skip } = pagination;

const conversation = await Conversation.findOne({
    _id: conversationId,
    participants: userId,
  });

  if (!conversation) {
    const error = new Error('Conversation not found or unauthorized');
    error.statusCode = 403;
    throw error;
  }

const filter = {
    conversationId,
    'deletedForUsers.userId': { $ne: userId },
  };

  const total = await Message.countDocuments(filter);

  const messages = await Message.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('senderId', 'fullName email profileImage')
    .populate({
      path: 'replyTo',
      select: 'text messageType senderId mediaUrl',
      populate: { path: 'senderId', select: 'fullName email' },
    })
    .populate('forwardedFrom', 'text messageType senderId');

const sortedMessages = messages.reverse();

  return formatPaginatedResponse(sortedMessages, total, page, limit);
};

export const editMessage = async (messageId, userId, newText) => {
  const message = await Message.findById(messageId);

  if (!message) {
    const error = new Error('Message not found');
    error.statusCode = 404;
    throw error;
  }

  if (!message.senderId.equals(userId)) {
    const error = new Error('Unauthorized: You can only edit your own messages');
    error.statusCode = 403;
    throw error;
  }

  if (message.messageType !== MESSAGE_TYPES.TEXT) {
    const error = new Error('Only text messages can be edited');
    error.statusCode = 400;
    throw error;
  }

  if (message.deletedForEveryone) {
    const error = new Error('Cannot edit a deleted message');
    error.statusCode = 400;
    throw error;
  }

  message.text = newText;
  message.edited = true;
  message.editedAt = new Date();
  await message.save();

  const populated = await Message.findById(message._id)
    .populate('senderId', 'fullName email profileImage')
    .populate('replyTo', 'text messageType senderId');

  return populated;
};

export const deleteForEveryone = async (messageId, userId) => {
  const message = await Message.findById(messageId);

  if (!message) {
    const error = new Error('Message not found');
    error.statusCode = 404;
    throw error;
  }

  if (!message.senderId.equals(userId)) {
    const error = new Error('Unauthorized: You can only delete your own messages for everyone');
    error.statusCode = 403;
    throw error;
  }

  if (message.deletedForEveryone) {
    return message;
  }

const elapsedTime = Date.now() - new Date(message.createdAt).getTime();
  if (elapsedTime > TIME_LIMITS.DELETE_FOR_EVERYONE_MS) {
    const error = new Error('Message can no longer be deleted for everyone.');
    error.statusCode = 400;
    throw error;
  }

  message.deletedForEveryone = true;
  message.deletedAt = new Date();
  message.text = 'This message was deleted';
  message.mediaUrl = '';
  message.mediaMeta = {};
  message.location = undefined;
  message.contact = undefined;
  await message.save();

  return message;
};

export const deleteForMe = async (messageId, userId) => {
  const message = await Message.findById(messageId);

  if (!message) {
    const error = new Error('Message not found');
    error.statusCode = 404;
    throw error;
  }

const alreadyDeleted = message.deletedForUsers.some((entry) => entry.userId.equals(userId));
  if (!alreadyDeleted) {
    message.deletedForUsers.push({
      userId,
      deletedAt: new Date(),
    });
    await message.save();
  }

  return { messageId, deletedForMe: true };
};

export const reactToMessage = async (messageId, userId, emoji) => {
  const message = await Message.findById(messageId);

  if (!message) {
    const error = new Error('Message not found');
    error.statusCode = 404;
    throw error;
  }

const existingReactionIndex = message.reactions.findIndex((r) => r.userId.equals(userId));

  if (existingReactionIndex > -1) {
    if (message.reactions[existingReactionIndex].emoji === emoji) {
      
      message.reactions.splice(existingReactionIndex, 1);
    } else {
      
      message.reactions[existingReactionIndex].emoji = emoji;
      message.reactions[existingReactionIndex].createdAt = new Date();
    }
  } else {
    
    message.reactions.push({
      userId,
      emoji,
      createdAt: new Date(),
    });
  }

  await message.save();

  const populated = await Message.findById(message._id)
    .populate('reactions.userId', 'fullName email profileImage');

  return populated;
};

export const markMessagesAsRead = async (conversationId, userId) => {
  const conversation = await Conversation.findOne({
    _id: conversationId,
    participants: userId,
  });

  if (!conversation) {
    const error = new Error('Conversation not found or unauthorized');
    error.statusCode = 403;
    throw error;
  }

  const now = new Date();

await Message.updateMany(
    {
      conversationId,
      senderId: { $ne: userId },
      'readBy.userId': { $ne: userId },
    },
    {
      $push: {
        readBy: { userId, readAt: now },
      },
    }
  );

if (conversation.unreadCounts) {
    conversation.unreadCounts.set(userId.toString(), 0);
    await conversation.save();
  }

  return {
    conversationId,
    userId,
    readAt: now,
  };
};

export const searchMessages = async (conversationId, userId, searchTerm, pagination) => {
  const { page, limit, skip } = pagination;

  const conversation = await Conversation.findOne({
    _id: conversationId,
    participants: userId,
  });

  if (!conversation) {
    const error = new Error('Conversation not found or unauthorized');
    error.statusCode = 403;
    throw error;
  }

  const filter = {
    conversationId,
    'deletedForUsers.userId': { $ne: userId },
    deletedForEveryone: false,
    text: { $regex: searchTerm.trim(), $options: 'i' },
  };

  const total = await Message.countDocuments(filter);

  const messages = await Message.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('senderId', 'fullName email profileImage');

  return formatPaginatedResponse(messages, total, page, limit);
};
