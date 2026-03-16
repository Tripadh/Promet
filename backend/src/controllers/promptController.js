import { improvePromptWithAI, normalizeMode } from "../services/aiService.js";
import { analyzePrompt as analyzeUserPrompt } from "../services/promptAnalyzer.js";
import Prompt from "../models/Prompt.js";

/* ================= IMPROVE PROMPT ================= */

export const improvePrompt = async (req, res) => {
  try {
    const { prompt, mode = "balanced", conversationId } = req.body;
    const selectedMode = normalizeMode(mode);
    const conversationKey = typeof conversationId === "string" && conversationId.trim()
      ? conversationId.trim()
      : undefined;

    if (!prompt) {
      return res.status(400).json({
        message: "Prompt is required",
      });
    }

    // Analyze prompt before improvement
    const promptAnalysis = analyzeUserPrompt(prompt);

    // Get complete improved prompt from AI service.
    // Service assembles stream safely and validates output before returning.
    const fullImprovedPrompt = await improvePromptWithAI(prompt, selectedMode);

    /* ================= SSE HEADERS ================= */

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no"); // prevent proxy buffering

    res.flushHeaders();

    // Send output as one complete chunk to prevent partial/truncated UI updates.
    res.write(`data: ${JSON.stringify({ text: fullImprovedPrompt })}\n\n`);

    /* ================= FORMAT SAFETY ================= */

    if (!fullImprovedPrompt.includes("## Improved Prompt")) {
      fullImprovedPrompt = `## Improved Prompt

\`\`\`
${fullImprovedPrompt}
\`\`\`

## Why This Is Better

The prompt has been rewritten to improve clarity, structure, and instructions so another AI system can execute the task more effectively.`;
    }

    /* ================= SAVE HISTORY ================= */

    const newPrompt = await Prompt.create({
      user: req.user.id,
      originalPrompt: prompt,
      improvedPrompt: fullImprovedPrompt,
      mode: selectedMode,
      conversationId: conversationKey,
      createdAt: new Date(),
    });

    /* ================= END STREAM ================= */

    res.write(`data: ${JSON.stringify({ done: true, id: newPrompt._id, pinned: newPrompt.pinned, favorite: newPrompt.favorite, analysis: promptAnalysis, conversationId: newPrompt.conversationId })}\n\n`);
    res.end();

  } catch (error) {
    console.error("Prompt Error:", error);

    if (!res.headersSent) {
      return res.status(500).json({
        message: "AI prompt improvement failed",
      });
    }

    res.end();
  }
};

/* ================= GET PROMPT HISTORY ================= */

export const getPromptHistory = async (req, res) => {
  try {

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const skip = (page - 1) * limit;

    const groupedPrompts = await Prompt.aggregate([
      { $match: { user: req.user._id } },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: "$conversationId",
          latestPromptId: { $first: "$_id" },
          originalPrompt: { $first: "$originalPrompt" },
          improvedPrompt: { $first: "$improvedPrompt" },
          mode: { $first: "$mode" },
          createdAt: { $first: "$createdAt" },
          updatedAt: { $first: "$updatedAt" },
          pinned: { $max: "$pinned" },
          favorite: { $max: "$favorite" },
        },
      },
      { $sort: { pinned: -1, createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
    ]);

    const groupedCount = await Prompt.aggregate([
      { $match: { user: req.user._id } },
      { $group: { _id: "$conversationId" } },
      { $count: "total" },
    ]);

    const prompts = groupedPrompts.map((item) => ({
      _id: item.latestPromptId,
      conversationId: item._id,
      originalPrompt: item.originalPrompt,
      improvedPrompt: item.improvedPrompt,
      mode: item.mode,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      pinned: item.pinned,
      favorite: item.favorite,
    }));

    const total = groupedCount[0]?.total || 0;

    res.status(200).json({
      page,
      limit,
      totalPrompts: total,
      totalPages: Math.ceil(total / limit),
      prompts,
    });

  } catch (error) {
    console.error("Fetch history error:", error);

    res.status(500).json({
      message: "Failed to fetch prompt history",
    });
  }
};

/* ================= DELETE PROMPT ================= */

export const deletePrompt = async (req, res) => {
  try {

    const promptId = req.params.id;

    const prompt = await Prompt.findOne({
      _id: promptId,
      user: req.user.id,
    });

    if (!prompt) {
      return res.status(404).json({
        message: "Prompt not found or unauthorized",
      });
    }

    await Prompt.deleteOne({ _id: promptId });

    res.status(200).json({
      message: "Prompt deleted successfully",
    });

  } catch (error) {
    console.error("Delete prompt error:", error);

    res.status(500).json({
      message: "Failed to delete prompt",
    });
  }
};

/* ================= GET PINNED PROMPTS ================= */

export const getPinnedPrompts = async (req, res) => {
  try {
    const prompts = await Prompt.aggregate([
      { $match: { user: req.user._id, pinned: true } },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: "$conversationId",
          latestPromptId: { $first: "$_id" },
          originalPrompt: { $first: "$originalPrompt" },
          improvedPrompt: { $first: "$improvedPrompt" },
          mode: { $first: "$mode" },
          createdAt: { $first: "$createdAt" },
          updatedAt: { $first: "$updatedAt" },
          pinned: { $max: "$pinned" },
          favorite: { $max: "$favorite" },
        },
      },
      { $sort: { createdAt: -1 } },
    ]);

    const payload = prompts.map((item) => ({
      _id: item.latestPromptId,
      conversationId: item._id,
      originalPrompt: item.originalPrompt,
      improvedPrompt: item.improvedPrompt,
      mode: item.mode,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      pinned: item.pinned,
      favorite: item.favorite,
    }));
    res.status(200).json(payload);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch pinned prompts" });
  }
};

/* ================= GET FAVORITE PROMPTS ================= */

export const getFavoritePrompts = async (req, res) => {
  try {
    const prompts = await Prompt.aggregate([
      { $match: { user: req.user._id, favorite: true } },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: "$conversationId",
          latestPromptId: { $first: "$_id" },
          originalPrompt: { $first: "$originalPrompt" },
          improvedPrompt: { $first: "$improvedPrompt" },
          mode: { $first: "$mode" },
          createdAt: { $first: "$createdAt" },
          updatedAt: { $first: "$updatedAt" },
          pinned: { $max: "$pinned" },
          favorite: { $max: "$favorite" },
        },
      },
      { $sort: { createdAt: -1 } },
    ]);

    const payload = prompts.map((item) => ({
      _id: item.latestPromptId,
      conversationId: item._id,
      originalPrompt: item.originalPrompt,
      improvedPrompt: item.improvedPrompt,
      mode: item.mode,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      pinned: item.pinned,
      favorite: item.favorite,
    }));

    res.status(200).json(payload);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch favorite prompts" });
  }
};

/* ================= TOGGLE FAVORITE ================= */

export const toggleFavorite = async (req, res) => {
  try {
    const promptId = req.params.id;
    const prompt = await Prompt.findOne({ _id: promptId, user: req.user.id });

    if (!prompt) {
      return res.status(404).json({ message: "Prompt not found" });
    }

    prompt.favorite = !prompt.favorite;
    await prompt.save();

    res.status(200).json({
      message: `Prompt ${prompt.favorite ? "added to" : "removed from"} favorites`,
      favorite: prompt.favorite,
    });
  } catch (error) {
    console.error("Toggle favorite error:", error);
    res.status(500).json({ message: "Failed to toggle favorite" });
  }
};

/* ================= TOGGLE PIN ================= */

export const togglePin = async (req, res) => {
  try {
    const promptId = req.params.id;
    const prompt = await Prompt.findOne({ _id: promptId, user: req.user.id });

    if (!prompt) {
      return res.status(404).json({ message: "Prompt not found" });
    }

    prompt.pinned = !prompt.pinned;
    await prompt.save();

    res.status(200).json({
      message: `Prompt ${prompt.pinned ? "pinned" : "unpinned"}`,
      pinned: prompt.pinned,
    });
  } catch (error) {
    console.error("Toggle pin error:", error);
    res.status(500).json({ message: "Failed to toggle pin" });
  }
};

/* ================= ANALYZE PROMPT ================= */

export const analyzePrompt = async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({
        message: "Prompt is required",
      });
    }

    const analysis = analyzeUserPrompt(prompt);

    return res.status(200).json(analysis);
  } catch (error) {
    console.error("Analyze prompt error:", error);
    return res.status(500).json({
      message: "Failed to analyze prompt",
    });
  }
};