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

            // Support token payload with either user id or email.
            if (decoded.id) {
                req.user = await User.findById(decoded.id).select("-password");
            } else if (decoded.email) {
                req.user = await User.findOne({ email: decoded.email }).select("-password");
            }

            if (!req.user) {
                return res.status(401).json({
                    message: "Not authorized, user not found"
                });
            }

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