import * as groupService from '../services/groupService.js';
import { sendSuccess } from '../utils/apiResponse.js';

export const createGroup = async (req, res, next) => {
  try {
    const { name, description, image, members } = req.body;
    const result = await groupService.createGroup(req.user._id, {
      name,
      description,
      image,
      members,
    });
    return sendSuccess(res, 'Group created successfully', result, 201);
  } catch (error) {
    next(error);
  }
};

export const getGroupDetails = async (req, res, next) => {
  try {
    const group = await groupService.getGroupDetails(req.params.id, req.user._id);
    return sendSuccess(res, 'Group details retrieved', { group });
  } catch (error) {
    next(error);
  }
};

export const updateGroup = async (req, res, next) => {
  try {
    const { name, description, image } = req.body;
    const group = await groupService.updateGroup(req.params.id, req.user._id, {
      name,
      description,
      image,
    });
    return sendSuccess(res, 'Group updated successfully', { group });
  } catch (error) {
    next(error);
  }
};

export const addMember = async (req, res, next) => {
  try {
    const { userId } = req.body;
    const group = await groupService.addGroupMember(req.params.id, req.user._id, userId);
    return sendSuccess(res, 'Member added to group', { group });
  } catch (error) {
    next(error);
  }
};

export const removeMember = async (req, res, next) => {
  try {
    const { userId } = req.body;
    const group = await groupService.removeGroupMember(req.params.id, req.user._id, userId);
    return sendSuccess(res, 'Member removed from group', { group });
  } catch (error) {
    next(error);
  }
};

export const leaveGroup = async (req, res, next) => {
  try {
    const result = await groupService.leaveGroup(req.params.id, req.user._id);
    return sendSuccess(res, 'Left group successfully', result);
  } catch (error) {
    next(error);
  }
};

export const promoteToAdmin = async (req, res, next) => {
  try {
    const { userId } = req.body;
    const group = await groupService.promoteToAdmin(req.params.id, req.user._id, userId);
    return sendSuccess(res, 'Member promoted to admin', { group });
  } catch (error) {
    next(error);
  }
};

export const demoteAdmin = async (req, res, next) => {
  try {
    const { userId } = req.body;
    const group = await groupService.demoteAdmin(req.params.id, req.user._id, userId);
    return sendSuccess(res, 'Admin demoted to member', { group });
  } catch (error) {
    next(error);
  }
};
