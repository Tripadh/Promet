import "dotenv/config";
import express from "express";
import cors from "cors";
import connectDB from "./config/db.js";
import passport from "./config/passport.js";
import authRoutes from "./routes/authRoutes.js";
import promptRoutes from "./routes/promptRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import { globalErrorHandler, notFoundHandler } from "./utils/errorHandlers.js";

const app = express();

/* DATABASE */
connectDB();

/* MIDDLEWARE */

// FIXED: Proper CORS setup for both dev + production
const allowedOrigins = [
  "http://localhost:5173",        // local dev
  "https://promet.indevs.in"     // deployed frontend
];

app.set("trust proxy", true);

app.use(
  cors({
    origin: function (origin, callback) {
      // FIX: allow requests with no origin (like Postman, mobile apps)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.log("❌ Blocked by CORS:", origin); // DEBUG LOG
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

// FIX: handle preflight requests explicitly
app.options("*", cors());

app.use(express.json());
app.use(passport.initialize());

/* TEST ROUTE */
app.get("/", (req, res) => {
  res.json({ message: "AI Prompt Improver API Running 🚀" });
});

/* ROUTES */
app.use("/api/auth", authRoutes);
app.use("/api/prompts", promptRoutes);
app.use("/api/admin", adminRoutes);

/* ERROR HANDLING */
app.use(notFoundHandler);
app.use(globalErrorHandler);

/* SERVER */
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🔥 Server running on port ${PORT}`);
});