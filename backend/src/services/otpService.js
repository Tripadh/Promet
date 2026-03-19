import bcrypt from "bcryptjs";
import OtpCode from "../models/OtpCode.js";
import { ApiError } from "../utils/apiResponse.js";
import { normalizeEmail } from "../utils/validators.js";

const OTP_EXPIRY_MS = 5 * 60 * 1000;
const RESEND_COOLDOWN_MS = 30 * 1000;
const MAX_VERIFY_ATTEMPTS = 5;

const generateOtp = () => `${Math.floor(100000 + Math.random() * 900000)}`;

export const createAndStoreOtp = async (email) => {
  const normalizedEmail = normalizeEmail(email);
  const now = new Date();

  const existingOtp = await OtpCode.findOne({ email: normalizedEmail }).sort({ createdAt: -1 });

  if (existingOtp) {
    const retryInMs = RESEND_COOLDOWN_MS - (now.getTime() - existingOtp.lastSentAt.getTime());
    if (retryInMs > 0) {
      throw new ApiError(429, `Please wait ${Math.ceil(retryInMs / 1000)} seconds before requesting another OTP`);
    }
  }

  const otp = generateOtp();
  const otpHash = await bcrypt.hash(otp, 10);
  const expiresAt = new Date(now.getTime() + OTP_EXPIRY_MS);

  if (existingOtp) {
    existingOtp.otpHash = otpHash;
    existingOtp.attempts = 0;
    existingOtp.lastSentAt = now;
    existingOtp.expiresAt = expiresAt;
    await existingOtp.save();
  } else {
    await OtpCode.create({
      email: normalizedEmail,
      otpHash,
      attempts: 0,
      lastSentAt: now,
      expiresAt
    });
  }

  return {
    otp,
    expiresAt
  };
};

export const verifyStoredOtp = async (email, otp) => {
  const normalizedEmail = normalizeEmail(email);
  const now = new Date();

  const otpDoc = await OtpCode.findOne({ email: normalizedEmail }).sort({ createdAt: -1 });

  if (!otpDoc) {
    throw new ApiError(400, "OTP not found. Request a new OTP");
  }

  if (otpDoc.expiresAt.getTime() < now.getTime()) {
    await OtpCode.deleteOne({ _id: otpDoc._id });
    throw new ApiError(400, "OTP expired. Request a new OTP");
  }

  if (otpDoc.attempts >= MAX_VERIFY_ATTEMPTS) {
    await OtpCode.deleteOne({ _id: otpDoc._id });
    throw new ApiError(429, "Maximum verification attempts exceeded. Request a new OTP");
  }

  const isMatch = await bcrypt.compare(String(otp), otpDoc.otpHash);

  if (!isMatch) {
    otpDoc.attempts += 1;

    if (otpDoc.attempts >= MAX_VERIFY_ATTEMPTS) {
      await OtpCode.deleteOne({ _id: otpDoc._id });
      throw new ApiError(429, "Maximum verification attempts exceeded. Request a new OTP");
    }

    await otpDoc.save();
    throw new ApiError(400, `Invalid OTP. ${MAX_VERIFY_ATTEMPTS - otpDoc.attempts} attempts left`);
  }

  await OtpCode.deleteOne({ _id: otpDoc._id });
  return true;
};
