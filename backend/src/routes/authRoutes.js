import express from "express";
import { registerUser, loginUser, getCurrentUser, googleLogin } from "../controllers/authController.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

/* ================= AUTH ROUTES ================= */

router.post("/register", registerUser);

router.post("/login", loginUser);
router.post("/google-login", googleLogin);
router.get("/me", protect, getCurrentUser);

export default router;