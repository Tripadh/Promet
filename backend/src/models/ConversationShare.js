import mongoose from "mongoose";

const sharedPromptSchema = new mongoose.Schema(
  {
    originalPrompt: { type: String, required: true },
    improvedPrompt: { type: String, required: true },
    mode: {
      type: String,
      enum: ["quick", "balanced", "expert", "auto"],
      default: "balanced",
    },
    createdAt: { type: Date, required: true },
  },
  { _id: false }
);

const conversationShareSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    shareId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    conversationId: {
      type: String,
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
    },
    prompts: {
      type: [sharedPromptSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("ConversationShare", conversationShareSchema);
