export class ApiError extends Error {
  constructor(statusCode, message, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
  }
}

export const sendSuccess = (res, { statusCode = 200, message = "Success", data = {} } = {}) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  });
};

export const sendError = (res, { statusCode = 500, message = "Server error", details = null } = {}) => {
  return res.status(statusCode).json({
    success: false,
    message,
    details
  });
};

export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
