import "dotenv/config";
import express from "express";
import cors from "cors";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import promptRoutes from "./routes/promptRoutes.js";

const app = express();

/* DATABASE */

connectDB();

/* MIDDLEWARE */

app.use(cors());
app.use(express.json());

/* TEST ROUTE */

app.get("/", (req, res) => {
  res.json({ message: "AI Prompt Improver API Running" });
});

/* ROUTES */

app.use("/api/auth", authRoutes);
app.use("/api/prompts", promptRoutes);

/* SERVER */

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});