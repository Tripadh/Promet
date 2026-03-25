import rateLimit from 'express-rate-limit';

/**
 * Limit overall prompt requests to 10 per minute per IP.
 */
export const promptRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 10,
  message: {
    message: "Too many prompt requests. Please try again later."
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Limit OTP requests to 3 per 5 minutes per IP to prevent abuse.
 */
export const otpRequestLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 3,
  message: {
    success: false,
    message: "Too many OTP requests. Please try again in 5 minutes."
  },
  standardHeaders: true,
  legacyHeaders: false,
});
