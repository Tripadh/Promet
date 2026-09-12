import rateLimit from 'express-rate-limit';

/**
 * Limit overall prompt requests to protect against volumetric attacks.
 * Uses a Redis-ready abstraction (express-rate-limit).
 */
export const promptRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: (req, res) => {
    // Stricter limits for expensive modes
    const mode = req.body?.mode;
    if (mode === "expert") return 5;
    if (mode === "balanced") return 15;
    return 30; // quick/chat/auto
  },
  message: {
    message: "Rate limit exceeded. Please wait a moment before trying again.",
    code: "RATE_LIMIT_EXCEEDED"
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
