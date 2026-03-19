const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const OTP_REGEX = /^\d{6}$/;

export const normalizeEmail = (email) => (email || "").trim().toLowerCase();

export const isValidEmail = (email) => EMAIL_REGEX.test(normalizeEmail(email));

export const isValidOtp = (otp) => OTP_REGEX.test(String(otp || "").trim());
