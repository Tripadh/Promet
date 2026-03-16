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
            enum: ["quick", "balanced", "expert", "auto"],
            default: "balanced",
        },
    },
    {
        timestamps: true, // automatically creates createdAt and updatedAt
    }
);

export default mongoose.model("Prompt", promptSchema);