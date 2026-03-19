import { ApiError } from "../utils/apiResponse.js";

// Placeholder middleware for CAPTCHA verification integration.
// Replace this with real verification logic for production CAPTCHA providers.
export const verifyCaptchaPlaceholder = (req, _res, next) => {
  if (process.env.CAPTCHA_REQUIRED !== "true") {
    return next();
  }

  const { captchaToken } = req.body || {};
  if (!captchaToken) {
    return next(new ApiError(400, "CAPTCHA token is required"));
  }

  return next();
};
