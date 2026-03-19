import rateLimit from "express-rate-limit";
import { normalizeEmail } from "../utils/validators.js";

export const otpRequestLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const email = normalizeEmail(req.body?.email);
    return email || `ip:${req.ip}`;
  },
  handler: (_req, res) => {
    return res.status(429).json({
      success: false,
      message: "Too many OTP requests. Try again in a minute"
    });
  }
});
