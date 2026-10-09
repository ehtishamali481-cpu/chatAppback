import Group from '../models/Group.js';
import Conversation from '../models/Conversation.js';
import User from '../models/User.js';
import { CONVERSATION_TYPES } from '../config/constants.js';

export const createGroup = async (ownerId, { name, description = '', image = null, members = [] }) => {
  const uniqueMembers = Array.from(
    new Set([ownerId.toString(), ...members.map((m) => m.toString())])
  );

  const group = await Group.create({
    name: name.trim(),
    description: description.trim(),
    image: image || { url: '', publicId: '' },
    owner: ownerId,
    admins: [ownerId],
    members: uniqueMembers,
  });

  const unreadCounts = {};
  uniqueMembers.forEach((id) => {
    unreadCounts[id] = 0;
  });

  const conversation = await Conversation.create({
    type: CONVERSATION_TYPES.GROUP,
    participants: uniqueMembers,
    group: group._id,
    unreadCounts,
  });

  const populatedGroup = await Group.findById(group._id)
    .populate('owner', 'fullName email profileImage')
    .populate('admins', 'fullName email profileImage')
    .populate('members', 'fullName email profileImage online lastSeen');

  return {
    group: populatedGroup,
    conversationId: conversation._id,
  };
};

export const getGroupDetails = async (groupId, userId) => {
  const group = await Group.findById(groupId)
    .populate('owner', 'fullName email profileImage')
    .populate('admins', 'fullName email profileImage')
    .populate('members', 'fullName email profileImage online lastSeen');

  if (!group) {
    const error = new Error('Group not found');
    error.statusCode = 404;
    throw error;
  }

  const isMember = group.members.some((m) => m._id.equals(userId));
  if (!isMember) {
    const error = new Error('Unauthorized: You are not a member of this group');
    error.statusCode = 403;
    throw error;
  }

  return group;
};

export const updateGroup = async (groupId, userId, { name, description, image }) => {
  const group = await Group.findById(groupId);

  if (!group) {
    const error = new Error('Group not found');
    error.statusCode = 404;
    throw error;
  }

  const isAdmin = group.admins.some((id) => id.equals(userId));
  if (!isAdmin) {
    const error = new Error('Unauthorized: Only group admins can update group details');
    error.statusCode = 403;
    throw error;
  }

  if (name !== undefined) group.name = name.trim();
  if (description !== undefined) group.description = description.trim();
  if (image !== undefined) group.image = typeof image === 'string' ? { url: image, publicId: '' } : image;

  await group.save();

  return await Group.findById(groupId)
    .populate('owner', 'fullName email profileImage')
    .populate('admins', 'fullName email profileImage')
    .populate('members', 'fullName email profileImage');
};

export const addGroupMember = async (groupId, adminId, targetUserId) => {
  const group = await Group.findById(groupId);

  if (!group) {
    const error = new Error('Group not found');
    error.statusCode = 404;
    throw error;
  }

  const isAdmin = group.admins.some((id) => id.equals(adminId));
  if (!isAdmin) {
    const error = new Error('Unauthorized: Only group admins can add members');
    error.statusCode = 403;
    throw error;
  }

  const targetUser = await User.findById(targetUserId);
  if (!targetUser) {
    const error = new Error('User to add not found');
    error.statusCode = 404;
    throw error;
  }

  const isAlreadyMember = group.members.some((id) => id.equals(targetUserId));
  if (isAlreadyMember) {
    const error = new Error('User is already a member of this group');
    error.statusCode = 400;
    throw error;
  }

  group.members.push(targetUserId);
  await group.save();

await Conversation.findOneAndUpdate(
    { group: groupId },
    { $addToSet: { participants: targetUserId } }
  );

  return await Group.findById(groupId)
    .populate('owner', 'fullName email profileImage')
    .populate('admins', 'fullName email profileImage')
    .populate('members', 'fullName email profileImage');
};

export const removeGroupMember = async (groupId, adminId, targetUserId) => {
  const group = await Group.findById(groupId);

  if (!group) {
    const error = new Error('Group not found');
    error.statusCode = 404;
    throw error;
  }

  const isAdmin = group.admins.some((id) => id.equals(adminId));
  if (!isAdmin) {
    const error = new Error('Unauthorized: Only group admins can remove members');
    error.statusCode = 403;
    throw error;
  }

  if (group.owner.equals(targetUserId)) {
    const error = new Error('Group owner cannot be removed from the group');
    error.statusCode = 400;
    throw error;
  }

  group.members = group.members.filter((id) => !id.equals(targetUserId));
  group.admins = group.admins.filter((id) => !id.equals(targetUserId));
  await group.save();

await Conversation.findOneAndUpdate(
    { group: groupId },
    { $pull: { participants: targetUserId } }
  );

  return await Group.findById(groupId)
    .populate('owner', 'fullName email profileImage')
    .populate('admins', 'fullName email profileImage')
    .populate('members', 'fullName email profileImage');
};

export const leaveGroup = async (groupId, userId) => {
  const group = await Group.findById(groupId);

  if (!group) {
    const error = new Error('Group not found');
    error.statusCode = 404;
    throw error;
  }

  const isMember = group.members.some((id) => id.equals(userId));
  if (!isMember) {
    const error = new Error('You are not a member of this group');
    error.statusCode = 400;
    throw error;
  }

  group.members = group.members.filter((id) => !id.equals(userId));
  group.admins = group.admins.filter((id) => !id.equals(userId));

if (group.owner.equals(userId)) {
    if (group.admins.length > 0) {
      group.owner = group.admins[0];
    } else if (group.members.length > 0) {
      group.owner = group.members[0];
      group.admins.push(group.members[0]);
    }
  }

  await group.save();

  await Conversation.findOneAndUpdate(
    { group: groupId },
    { $pull: { participants: userId } }
  );

  return { message: 'Left group successfully', groupId };
};

export const promoteToAdmin = async (groupId, requestUserId, targetUserId) => {
  const group = await Group.findById(groupId);

  if (!group) {
    const error = new Error('Group not found');
    error.statusCode = 404;
    throw error;
  }

  const isAdmin = group.admins.some((id) => id.equals(requestUserId));
  if (!isAdmin) {
    const error = new Error('Unauthorized: Only group admins can promote members');
    error.statusCode = 403;
    throw error;
  }

  const isMember = group.members.some((id) => id.equals(targetUserId));
  if (!isMember) {
    const error = new Error('Target user is not a member of this group');
    error.statusCode = 400;
    throw error;
  }

  const isAlreadyAdmin = group.admins.some((id) => id.equals(targetUserId));
  if (isAlreadyAdmin) {
    const error = new Error('User is already an admin');
    error.statusCode = 400;
    throw error;
  }

  group.admins.push(targetUserId);
  await group.save();

  return await Group.findById(groupId)
    .populate('owner', 'fullName email profileImage')
    .populate('admins', 'fullName email profileImage')
    .populate('members', 'fullName email profileImage');
};

export const demoteAdmin = async (groupId, requestUserId, targetUserId) => {
  const group = await Group.findById(groupId);

  if (!group) {
    const error = new Error('Group not found');
    error.statusCode = 404;
    throw error;
  }

const isAdmin = group.admins.some((id) => id.equals(requestUserId));
  if (!isAdmin) {
    const error = new Error('Unauthorized: Only admins can demote other admins');
    error.statusCode = 403;
    throw error;
  }

  if (group.owner.equals(targetUserId)) {
    const error = new Error('Cannot demote the group owner');
    error.statusCode = 400;
    throw error;
  }

  group.admins = group.admins.filter((id) => !id.equals(targetUserId));
  await group.save();

  return await Group.findById(groupId)
    .populate('owner', 'fullName email profileImage')
    .populate('admins', 'fullName email profileImage')
    .populate('members', 'fullName email profileImage');
};
