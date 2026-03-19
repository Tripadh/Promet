import mongoose from "mongoose";

const otpCodeSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true
    },
    otpHash: {
      type: String,
      required: true
    },
    attempts: {
      type: Number,
      default: 0
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true
    },
    lastSentAt: {
      type: Date,
      required: true
    }
  },
  {
    timestamps: true
  }
);

// TTL index removes expired OTP documents automatically.
otpCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const OtpCode = mongoose.model("OtpCode", otpCodeSchema);

export default OtpCode;
