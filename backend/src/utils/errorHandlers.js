import { ApiError, sendError } from "./apiResponse.js";

export const notFoundHandler = (_req, _res, next) => {
  next(new ApiError(404, "Route not found"));
};

export const globalErrorHandler = (error, _req, res, _next) => {
  const statusCode = error?.statusCode || 500;
  const message = error?.message || "Server error";
  const details = error?.details || null;

  return sendError(res, {
    statusCode,
    message,
    details
  });
};
