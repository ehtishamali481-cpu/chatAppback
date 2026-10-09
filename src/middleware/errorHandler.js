import { sendError } from '../utils/apiResponse.js';

export const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let errors = err.errors || [];

if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid ID format for parameter: ${err.path}`;
    errors = [{ field: err.path, message: `Invalid ObjectId '${err.value}'` }];
  }

if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    const value = err.keyValue ? err.keyValue[field] : '';
    message = `Duplicate value error: An account or resource with ${field} '${value}' already exists.`;
    errors = [{ field, message: `${field} already in use` }];
  }

if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation Error';
    errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
  }

if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token. Authorization denied.';
  }
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token has expired. Please re-authenticate.';
  }

if (err.name === 'MulterError') {
    statusCode = 400;
    if (err.code === 'LIMIT_FILE_SIZE') {
      message = 'File size exceeds maximum allowed limit';
    } else {
      message = `File upload error: ${err.message}`;
    }
  }

if (statusCode === 500) {
    console.error('[Unhandled Server Error]:', err);
  }

  return sendError(res, message, errors, statusCode);
};

export const notFoundHandler = (req, res, next) => {
  return sendError(res, `Route not found - ${req.originalUrl}`, [], 404);
};
