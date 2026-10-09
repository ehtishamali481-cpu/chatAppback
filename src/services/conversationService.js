import Conversation from '../models/Conversation.js';
import User from '../models/User.js';
import { CONVERSATION_TYPES } from '../config/constants.js';
import { formatPaginatedResponse } from '../utils/pagination.js';

export const startChatByEmail = async (currentUserId, recipientEmail) => {
  const normalizedEmail = recipientEmail.toLowerCase().trim();

const recipient = await User.findOne({ email: normalizedEmail });
  if (!recipient) {
    const error = new Error(`No account found with email: ${recipientEmail}`);
    error.statusCode = 404;
    error.errors = [{ field: 'email', message: 'User does not exist' }];
    throw error;
  }

if (recipient._id.equals(currentUserId)) {
    const error = new Error('You cannot start a direct conversation with yourself');
    error.statusCode = 400;
    throw error;
  }

let conversation = await Conversation.findOne({
    type: CONVERSATION_TYPES.DIRECT,
    participants: { $all: [currentUserId, recipient._id], $size: 2 },
  })
    .populate('participants', 'fullName email profileImage online lastSeen about aboutUpdatedAt')
    .populate('lastMessage');

  if (conversation) {
    return {
      conversation,
      isNew: false,
    };
  }

conversation = await Conversation.create({
    type: CONVERSATION_TYPES.DIRECT,
    participants: [currentUserId, recipient._id],
    unreadCounts: {
      [currentUserId.toString()]: 0,
      [recipient._id.toString()]: 0,
    },
  });

  conversation = await Conversation.findById(conversation._id)
    .populate('participants', 'fullName email profileImage online lastSeen about aboutUpdatedAt');

  return {
    conversation,
    isNew: true,
  };
};

export const createGroupConversation = async (currentUserId, { name, participantIds, description, image }) => {
  
  const uniqueParticipants = Array.from(
    new Set([currentUserId.toString(), ...participantIds.map((id) => id.toString())])
  );

const existingUsers = await User.find({ _id: { $in: uniqueParticipants } });
  if (existingUsers.length !== uniqueParticipants.length) {
    const error = new Error('One or more participant IDs are invalid');
    error.statusCode = 400;
    throw error;
  }

const Group = (await import('../models/Group.js')).default;

  const group = await Group.create({
    name,
    description: description || '',
    image: image || { url: '', publicId: '' },
    owner: currentUserId,
    admins: [currentUserId],
    members: uniqueParticipants,
  });

  const unreadCounts = {};
  uniqueParticipants.forEach((pId) => {
    unreadCounts[pId] = 0;
  });

  const conversation = await Conversation.create({
    type: CONVERSATION_TYPES.GROUP,
    participants: uniqueParticipants,
    group: group._id,
    unreadCounts,
  });

  const populated = await Conversation.findById(conversation._id)
    .populate('participants', 'fullName email profileImage online lastSeen about aboutUpdatedAt')
    .populate('group');

  return populated;
};

export const getUserConversations = async (userId, pagination) => {
  const { page, limit, skip } = pagination;

  const filter = {
    participants: userId,
  };

  const total = await Conversation.countDocuments(filter);

  const conversations = await Conversation.find(filter)
    .sort({ lastMessageAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('participants', 'fullName email profileImage online lastSeen about aboutUpdatedAt')
    .populate('group')
    .populate({
      path: 'lastMessage',
      populate: {
        path: 'senderId',
        select: 'fullName email',
      },
    });

  return formatPaginatedResponse(conversations, total, page, limit);
};

export const getConversationById = async (conversationId, userId) => {
  const conversation = await Conversation.findOne({
    _id: conversationId,
    participants: userId,
  })
    .populate('participants', 'fullName email profileImage online lastSeen about aboutUpdatedAt')
    .populate('group')
    .populate({
      path: 'lastMessage',
      populate: {
        path: 'senderId',
        select: 'fullName email',
      },
    });

  if (!conversation) {
    const error = new Error('Conversation not found or unauthorized');
    error.statusCode = 404;
    throw error;
  }

  return conversation;
};

export const toggleArchiveConversation = async (conversationId, userId) => {
  const conversation = await Conversation.findOne({
    _id: conversationId,
    participants: userId,
  });

  if (!conversation) {
    const error = new Error('Conversation not found or unauthorized');
    error.statusCode = 404;
    throw error;
  }

  const isArchived = conversation.archivedBy.some((id) => id.equals(userId));

  if (isArchived) {
    conversation.archivedBy = conversation.archivedBy.filter((id) => !id.equals(userId));
  } else {
    conversation.archivedBy.push(userId);
  }

  await conversation.save();
  return { archived: !isArchived, conversationId };
};

export const toggleMuteConversation = async (conversationId, userId) => {
  const conversation = await Conversation.findOne({
    _id: conversationId,
    participants: userId,
  });

  if (!conversation) {
    const error = new Error('Conversation not found or unauthorized');
    error.statusCode = 404;
    throw error;
  }

  const isMuted = conversation.mutedBy.some((id) => id.equals(userId));

  if (isMuted) {
    conversation.mutedBy = conversation.mutedBy.filter((id) => !id.equals(userId));
  } else {
    conversation.mutedBy.push(userId);
  }

  await conversation.save();
  return { muted: !isMuted, conversationId };
};

export const togglePinConversation = async (conversationId, userId) => {
  const conversation = await Conversation.findOne({
    _id: conversationId,
    participants: userId,
  });

  if (!conversation) {
    const error = new Error('Conversation not found or unauthorized');
    error.statusCode = 404;
    throw error;
  }

  const isPinned = conversation.pinnedBy.some((id) => id.equals(userId));

  if (isPinned) {
    conversation.pinnedBy = conversation.pinnedBy.filter((id) => !id.equals(userId));
  } else {
    conversation.pinnedBy.push(userId);
  }

  await conversation.save();
  return { pinned: !isPinned, conversationId };
};

export const leaveOrDeleteConversation = async (conversationId, userId) => {
  const conversation = await Conversation.findOne({
    _id: conversationId,
    participants: userId,
  });

  if (!conversation) {
    const error = new Error('Conversation not found or unauthorized');
    error.statusCode = 404;
    throw error;
  }

  if (conversation.type === CONVERSATION_TYPES.DIRECT) {
    
    conversation.participants = conversation.participants.filter((id) => !id.equals(userId));
    if (conversation.participants.length === 0) {
      await Conversation.findByIdAndDelete(conversationId);
      return { deleted: true, message: 'Conversation deleted' };
    }
    await conversation.save();
    return { left: true, message: 'Conversation cleared' };
  } else {
    
    conversation.participants = conversation.participants.filter((id) => !id.equals(userId));
    await conversation.save();

    const Group = (await import('../models/Group.js')).default;
    await Group.findByIdAndUpdate(conversation.group, {
      $pull: { members: userId, admins: userId },
    });

    return { left: true, message: 'Left group conversation successfully' };
  }
};
