import Status from '../models/Status.js';
import Conversation from '../models/Conversation.js';
import { TIME_LIMITS, STATUS_TYPES } from '../config/constants.js';

export const createStatus = async (userId, { type = STATUS_TYPES.TEXT, text = '', mediaUrl = '', mediaMeta = {} }) => {
  const expiresAt = new Date(Date.now() + TIME_LIMITS.STATUS_EXPIRATION_HOURS * 60 * 60 * 1000);

  const status = await Status.create({
    userId,
    type,
    text,
    mediaUrl,
    mediaMeta,
    viewers: [],
    expiresAt,
  });

  const populated = await Status.findById(status._id).populate('userId', 'fullName email profileImage');
  return populated;
};

export const getMyStatuses = async (userId) => {
  const now = new Date();

  const statuses = await Status.find({
    userId,
    expiresAt: { $gt: now },
  })
    .sort({ createdAt: -1 })
    .populate('viewers.userId', 'fullName email profileImage');

  return statuses.map((status) => {
    const json = status.toJSON();
    json.totalViews = status.viewers.length;
    return json;
  });
};

export const getContactsStatuses = async (userId) => {
  const now = new Date();

const conversations = await Conversation.find({ participants: userId }).select('participants');
  const contactIds = new Set();

  conversations.forEach((conv) => {
    conv.participants.forEach((pId) => {
      if (!pId.equals(userId)) {
        contactIds.add(pId.toString());
      }
    });
  });

  const statuses = await Status.find({
    userId: { $in: Array.from(contactIds) },
    expiresAt: { $gt: now },
  })
    .sort({ createdAt: -1 })
    .populate('userId', 'fullName email profileImage')
    .populate('viewers.userId', 'fullName email profileImage');

  return statuses;
};

export const viewStatus = async (statusId, viewerUserId) => {
  const now = new Date();

  const status = await Status.findOne({
    _id: statusId,
    expiresAt: { $gt: now },
  });

  if (!status) {
    const error = new Error('Status not found or expired');
    error.statusCode = 404;
    throw error;
  }

if (status.userId.equals(viewerUserId)) {
    return {
      statusId,
      viewed: true,
      uniqueViewersCount: status.viewers.length,
      alreadyViewed: true,
    };
  }

const alreadyViewed = status.viewers.some((v) => v.userId.equals(viewerUserId));

  if (!alreadyViewed) {
    status.viewers.push({
      userId: viewerUserId,
      viewedAt: now,
    });
    await status.save();
  }

  return {
    statusId,
    viewed: true,
    uniqueViewersCount: status.viewers.length,
    alreadyViewed,
  };
};

export const getStatusViewers = async (statusId, ownerUserId) => {
  const status = await Status.findById(statusId).populate('viewers.userId', 'fullName email profileImage');

  if (!status) {
    const error = new Error('Status not found or expired');
    error.statusCode = 404;
    throw error;
  }

  if (!status.userId.equals(ownerUserId)) {
    const error = new Error('Unauthorized: Only the status owner can view the viewers list');
    error.statusCode = 403;
    throw error;
  }

  return {
    statusId: status._id,
    totalViews: status.viewers.length,
    viewers: status.viewers,
  };
};

export const deleteStatus = async (statusId, userId) => {
  const status = await Status.findById(statusId);

  if (!status) {
    const error = new Error('Status not found');
    error.statusCode = 404;
    throw error;
  }

  if (!status.userId.equals(userId)) {
    const error = new Error('Unauthorized: You can only delete your own status');
    error.statusCode = 403;
    throw error;
  }

  await Status.findByIdAndDelete(statusId);
  return { deleted: true, statusId };
};
