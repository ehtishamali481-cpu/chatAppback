import * as communityService from '../services/communityService.js';
import { sendSuccess } from '../utils/apiResponse.js';

export const createCommunity = async (req, res, next) => {
  try {
    const { name, description, image } = req.body;
    const result = await communityService.createCommunity(req.user._id, {
      name,
      description,
      image,
    });
    return sendSuccess(res, 'Community created successfully', result, 201);
  } catch (error) {
    next(error);
  }
};

export const getCommunityDetails = async (req, res, next) => {
  try {
    const community = await communityService.getCommunityDetails(req.params.id, req.user._id);
    return sendSuccess(res, 'Community details retrieved', { community });
  } catch (error) {
    next(error);
  }
};

export const updateCommunity = async (req, res, next) => {
  try {
    const { name, description, image } = req.body;
    const community = await communityService.updateCommunity(req.params.id, req.user._id, {
      name,
      description,
      image,
    });
    return sendSuccess(res, 'Community updated successfully', { community });
  } catch (error) {
    next(error);
  }
};

export const deleteCommunity = async (req, res, next) => {
  try {
    const result = await communityService.deleteCommunity(req.params.id, req.user._id);
    return sendSuccess(res, 'Community deleted successfully', result);
  } catch (error) {
    next(error);
  }
};

export const joinCommunity = async (req, res, next) => {
  try {
    const community = await communityService.joinCommunity(req.params.id, req.user._id);
    return sendSuccess(res, 'Joined community successfully', { community });
  } catch (error) {
    next(error);
  }
};

export const leaveCommunity = async (req, res, next) => {
  try {
    const result = await communityService.leaveCommunity(req.params.id, req.user._id);
    return sendSuccess(res, 'Left community successfully', result);
  } catch (error) {
    next(error);
  }
};

export const addGroup = async (req, res, next) => {
  try {
    const { groupId } = req.body;
    const community = await communityService.addGroupToCommunity(
      req.params.id,
      req.user._id,
      groupId
    );
    return sendSuccess(res, 'Group added to community', { community });
  } catch (error) {
    next(error);
  }
};

export const removeGroup = async (req, res, next) => {
  try {
    const { groupId } = req.body;
    const community = await communityService.removeGroupFromCommunity(
      req.params.id,
      req.user._id,
      groupId
    );
    return sendSuccess(res, 'Group removed from community', { community });
  } catch (error) {
    next(error);
  }
};

export const promoteAdmin = async (req, res, next) => {
  try {
    const { userId } = req.body;
    const community = await communityService.promoteCommunityAdmin(
      req.params.id,
      req.user._id,
      userId
    );
    return sendSuccess(res, 'Member promoted to community admin', { community });
  } catch (error) {
    next(error);
  }
};

export const demoteAdmin = async (req, res, next) => {
  try {
    const { userId } = req.body;
    const community = await communityService.demoteCommunityAdmin(
      req.params.id,
      req.user._id,
      userId
    );
    return sendSuccess(res, 'Community admin demoted', { community });
  } catch (error) {
    next(error);
  }
};
