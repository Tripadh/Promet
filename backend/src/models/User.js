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
            required: true
        }
    },
    {
        timestamps: true
    }
);

/* ================= MODEL ================= */

const User = mongoose.model("User", userSchema);

export default User;