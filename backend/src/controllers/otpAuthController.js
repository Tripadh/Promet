import User from "../models/User.js";
import { sendOtpEmail } from "../services/emailService.js";
import { createAndStoreOtp, verifyStoredOtp } from "../services/otpService.js";
import { generateAuthToken } from "../services/tokenService.js";
import { ApiError, asyncHandler, sendSuccess } from "../utils/apiResponse.js";
import { isValidEmail, isValidOtp, normalizeEmail } from "../utils/validators.js";

export const sendOtp = asyncHandler(async (req, res) => {
  const email = normalizeEmail(req.body?.email);

  if (!email) {
    throw new ApiError(400, "Email is required");
  }

  if (!isValidEmail(email)) {
    throw new ApiError(400, "Invalid email format");
  }

  const { otp } = await createAndStoreOtp(email);
  await sendOtpEmail(email, otp);

  return sendSuccess(res, {
    statusCode: 200,
    message: "OTP sent successfully",
    data: { email }
  });
});

export const verifyOtp = asyncHandler(async (req, res) => {
  const email = normalizeEmail(req.body?.email);
  const otp = String(req.body?.otp || "").trim();

  if (!email || !otp) {
    throw new ApiError(400, "Email and OTP are required");
  }

  if (!isValidEmail(email)) {
    throw new ApiError(400, "Invalid email format");
  }

  if (!isValidOtp(otp)) {
    throw new ApiError(400, "OTP must be a 6-digit number");
  }

  await verifyStoredOtp(email, otp);

  let user = await User.findOne({ email });
  if (!user) {
    const derivedName = email.split("@")[0];
    user = await User.create({
      name: derivedName,
      email,
      emailVerified: true
    });
  }

  const token = generateAuthToken(user);

  return sendSuccess(res, {
    statusCode: 200,
    message: "OTP verified successfully",
    data: {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    }
  });
});
