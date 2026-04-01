import { improvePromptWithAI, improvePromptWithAIStream, normalizeMode, generateChatTitle, detectIntent, chatWithAIStream } from "../services/aiService.js";
import { analyzePrompt as analyzeUserPrompt } from "../services/promptAnalyzer.js";
import Prompt from "../models/Prompt.js";
import MonthlyUsage from "../models/MonthlyUsage.js";
import ConversationShare from "../models/ConversationShare.js";
import { langfuse } from "../utils/langfuseClient.js";
import { randomBytes } from "crypto";

/* ================= IMPROVE PROMPT (WITH STREAMING) ================= */

export const improvePrompt = async (req, res) => {
  try {
    const { prompt, mode = "balanced", isRetry = false, conversationId, domain = null, intentMode = "auto" } = req.body;
    const selectedMode = normalizeMode(mode);
    const MAX_PROMPTS_PER_CONVERSATION = 5;
    const conversationKey = typeof conversationId === "string" && conversationId.trim()
      ? conversationId.trim()
      : undefined;

    if (!prompt) {
      return res.status(400).json({
        message: "Prompt is required",
      });
    }

    if (conversationKey) {
      const existingCount = await Prompt.countDocuments({
        user: req.user.id,
        conversationId: conversationKey,
      });

      if (existingCount >= MAX_PROMPTS_PER_CONVERSATION) {
        return res.status(400).json({
          message: `This chat reached the ${MAX_PROMPTS_PER_CONVERSATION}-prompt limit. Start a new chat to continue.`,
          code: "CONVERSATION_LIMIT_REACHED",
          limit: MAX_PROMPTS_PER_CONVERSATION,
        });
      }
    }

    // Fetch the previous prompt if there's an ongoing conversation, to maintain memory
    let previousPromptText = null;
    if (conversationKey && !isRetry) {
      const lastPrompt = await Prompt.findOne({
        user: req.user.id,
        conversationId: conversationKey,
      }).sort({ createdAt: -1 });

      if (lastPrompt && lastPrompt.improvedPrompt) {
        previousPromptText = lastPrompt.improvedPrompt;
      }
    }

    // Analyze prompt before improvement
    const promptAnalysis = analyzeUserPrompt(prompt);

    /* ================= LANGFUSE TRACE ================= */
    const trace = langfuse.trace({
      name: "improve_prompt",
      userId: req.user.id,
      input: prompt,
      metadata: {
        mode: selectedMode,
        isRetry: isRetry,
        conversationId: conversationKey
      }
    });

    /* ================= SSE HEADERS ================= */

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");

    res.flushHeaders();

    // Use actual streaming from AI for fast, letter-by-letter display
    let finalImprovedPrompt = "";
    
    // DETECT INTENT
    const intent = detectIntent(prompt, intentMode);

    // Improve Mode Quota Check
    if (intent === "improve") {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);

      const dailyImproveCount = await Prompt.countDocuments({
        user: req.user.id,
        mode: { $ne: "chat" }, // Only count actual improvements
        createdAt: { $gte: startOfDay, $lte: endOfDay }
      });

      if (dailyImproveCount >= 25) {
        return res.status(429).json({
          message: "You have reached your daily limit of 25 improvements. Chat remains unlimited!",
          code: "DAILY_LIMIT_REACHED",
          limit: 25,
        });
      }
    }

    let streamResult;

    if (intent === "chat") {
      finalImprovedPrompt = await chatWithAIStream(
        prompt,
        (textChunk) => {
          res.write(`data: ${JSON.stringify({ text: textChunk })}\n\n`);
        }
      );
    } else {
      streamResult = await improvePromptWithAIStream(
        prompt,
        selectedMode,
        isRetry,
        (textChunk) => {
          finalImprovedPrompt += textChunk;
          res.write(`data: ${JSON.stringify({ text: textChunk })}\n\n`);
        },
        { memory: previousPromptText },
        domain
      );

      if (streamResult && streamResult.needsClarification) {
        // If needs clarification, it already streamed out via the callback.
        // We just need to end it properly with the done signal.
        res.write(`data: ${JSON.stringify({ done: true, analysis: promptAnalysis })}\n\n`);
        res.end();
        return;
      }
    }

    // Format the final improved prompt with sections if needed,
    // though streaming means we can't easily prepend headers AFTER it's streamed.

    /* ================= SAVE HISTORY ================= */
    
    trace.update({
      output: finalImprovedPrompt
    });

    let chatTitle = null;
    if (!conversationKey) {
      chatTitle = await generateChatTitle(prompt);
    }

    const newPrompt = await Prompt.create({
      user: req.user.id,
      originalPrompt: prompt,
      improvedPrompt: finalImprovedPrompt,
      mode: intent === "chat" ? "chat" : selectedMode,
      conversationId: conversationKey,
      title: chatTitle,
      langfuseTraceId: trace.id,
      createdAt: new Date(),
    });

    const now = new Date();
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    await MonthlyUsage.findOneAndUpdate(
      { user: req.user.id, monthKey },
      {
        $inc: {
          totalPrompts: 1, // Still track total interactions
          [`byMode.${intent === "chat" ? "chat" : selectedMode}`]: 1,
        },
      },
      {
        upsert: true,
        new: true,
      }
    );

    langfuse.flushAsync();

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
          title: { $max: "$title" },
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
      title: item.title,
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

/* ================= GET MONTHLY USAGE SUMMARY ================= */

export const getMonthlyUsageSummary = async (req, res) => {
  try {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    const persisted = await MonthlyUsage.findOne({
      user: req.user._id,
      monthKey,
    }).lean();

    const byMode = {
      quick: 0,
      balanced: 0,
      auto: 0,
      expert: 0,
      chat: 0,
    };

    let totalPrompts = 0;

    if (persisted) {
      byMode.quick = Number(persisted.byMode?.quick || 0);
      byMode.balanced = Number(persisted.byMode?.balanced || 0);
      byMode.auto = Number(persisted.byMode?.auto || 0);
      byMode.expert = Number(persisted.byMode?.expert || 0);
      byMode.chat = Number(persisted.byMode?.chat || 0);
      totalPrompts = Number(persisted.totalPrompts || 0);
    } else {
      // Backfill from existing prompt docs — run in background so it doesn't block this response
      setImmediate(async () => {
        try {
          const usage = await Prompt.aggregate([
            {
              $match: {
                user: req.user._id,
                createdAt: { $gte: monthStart, $lte: now },
              },
            },
            {
              $group: {
                _id: "$mode",
                count: { $sum: 1 },
              },
            },
          ]);

          const backfillByMode = { quick: 0, balanced: 0, auto: 0, expert: 0, chat: 0 };
          let backfillTotal = 0;

          for (const item of usage) {
            const modeKey = String(item._id || "").toLowerCase();
            const count = Number(item.count || 0);
            backfillTotal += count;
            if (Object.prototype.hasOwnProperty.call(backfillByMode, modeKey)) {
              backfillByMode[modeKey] = count;
            }
          }

          if (backfillTotal > 0) {
            await MonthlyUsage.findOneAndUpdate(
              { user: req.user._id, monthKey },
              { $set: { byMode: backfillByMode, totalPrompts: backfillTotal } },
              { upsert: true, new: true }
            );
          }
        } catch (backfillErr) {
          console.error("MonthlyUsage backfill error:", backfillErr);
        }
      });
    }

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const dailyCount = await Prompt.countDocuments({
      user: req.user._id,
      mode: { $ne: "chat" }, // Only improvements count against the daily limit
      createdAt: { $gte: startOfDay, $lte: endOfDay }
    });

    return res.status(200).json({
      month: monthStart.toISOString(),
      byMode,
      totalPrompts,
      dailyCount,
    });
  } catch (error) {
    console.error("Monthly usage summary error:", error);
    return res.status(500).json({
      message: "Failed to fetch monthly usage summary",
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

/* ================= SUBMIT FEEDBACK ================= */

export const submitPromptFeedback = async (req, res) => {
  try {
    const { id } = req.params;
    const { value, tags = [], details = "" } = req.body; // value: 1 or -1

    const prompt = await Prompt.findOne({ _id: id, user: req.user.id });
    if (!prompt) {
      return res.status(404).json({ message: "Prompt not found" });
    }

    if (prompt.langfuseTraceId) {
      let commentText = value === 1 ? "User liked the prompt" : "User disliked the prompt";
      
      if (tags.length > 0) {
        commentText += `\nTags: ${tags.join(", ")}`;
      }
      if (details) {
        commentText += `\nDetails: ${details}`;
      }

      langfuse.score({
        traceId: prompt.langfuseTraceId,
        name: "user_feedback",
        value: value,
        comment: commentText,
      });
      // Optionally await flush to ensure the score is out
      await langfuse.flushAsync();
    }

    prompt.feedback = value;
    await prompt.save();

    res.status(200).json({ message: "Feedback submitted successfully", feedback: prompt.feedback });
  } catch (error) {
    console.error("Feedback error:", error);
    res.status(500).json({ message: "Failed to submit feedback" });
  }
};


/* ================= DELETE ALL PROMPTS ================= */

export const deleteAllPrompts = async (req, res) => {
  try {
    const result = await Prompt.deleteMany({ user: req.user.id });

    res.status(200).json({
      message: "All prompts deleted successfully",
      deletedCount: result.deletedCount
    });

  } catch (error) {
    console.error("Delete all prompts error:", error);

    res.status(500).json({
      message: "Failed to delete all prompts",
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
          title: { $max: "$title" },
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
      title: item.title,
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
          title: { $max: "$title" },
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
      title: item.title,
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

/* ================= GET CONVERSATION PROMPTS ================= */

export const getConversationPrompts = async (req, res) => {
  try {
    const { conversationId } = req.params;

    if (!conversationId) {
      return res.status(400).json({
        message: "Conversation id is required",
      });
    }

    const prompts = await Prompt.find({
      user: req.user.id,
      conversationId,
    })
      .sort({ createdAt: 1 })
      .select("_id conversationId originalPrompt improvedPrompt mode pinned favorite createdAt updatedAt");

    return res.status(200).json({
      conversationId,
      prompts,
    });
  } catch (error) {
    console.error("Fetch conversation prompts error:", error);

    return res.status(500).json({
      message: "Failed to fetch conversation prompts",
    });
  }
};

/* ================= CREATE CONVERSATION SHARE ================= */

export const createConversationShare = async (req, res) => {
  try {
    const { conversationId, promptId } = req.body;

    if (!conversationId || typeof conversationId !== "string") {
      return res.status(400).json({
        message: "conversationId is required",
      });
    }

    let prompts = [];
    if (promptId) {
      // Share only a specific prompt
      const prompt = await Prompt.findOne({
        _id: promptId,
        user: req.user.id,
        conversationId: conversationId.trim(),
      }).select("originalPrompt improvedPrompt mode createdAt");

      if (!prompt) {
        return res.status(404).json({
          message: "Prompt not found or unauthorized",
        });
      }
      prompts = [prompt];
    } else {
      // Fallback: Share entire conversation
      prompts = await Prompt.find({
        user: req.user.id,
        conversationId: conversationId.trim(),
      })
        .sort({ createdAt: 1 })
        .select("originalPrompt improvedPrompt mode createdAt");
    }

    if (!prompts.length) {
      return res.status(404).json({
        message: "No prompts found to share",
      });
    }

    const shareId = randomBytes(9).toString("base64url");
    const firstPrompt = prompts[0]?.originalPrompt || "Shared chat";
    const title = firstPrompt.length > 80 ? `${firstPrompt.slice(0, 77)}...` : firstPrompt;

    const share = await ConversationShare.create({
      owner: req.user.id,
      shareId,
      conversationId: conversationId.trim(),
      title,
      prompts: prompts.map((item) => ({
        originalPrompt: item.originalPrompt,
        improvedPrompt: item.improvedPrompt,
        mode: item.mode,
        createdAt: item.createdAt,
      })),
    });

    return res.status(201).json({
      shareId: share.shareId,
      title: share.title,
      createdAt: share.createdAt,
    });
  } catch (error) {
    console.error("Create conversation share error:", error);
    return res.status(500).json({
      message: "Failed to create share link",
    });
  }
};

/* ================= GET SHARED CONVERSATION ================= */

export const getSharedConversation = async (req, res) => {
  try {
    const { shareId } = req.params;

    const share = await ConversationShare.findOne({ shareId }).lean();

    if (!share) {
      return res.status(404).json({
        message: "Shared conversation not found",
      });
    }

    return res.status(200).json({
      shareId: share.shareId,
      title: share.title,
      prompts: share.prompts || [],
      createdAt: share.createdAt,
    });
  } catch (error) {
    console.error("Get shared conversation error:", error);
    return res.status(500).json({
      message: "Failed to fetch shared conversation",
    });
  }
};