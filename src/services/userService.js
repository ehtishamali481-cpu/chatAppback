import User from '../models/User.js';

export const getUserById = async (id) => {
  const user = await User.findById(id);
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }
  return user;
};

export const searchUsers = async (query, currentUserId) => {
  const filter = {
    _id: { $ne: currentUserId },
  };

  if (query) {
    const regex = new RegExp(query.trim(), 'i');
    filter.$or = [{ email: regex }, { fullName: regex }, { username: regex }];
  }

  const users = await User.find(filter).limit(30).select('-password');
  return users;
};

export const findUserByEmail = async (email) => {
  if (!email) return null;
  const normalizedEmail = email.toLowerCase().trim();
  const escaped = normalizedEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const user = await User.findOne({
    $or: [
      { email: normalizedEmail },
      { email: { $regex: new RegExp(`^${escaped}$`, 'i') } },
    ],
  }).select('-password');
  return user;
};

export const updateProfile = async (userId, updateData) => {
  const allowedUpdates = ['fullName', 'about', 'username', 'profileImage'];
  const dataToUpdate = {};

  for (const key of allowedUpdates) {
    if (updateData[key] !== undefined) {
      if (key === 'profileImage' && typeof updateData[key] === 'string') {
        dataToUpdate.profileImage = { url: updateData[key], publicId: '' };
      } else {
        dataToUpdate[key] = updateData[key];
      }
    }
  }

  if (dataToUpdate.about !== undefined) {
    dataToUpdate.aboutUpdatedAt = new Date();
  }

if (dataToUpdate.username) {
    const existing = await User.findOne({
      username: dataToUpdate.username.toLowerCase(),
      _id: { $ne: userId },
    });
    if (existing) {
      const error = new Error('Username is already taken');
      error.statusCode = 409;
      error.errors = [{ field: 'username', message: 'Username is already taken' }];
      throw error;
    }
    dataToUpdate.username = dataToUpdate.username.toLowerCase();
  }

  const user = await User.findByIdAndUpdate(userId, dataToUpdate, {
    new: true,
    runValidators: true,
  }).select('-password');

  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  return user;
};

export const updateOnlineStatus = async (userId, online) => {
  const update = { online };
  if (!online) {
    update.lastSeen = new Date();
  }
  return await User.findByIdAndUpdate(userId, update, { new: true }).select('online lastSeen');
};

export const getLastSeen = async (userId) => {
  const user = await User.findById(userId).select('online lastSeen fullName email profileImage');
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }
  return {
    userId: user._id,
    online: user.online,
    lastSeen: user.lastSeen,
  };
};
