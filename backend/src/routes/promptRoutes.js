import express from "express";
import { improvePrompt, analyzePrompt, getPromptHistory, getConversationPrompts, deletePrompt, toggleFavorite, togglePin, getPinnedPrompts, getFavoritePrompts } from "../controllers/promptController.js";
import protect from "../middleware/authMiddleware.js";
import { promptRateLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();

/* ================= PROMPT ROUTES ================= */

router.post("/improve", promptRateLimiter, protect, improvePrompt);
router.post("/analyze", promptRateLimiter, protect, analyzePrompt);

// NEW: Get prompt history
router.get("/history", protect, getPromptHistory);
router.get("/history/conversation/:conversationId", protect, getConversationPrompts);

// NEW: Get pinned/favorites for sidebar
router.get("/pinned", protect, getPinnedPrompts);
router.get("/favorites", protect, getFavoritePrompts);

// NEW: Delete specific prompt
router.delete("/history/:id", protect, deletePrompt);

// NEW: Toggle favorite/pin
router.patch("/:id/favorite", protect, toggleFavorite);
router.patch("/:id/pin", protect, togglePin);

export default router;