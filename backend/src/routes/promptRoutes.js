import express from "express";
import { improvePrompt, analyzePrompt, getPromptHistory, getConversationPrompts, getMonthlyUsageSummary, createConversationShare, getSharedConversation, deletePrompt, deleteAllPrompts, toggleFavorite, togglePin, getPinnedPrompts, getFavoritePrompts, submitPromptFeedback } from "../controllers/promptController.js";
import protect from "../middleware/authMiddleware.js";
import { promptRateLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();

/* ================= PROMPT ROUTES ================= */

router.post("/improve", promptRateLimiter, protect, improvePrompt);
router.post("/analyze", promptRateLimiter, protect, analyzePrompt);
router.post("/share", protect, createConversationShare);
router.get("/shared/:shareId", getSharedConversation);

// NEW: Get prompt history
router.get("/history", protect, getPromptHistory);
router.get("/history/conversation/:conversationId", protect, getConversationPrompts);
router.get("/usage/summary", protect, getMonthlyUsageSummary);

// NEW: Get pinned/favorites for sidebar
router.get("/pinned", protect, getPinnedPrompts);
router.get("/favorites", protect, getFavoritePrompts);

// NEW: Delete specific prompt
router.delete("/history/:id", protect, deletePrompt);

// NEW: Delete all prompts
router.delete("/history", protect, deleteAllPrompts);

// NEW: Toggle favorite/pin
router.patch("/:id/favorite", protect, toggleFavorite);
router.patch("/:id/pin", protect, togglePin);

// NEW: Submit prompt feedback
router.post("/:id/feedback", protect, submitPromptFeedback);

export default router;