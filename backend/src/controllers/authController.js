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
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

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

const verifyCaptchaToken = async (captchaToken) => {
    if (!isCaptchaRequired()) {
        return true;
    }

    const bypassToken = process.env.CAPTCHA_BYPASS_TOKEN;
    if (bypassToken && captchaToken === bypassToken) {
        return true;
    }

    const secret = process.env.RECAPTCHA_SECRET_KEY;
    const GOOGLE_TEST_SECRET = process.env.RECAPTCHA_TEST_SECRET;

    if (!secret || !captchaToken) {
        return false;
    }

    if (GOOGLE_TEST_SECRET && secret === GOOGLE_TEST_SECRET && process.env.NODE_ENV !== "production") {
        return true;
    }

    try {
        const response = await fetch("https://www.google.com/recaptcha/api/siteverify", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: new URLSearchParams({
                secret,
                response: captchaToken
            })
        });

        const result = await response.json();
        return Boolean(result?.success);
    } catch (error) {
        // In local development with Google's official test secret, allow non-empty token
        // so registration can proceed even if the verify endpoint is unreachable.
        if (GOOGLE_TEST_SECRET && secret === GOOGLE_TEST_SECRET && process.env.NODE_ENV !== "production") {
            return Boolean(captchaToken);
        }
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

        const captchaValid = await verifyCaptchaToken(captchaToken);
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

/* ================= GOOGLE LOGIN ================= */

export const googleLogin = async (req, res) => {
    try {
        const { idToken } = req.body;

        // Verify the token with Google
        const ticket = await client.verifyIdToken({
            idToken,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        const { email, name, sub: googleId } = payload;

        const emailDomain = getEmailDomain(email);
        const blockedDomains = getBlockedDomains();
        if (blockedDomains.has(emailDomain)) {
            return res.status(400).json({ message: "Email domain is not allowed" });
        }

        // Check if user exists in our DB
        let user = await User.findOne({ email });

        if (!user) {
            // If they don't exist, create a new user account without a password
            user = await User.create({
                name,
                email,
                googleId,
                emailVerified: true,
                // We won't set a password for Google accounts, so your DB schema might need 
                // password to be optional, or give them a random dummy password.
            });
        }

        // Generate standard JWT token for your app
        const token = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        await createLoginLog(req, user, "google");

        res.json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        });

    } catch (error) {
        console.error("Google verify error:", error);
        res.status(400).json({ message: "Invalid Google Token" });
    }
};
