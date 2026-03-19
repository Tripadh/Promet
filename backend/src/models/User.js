import mongoose from "mongoose";

/* ================= USER SCHEMA ================= */

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true
        },

        email: {
            type: String,
            required: true,
            unique: true
        },

        password: {
            type: String,
            required: false // Made optional for Google Auth users
        },

        googleId: {
            type: String,
            required: false
        },

        emailVerified: {
            type: Boolean,
            default: false
        },

        emailVerificationOtpHash: {
            type: String,
            required: false
        },

        emailVerificationOtpExpires: {
            type: Date,
            required: false
        }
    },
    {
        timestamps: true
    }
);

/* ================= MODEL ================= */

const User = mongoose.model("User", userSchema);

export default User;