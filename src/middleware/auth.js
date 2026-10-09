import { verifyToken } from '../utils/tokenUtils.js';
import { sendError } from '../utils/apiResponse.js';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  try {
    let token = null;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return sendError(res, 'Authentication token is missing or malformed', [], 401);
    }

    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return sendError(res, 'Authentication token has expired. Please log in again.', [], 401);
      }
      return sendError(res, 'Invalid authentication token', [], 401);
    }

    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return sendError(res, 'User belonging to this token no longer exists', [], 401);
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};
