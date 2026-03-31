import mongoose from "mongoose";

const monthlyUsageSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    monthKey: {
      type: String,
      required: true,
      index: true,
    },
    byMode: {
      quick: { type: Number, default: 0 },
      balanced: { type: Number, default: 0 },
      auto: { type: Number, default: 0 },
      expert: { type: Number, default: 0 },
      chat: { type: Number, default: 0 },
    },
    totalPrompts: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

monthlyUsageSchema.index({ user: 1, monthKey: 1 }, { unique: true });

export default mongoose.model("MonthlyUsage", monthlyUsageSchema);
