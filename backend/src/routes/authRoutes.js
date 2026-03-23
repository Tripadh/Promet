import express from "express";
import {
	registerUser,
	loginUser,
	getCurrentUser,
	githubCallback,
	forgotPassword,
	resetPassword
} from "../controllers/authController.js";
import { sendOtp, verifyOtp } from "../controllers/otpAuthController.js";
import protect from "../middleware/authMiddleware.js";
import { otpRequestLimiter } from "../middleware/otpRateLimiter.js";
import { verifyCaptchaPlaceholder } from "../middleware/captchaMiddleware.js";
import passport from "passport";

const router = express.Router();

/* ================= AUTH ROUTES ================= */

router.post("/send-otp", otpRequestLimiter, verifyCaptchaPlaceholder, sendOtp);
router.post("/verify-otp", verifyOtp);

router.post("/register", registerUser);

router.post("/login", loginUser);

router.get("/github", passport.authenticate("github", { scope: ["user:email"] }));

router.get(
  "/github/callback",
  passport.authenticate("github", { session: false, failureRedirect: "http://localhost:5173/login?error=github_failed" }),
  githubCallback
);

router.get("/me", protect, getCurrentUser);
// Password reset endpoints
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

export default router;