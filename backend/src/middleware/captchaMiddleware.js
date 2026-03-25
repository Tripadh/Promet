import axios from "axios";
import { ApiError } from "../utils/apiResponse.js";

// Placeholder middleware for CAPTCHA verification integration.
// Replace this with real verification logic for production CAPTCHA providers.
export const verifyCaptchaMiddleware = async (req, _res, next) => {
  if (process.env.CAPTCHA_REQUIRED !== "true") {
    return next();
  }

  const { captchaToken } = req.body || {};
  if (!captchaToken) {
    return next(new ApiError(400, "Security check token is required"));
  }

  try {
    const secretKey = process.env.TURNSTILE_SECRET_KEY || '1x0000000000000000000000000000000AA';
    
    const response = await axios.post(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      new URLSearchParams({
        secret: secretKey,
        response: captchaToken,
        remoteip: req.ip,
      }).toString(),
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      }
    );

    if (!response.data || !response.data.success) {
      return next(new ApiError(400, "Security check failed. Please try again."));
    }

    return next();
  } catch (error) {
    return next(new ApiError(500, "Internal server error during security check"));
  }
};
