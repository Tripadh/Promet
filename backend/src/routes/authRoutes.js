import express from "express";
import {
	registerUser,
	loginUser,
	getCurrentUser,
	githubCallback,
	forgotPassword,
	resetPassword,
	sendDeleteAccountOtp,
	deleteAccount
} from "../controllers/authController.js";
import { sendOtp, verifyOtp } from "../controllers/otpAuthController.js";
import { verifyCaptchaMiddleware } from "../middleware/captchaMiddleware.js";
import protect from "../middleware/authMiddleware.js";
import { otpRequestLimiter } from "../middleware/rateLimiter.js";
import passport from "passport";

const router = express.Router();

/* ================= AUTH ROUTES ================= */

router.post("/send-otp", otpRequestLimiter, verifyCaptchaMiddleware, sendOtp);
router.post("/verify-otp", verifyOtp);

router.post("/register", verifyCaptchaMiddleware, registerUser);

router.post("/login", loginUser);

router.get("/github", passport.authenticate("github", { scope: ["user:email"] }));

router.get(
  "/github/callback",
  passport.authenticate("github", { 
    session: false, 
    failureRedirect: `${(process.env.CLIENT_URL || process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/$/, "")}/login?error=github_failed` 
  }),

  githubCallback
);

router.get("/me", protect, getCurrentUser);
// Password reset endpoints
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

// Delete account endpoints
router.post("/delete-account/send-otp", protect, sendDeleteAccountOtp);
router.delete("/delete-account", protect, deleteAccount);

export default router;