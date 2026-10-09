import * as userService from '../services/userService.js';
import { sendSuccess } from '../utils/apiResponse.js';

export const getCurrentUser = async (req, res, next) => {
  try {
    return sendSuccess(res, 'User retrieved successfully', { user: req.user });
  } catch (error) {
    next(error);
  }
};

export const getUserById = async (req, res, next) => {
  try {
    const user = await userService.getUserById(req.params.id);
    return sendSuccess(res, 'User profile retrieved', { user });
  } catch (error) {
    next(error);
  }
};

export const searchUsers = async (req, res, next) => {
  try {
    const query = req.query.q || req.query.email || req.query.search || '';
    const users = await userService.searchUsers(query, req.user._id);
    return sendSuccess(res, 'Users retrieved', { users });
  } catch (error) {
    next(error);
  }
};

export const getUserByEmail = async (req, res, next) => {
  try {
    const email = (req.query.email || req.params.email || '').trim().toLowerCase();
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email parameter is required',
      });
    }

    if (req.user && req.user.email?.toLowerCase().trim() === email) {
      return res.status(400).json({
        success: false,
        message: 'You cannot start a direct chat with yourself',
        isSelf: true,
      });
    }

    const user = await userService.findUserByEmail(email);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: `No user found with email: ${email}`,
      });
    }

    return sendSuccess(res, 'User found successfully', { user });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const updated = await userService.updateProfile(req.user._id, req.body);
    const io = req.app.get('io');
    if (io) {
      io.emit('user:profile_updated', {
        userId: req.user._id,
        user: updated,
      });
    }
    return sendSuccess(res, 'Profile updated successfully', { user: updated });
  } catch (error) {
    next(error);
  }
};

export const updateProfileImage = async (req, res, next) => {
  try {
    const { profileImage } = req.body;
    const updated = await userService.updateProfile(req.user._id, { profileImage });
    const io = req.app.get('io');
    if (io) {
      io.emit('user:profile_updated', {
        userId: req.user._id,
        user: updated,
      });
    }
    return sendSuccess(res, 'Profile image updated successfully', { user: updated });
  } catch (error) {
    next(error);
  }
};

export const updateAbout = async (req, res, next) => {
  try {
    const { about } = req.body;
    const updated = await userService.updateProfile(req.user._id, { about });
    const io = req.app.get('io');
    if (io) {
      io.emit('user:profile_updated', {
        userId: req.user._id,
        user: updated,
      });
    }
    return sendSuccess(res, 'About updated successfully', { user: updated });
  } catch (error) {
    next(error);
  }
};

export const updateOnlineStatus = async (req, res, next) => {
  try {
    const { online } = req.body;
    const updated = await userService.updateOnlineStatus(req.user._id, Boolean(online));
    return sendSuccess(res, 'Online status updated', { status: updated });
  } catch (error) {
    next(error);
  }
};

export const getLastSeen = async (req, res, next) => {
  try {
    const lastSeenData = await userService.getLastSeen(req.params.id);
    return sendSuccess(res, 'Last seen retrieved', lastSeenData);
  } catch (error) {
    next(error);
  }
};
