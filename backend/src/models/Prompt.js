import mongoose from "mongoose";

const promptSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        originalPrompt: {
            type: String,
            required: true,
            trim: true,
        },

        improvedPrompt: {
            type: String,
            required: true,
            trim: true,
        },

        title: {
            type: String,
            default: null,
            trim: true,
        },

        conversationId: {
            type: String,
            default: () => new mongoose.Types.ObjectId().toString(),
            index: true,
        },

        favorite: {
            type: Boolean,
            default: false,
        },

        pinned: {
            type: Boolean,
            default: false,
        },

        mode: {
            type: String,
            enum: ["quick", "balanced", "expert", "auto", "chat"],
            default: "balanced",
        },

        langfuseTraceId: {
            type: String,
        },
        
        feedback: {
            type: Number,
            enum: [1, -1, null],
            default: null,
        },
    },
    {
        timestamps: true, // automatically creates createdAt and updatedAt
    }
);

// Compound indexes to speed up the most common queries:
// 1. Sidebar history — sort by user + time
promptSchema.index({ user: 1, createdAt: -1 });
// 2. Daily/monthly quota count — filter by user + mode + date range
promptSchema.index({ user: 1, mode: 1, createdAt: -1 });
// 3. Pinned sidebar section
promptSchema.index({ user: 1, pinned: 1, createdAt: -1 });
// 4. Favorites sidebar section
promptSchema.index({ user: 1, favorite: 1, createdAt: -1 });
// 5. Conversation thread lookup
promptSchema.index({ user: 1, conversationId: 1, createdAt: 1 });

export default mongoose.model("Prompt", promptSchema);