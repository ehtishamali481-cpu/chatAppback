import Community from '../models/Community.js';
import Group from '../models/Group.js';
import Conversation from '../models/Conversation.js';
import { CONVERSATION_TYPES } from '../config/constants.js';

export const createCommunity = async (ownerId, { name, description = '', image = null }) => {
  
  const announcementGroup = await Group.create({
    name: `${name.trim()} - Announcements`,
    description: `Official announcements for ${name.trim()}`,
    image: image || { url: '', publicId: '' },
    owner: ownerId,
    admins: [ownerId],
    members: [ownerId],
    isAnnouncementOnly: true,
  });

  const announcementConversation = await Conversation.create({
    type: CONVERSATION_TYPES.GROUP,
    participants: [ownerId],
    group: announcementGroup._id,
    unreadCounts: { [ownerId.toString()]: 0 },
  });

  const community = await Community.create({
    name: name.trim(),
    description: description.trim(),
    image: image || { url: '', publicId: '' },
    owner: ownerId,
    admins: [ownerId],
    members: [ownerId],
    groups: [announcementGroup._id],
    announcementGroup: announcementGroup._id,
  });

  announcementGroup.community = community._id;
  await announcementGroup.save();

  const populated = await Community.findById(community._id)
    .populate('owner', 'fullName email profileImage')
    .populate('admins', 'fullName email profileImage')
    .populate('members', 'fullName email profileImage online lastSeen')
    .populate('groups', 'name image description members')
    .populate('announcementGroup');

  return {
    community: populated,
    announcementConversationId: announcementConversation._id,
  };
};

export const getCommunityDetails = async (communityId, userId) => {
  const community = await Community.findById(communityId)
    .populate('owner', 'fullName email profileImage')
    .populate('admins', 'fullName email profileImage')
    .populate('members', 'fullName email profileImage online lastSeen')
    .populate('groups', 'name image description members isAnnouncementOnly')
    .populate('announcementGroup');

  if (!community) {
    const error = new Error('Community not found');
    error.statusCode = 404;
    throw error;
  }

  return community;
};

export const updateCommunity = async (communityId, userId, { name, description, image }) => {
  const community = await Community.findById(communityId);

  if (!community) {
    const error = new Error('Community not found');
    error.statusCode = 404;
    throw error;
  }

  const isAdmin = community.admins.some((id) => id.equals(userId));
  if (!isAdmin) {
    const error = new Error('Unauthorized: Only community admins can update community details');
    error.statusCode = 403;
    throw error;
  }

  if (name !== undefined) community.name = name.trim();
  if (description !== undefined) community.description = description.trim();
  if (image !== undefined) community.image = typeof image === 'string' ? { url: image, publicId: '' } : image;

  await community.save();

  return await Community.findById(communityId)
    .populate('owner', 'fullName email profileImage')
    .populate('admins', 'fullName email profileImage')
    .populate('groups');
};

export const deleteCommunity = async (communityId, userId) => {
  const community = await Community.findById(communityId);

  if (!community) {
    const error = new Error('Community not found');
    error.statusCode = 404;
    throw error;
  }

  if (!community.owner.equals(userId)) {
    const error = new Error('Unauthorized: Only the community owner can delete the community');
    error.statusCode = 403;
    throw error;
  }

  await Community.findByIdAndDelete(communityId);
  return { deleted: true, communityId };
};

export const joinCommunity = async (communityId, userId) => {
  const community = await Community.findById(communityId);

  if (!community) {
    const error = new Error('Community not found');
    error.statusCode = 404;
    throw error;
  }

  const isMember = community.members.some((id) => id.equals(userId));
  if (isMember) {
    const error = new Error('User is already a member of this community');
    error.statusCode = 400;
    throw error;
  }

  community.members.push(userId);
  await community.save();

if (community.announcementGroup) {
    await Group.findByIdAndUpdate(community.announcementGroup, {
      $addToSet: { members: userId },
    });
    await Conversation.findOneAndUpdate(
      { group: community.announcementGroup },
      { $addToSet: { participants: userId } }
    );
  }

  return await Community.findById(communityId)
    .populate('owner', 'fullName email profileImage')
    .populate('admins', 'fullName email profileImage')
    .populate('members', 'fullName email profileImage');
};

export const leaveCommunity = async (communityId, userId) => {
  const community = await Community.findById(communityId);

  if (!community) {
    const error = new Error('Community not found');
    error.statusCode = 404;
    throw error;
  }

  community.members = community.members.filter((id) => !id.equals(userId));
  community.admins = community.admins.filter((id) => !id.equals(userId));

  if (community.owner.equals(userId) && community.members.length > 0) {
    community.owner = community.admins[0] || community.members[0];
  }

  await community.save();

  if (community.announcementGroup) {
    await Group.findByIdAndUpdate(community.announcementGroup, {
      $pull: { members: userId, admins: userId },
    });
    await Conversation.findOneAndUpdate(
      { group: community.announcementGroup },
      { $pull: { participants: userId } }
    );
  }

  return { message: 'Left community successfully', communityId };
};

export const addGroupToCommunity = async (communityId, adminId, groupId) => {
  const community = await Community.findById(communityId);

  if (!community) {
    const error = new Error('Community not found');
    error.statusCode = 404;
    throw error;
  }

  const isAdmin = community.admins.some((id) => id.equals(adminId));
  if (!isAdmin) {
    const error = new Error('Unauthorized: Only community admins can add groups');
    error.statusCode = 403;
    throw error;
  }

  const group = await Group.findById(groupId);
  if (!group) {
    const error = new Error('Group not found');
    error.statusCode = 404;
    throw error;
  }

const isGroupAdmin = group.admins.some((id) => id.equals(adminId)) || group.owner.equals(adminId);
  if (!isGroupAdmin) {
    const error = new Error('Unauthorized: You must be an admin of the group to add it to a community');
    error.statusCode = 403;
    throw error;
  }

  const isAlreadyAdded = community.groups.some((id) => id.equals(groupId));
  if (isAlreadyAdded) {
    const error = new Error('Group is already part of this community');
    error.statusCode = 400;
    throw error;
  }

  community.groups.push(groupId);
  await community.save();

  group.community = communityId;
  await group.save();

  return await Community.findById(communityId).populate('groups');
};

export const removeGroupFromCommunity = async (communityId, adminId, groupId) => {
  const community = await Community.findById(communityId);

  if (!community) {
    const error = new Error('Community not found');
    error.statusCode = 404;
    throw error;
  }

  const isAdmin = community.admins.some((id) => id.equals(adminId));
  if (!isAdmin) {
    const error = new Error('Unauthorized: Only community admins can remove groups');
    error.statusCode = 403;
    throw error;
  }

  if (community.announcementGroup && community.announcementGroup.equals(groupId)) {
    const error = new Error('Cannot remove the primary announcement group from the community');
    error.statusCode = 400;
    throw error;
  }

  community.groups = community.groups.filter((id) => !id.equals(groupId));
  await community.save();

  await Group.findByIdAndUpdate(groupId, { community: null });

  return await Community.findById(communityId).populate('groups');
};

export const promoteCommunityAdmin = async (communityId, requestUserId, targetUserId) => {
  const community = await Community.findById(communityId);

  if (!community) {
    const error = new Error('Community not found');
    error.statusCode = 404;
    throw error;
  }

  const isAdmin = community.admins.some((id) => id.equals(requestUserId));
  if (!isAdmin) {
    const error = new Error('Unauthorized: Only community admins can promote members');
    error.statusCode = 403;
    throw error;
  }

  const isMember = community.members.some((id) => id.equals(targetUserId));
  if (!isMember) {
    const error = new Error('Target user is not a member of this community');
    error.statusCode = 400;
    throw error;
  }

  const isAlreadyAdmin = community.admins.some((id) => id.equals(targetUserId));
  if (isAlreadyAdmin) {
    const error = new Error('User is already a community admin');
    error.statusCode = 400;
    throw error;
  }

  community.admins.push(targetUserId);
  await community.save();

  return await Community.findById(communityId)
    .populate('owner', 'fullName email profileImage')
    .populate('admins', 'fullName email profileImage')
    .populate('members', 'fullName email profileImage');
};

export const demoteCommunityAdmin = async (communityId, requestUserId, targetUserId) => {
  const community = await Community.findById(communityId);

  if (!community) {
    const error = new Error('Community not found');
    error.statusCode = 404;
    throw error;
  }

  if (!community.owner.equals(requestUserId)) {
    const error = new Error('Unauthorized: Only the community owner can demote admins');
    error.statusCode = 403;
    throw error;
  }

  if (community.owner.equals(targetUserId)) {
    const error = new Error('Cannot demote the community owner');
    error.statusCode = 400;
    throw error;
  }

  community.admins = community.admins.filter((id) => !id.equals(targetUserId));
  await community.save();

  return await Community.findById(communityId)
    .populate('owner', 'fullName email profileImage')
    .populate('admins', 'fullName email profileImage')
    .populate('members', 'fullName email profileImage');
};
