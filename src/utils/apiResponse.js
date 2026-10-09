

export const sendSuccess = (res, message = 'Operation successful', data = {}, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

export const sendError = (res, message = 'An error occurred', errors = [], statusCode = 400) => {
  const formattedErrors = Array.isArray(errors)
    ? errors
    : typeof errors === 'string'
    ? [{ msg: errors }]
    : [errors];

  return res.status(statusCode).json({
    success: false,
    message,
    errors: formattedErrors,
  });
};
