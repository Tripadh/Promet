const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const OTP_REGEX = /^\d{6}$/;

export const normalizeEmail = (email) => (email || "").trim().toLowerCase();

export const isValidEmail = (email) => EMAIL_REGEX.test(normalizeEmail(email));

export const isValidOtp = (otp) => OTP_REGEX.test(String(otp || "").trim());

import { AI_CONFIG } from "../config/aiConfig.js";

export const validatePromptRequest = (req) => {
  const { prompt, mode, domain } = req.body;
  const errors = [];

  if (typeof prompt !== "string") {
    errors.push("Prompt must be a valid string.");
  } else if (prompt.trim().length === 0) {
    errors.push("Prompt cannot be empty.");
  } else if (prompt.length > AI_CONFIG.LIMITS.MAX_PROMPT_LENGTH) {
    errors.push(`Prompt exceeds maximum length of ${AI_CONFIG.LIMITS.MAX_PROMPT_LENGTH} characters.`);
  }

  if (mode && !Object.keys(AI_CONFIG.MODELS).includes(mode) && mode !== "chat") {
    errors.push(`Invalid mode: ${mode}`);
  }

  const validDomains = ["tech", "social", "marketing", "creative", "email", "education"];
  if (domain && !validDomains.includes(domain)) {
    errors.push(`Invalid domain: ${domain}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};
