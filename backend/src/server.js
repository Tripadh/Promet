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
app.use(cors({
  origin: process.env.CLIENT_URL, // FIX: restrict frontend access
  credentials: true
}));
app.use(express.json());
app.use(passport.initialize());

/* TEST ROUTE */

app.get("/", (req, res) => {
  res.json({ message: "AI Prompt Improver API Running" });
});

/* ROUTES */

app.use("/api/auth", authRoutes);
app.use("/api/prompts", promptRoutes);
app.use("/api/admin", adminRoutes);

app.use(notFoundHandler);
app.use(globalErrorHandler);

/* SERVER */

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});