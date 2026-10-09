import User from '../models/User.js';
import { hashPassword, comparePassword } from '../utils/passwordUtils.js';
import { generateToken } from '../utils/tokenUtils.js';

export const registerUser = async ({ fullName, email, password, profileImage }) => {
  const normalizedEmail = email.toLowerCase().trim();

const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    const error = new Error('An account with this email address already exists');
    error.statusCode = 409;
    error.errors = [{ field: 'email', message: 'Email address is already in use' }];
    throw error;
  }

  const hashedPassword = await hashPassword(password);

  const userData = {
    fullName: fullName.trim(),
    email: normalizedEmail,
    password: hashedPassword,
  };

  if (profileImage) {
    userData.profileImage = typeof profileImage === 'string'
      ? { url: profileImage, publicId: '' }
      : profileImage;
  }

  const user = await User.create(userData);

  const token = generateToken({ id: user._id, email: user.email });

  const safeUser = user.toJSON();

  return {
    user: safeUser,
    token,
  };
};

export const loginUser = async ({ email, password }) => {
  const normalizedEmail = email.toLowerCase().trim();

  const user = await User.findOne({ email: normalizedEmail }).select('+password');
  if (!user) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  const isPasswordValid = await comparePassword(password, user.password);
  if (!isPasswordValid) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  user.online = true;
  user.lastSeen = new Date();
  await user.save();

  const token = generateToken({ id: user._id, email: user.email });
  const safeUser = user.toJSON();

  return {
    user: safeUser,
    token,
  };
};
