import { createAndStoreOtp, verifyStoredOtp } from "../services/otpService.js";
import { sendOtpEmail } from "../services/emailService.js";
// ================= FORGOT PASSWORD =================
export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }
        const user = await User.findOne({ email: email.toLowerCase().trim() });
        if (!user) {
            return res.status(400).json({ message: "No user found with this email" });
        }
        // Generate OTP and send email
        const { otp, expiresAt } = await createAndStoreOtp(email);
        await sendOtpEmail(email, otp);
        return res.status(200).json({ message: "OTP sent to email", expiresAt });
    } catch (error) {
        return res.status(500).json({ message: "Server error" });
    }
};

// ================= RESET PASSWORD =================
export const resetPassword = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;
        if (!email || !otp || !newPassword) {
            return res.status(400).json({ message: "Email, OTP, and new password are required" });
        }
        // Verify OTP
        await verifyStoredOtp(email, otp);
        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        // Update user password
        await User.updateOne(
            { email: email.toLowerCase().trim() },
            { $set: { password: hashedPassword } }
        );
        return res.status(200).json({ message: "Password reset successful" });
    } catch (error) {
        return res.status(400).json({ message: error.message || "Server error" });
    }
};
import User from "../models/User.js";
import LoginLog from "../models/LoginLog.js";
import Prompt from "../models/Prompt.js";
import MonthlyUsage from "../models/MonthlyUsage.js";
import ConversationShare from "../models/ConversationShare.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const DEFAULT_BLOCKED_DOMAINS = [
    "example.com",
    "mailinator.com",
    "tempmail.com",
    "10minutemail.com",
    "guerrillamail.com",
    "yopmail.com"
];

const parseCsvSet = (value) => new Set(
    (value || "")
        .split(",")
        .map((item) => item.trim().toLowerCase())
        .filter(Boolean)
);

const getBlockedDomains = () => {
    const fromEnv = parseCsvSet(process.env.BLOCKED_EMAIL_DOMAINS);
    return new Set([...DEFAULT_BLOCKED_DOMAINS, ...fromEnv]);
};

const getEmailDomain = (email) => {
    if (!email || !email.includes("@")) return "";
    return email.split("@")[1].toLowerCase().trim();
};

const isCaptchaRequired = () => process.env.CAPTCHA_REQUIRED === "true";

const verifyCaptchaToken = async (captchaToken, req) => {
    if (!isCaptchaRequired()) {
        return true;
    }

    const bypassToken = process.env.CAPTCHA_BYPASS_TOKEN;
    if (bypassToken && captchaToken === bypassToken) {
        return true;
    }

    const secret = process.env.TURNSTILE_SECRET_KEY || '1x0000000000000000000000000000000AA';

    if (!secret || !captchaToken) {
        return false;
    }

    try {
        const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: new URLSearchParams({
                secret,
                response: captchaToken,
                remoteip: extractIpAddress(req)
            })
        });

        const result = await response.json();
        return Boolean(result?.success);
    } catch (error) {
        return false;
    }
};

const extractIpAddress = (req) => {
    const forwarded = req.headers["x-forwarded-for"];
    if (Array.isArray(forwarded)) {
        return forwarded[0];
    }
    if (typeof forwarded === "string") {
        return forwarded.split(",")[0].trim();
    }
    return req.ip;
};

const createLoginLog = async (req, user, method) => {
    try {
        await LoginLog.create({
            userId: user?._id,
            name: user?.name,
            email: user?.email,
            method,
            ipAddress: extractIpAddress(req),
            userAgent: req.headers["user-agent"] || ""
        });
    } catch (error) {
        // Login should not fail if log write fails.
    }
};

/* ================= REGISTER USER ================= */

export const registerUser = async (req, res) => {
    try {

        const { name, email, password, captchaToken } = req.body;

        const normalizedEmail = email?.toLowerCase().trim();

        const emailDomain = getEmailDomain(normalizedEmail);
        const blockedDomains = getBlockedDomains();

        if (blockedDomains.has(emailDomain)) {
            return res.status(400).json({
                message: "Email domain is not allowed"
            });
        }

        const captchaValid = await verifyCaptchaToken(captchaToken, req);
        if (!captchaValid) {
            return res.status(400).json({
                message: "CAPTCHA validation failed"
            });
        }

        // Check if user exists
        const existingUser = await User.findOne({ email: normalizedEmail });

        if (existingUser) {
            return res.status(400).json({
                message: "User already exists"
            });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user
        const user = await User.create({
            name,
            email: normalizedEmail,
            password: hashedPassword,
            emailVerified: true
        });

        res.status(201).json({
            message: "User registered successfully",
            userId: user._id,
            requiresVerification: false
        });

    } catch (error) {

        res.status(500).json({
            message: "Server error"
        });

    }
};

/* ================= LOGIN USER ================= */

export const loginUser = async (req, res) => {

    try {

        const { email, password } = req.body;

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({
                message: "Invalid credentials"
            });
        }

        // Compare password
        const isMatch = user.password ? await bcrypt.compare(password, user.password) : false;

        if (!isMatch) {
            return res.status(400).json({
                message: "Invalid credentials"
            });
        }

        // Generate JWT
        const token = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        await createLoginLog(req, user, "password");

        res.json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        });

    } catch (error) {

        res.status(500).json({
            message: "Server error"
        });

    }
};

/* ================= GET CURRENT USER ================= */

export const getCurrentUser = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                message: "Not authorized"
            });
        }

        return res.status(200).json({
            user: {
                id: req.user._id,
                name: req.user.name,
                email: req.user.email
            }
        });
    } catch (error) {
        return res.status(500).json({
            message: "Server error"
        });
    }
};

/* ================= GITHUB LOGIN CALLBACK ================= */

export const githubCallback = async (req, res) => {
    try {
        const user = req.user;
        
        if (!user) {
            return res.redirect("http://localhost:5173/login?error=github_auth_failed");
        }

        // Generate standard JWT token for the app
        const token = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        // Log the login event
        try {
            await createLoginLog(req, user, "github");
        } catch (logErr) {
            console.error("Login log error:", logErr);
        }

        // Redirect to the frontend success page with the token
        res.redirect(`http://localhost:5173/oauth-success?token=${token}`);
    } catch (error) {
        console.error("GitHub callback error:", error);
        res.redirect("http://localhost:5173/login?error=github_auth_failed");
    }
};

/* ================= SEND DELETE ACCOUNT OTP ================= */
export const sendDeleteAccountOtp = async (req, res) => {
    try {
        if (!req.user || !req.user.email) {
            return res.status(401).json({ message: "Not authorized" });
        }
        
        const email = req.user.email;
        const { otp, expiresAt } = await createAndStoreOtp(email);
        await sendOtpEmail(email, otp);
        
        return res.status(200).json({ message: "Verification code sent to email", expiresAt });
    } catch (error) {
        console.error("sendDeleteAccountOtp error:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

/* ================= DELETE ACCOUNT ================= */
export const deleteAccount = async (req, res) => {
    try {
        if (!req.user || !req.user.email) {
            return res.status(401).json({ message: "Not authorized" });
        }
        
        const { otp } = req.body;
        if (!otp) {
            return res.status(400).json({ message: "OTP is required" });
        }

        const email = req.user.email;
        
        // Verify OTP
        await verifyStoredOtp(email, otp);
        
        // Delete all user related data
        const userId = req.user._id;
        
        await Prompt.deleteMany({ user: userId });
        await MonthlyUsage.deleteMany({ user: userId });
        await ConversationShare.deleteMany({ owner: userId });
        await LoginLog.deleteMany({ userId: userId });
        
        // Delete the user
        await User.findByIdAndDelete(userId);
        
        return res.status(200).json({ message: "Account deleted successfully" });
    } catch (error) {
        console.error("deleteAccount error:", error);
        return res.status(400).json({ message: error.message || "Server error" });
    }
};

