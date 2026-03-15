import jwt from "jsonwebtoken";
import User from "../models/User.js";

/* ================= AUTH MIDDLEWARE ================= */

const protect = async (req, res, next) => {

    let token;

    // Check Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {

        try {

            // Extract token
            token = req.headers.authorization.split(" ")[1];

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Get user from DB (without password)
            req.user = await User.findById(decoded.id).select("-password");

            next();

        } catch (error) {

            return res.status(401).json({
                message: "Not authorized, token failed"
            });

        }

    }

    if (!token) {
        return res.status(401).json({
            message: "Not authorized, no token"
        });
    }

};

export default protect;