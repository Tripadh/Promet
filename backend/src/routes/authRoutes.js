import express from "express";
import {
	registerUser,
	loginUser,
	getCurrentUser,
	googleLogin,
	forgotPassword,
	resetPassword
} from "../controllers/authController.js";
import { sendOtp, verifyOtp } from "../controllers/otpAuthController.js";
import protect from "../middleware/authMiddleware.js";
import { otpRequestLimiter } from "../middleware/otpRateLimiter.js";
import { verifyCaptchaPlaceholder } from "../middleware/captchaMiddleware.js";

const router = express.Router();

/* ================= AUTH ROUTES ================= */

router.post("/send-otp", otpRequestLimiter, verifyCaptchaPlaceholder, sendOtp);
router.post("/verify-otp", verifyOtp);

router.post("/register", registerUser);

router.post("/login", loginUser);

// Password reset endpoints
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

export default router;