import { Langfuse } from 'langfuse';
import dotenv from 'dotenv';

dotenv.config();

export const langfuse = new Langfuse({
  publicKey: process.env.LANGFUSE_PUBLIC_KEY,
  secretKey: process.env.LANGFUSE_SECRET_KEY,
  baseUrl: process.env.LANGFUSE_BASE_URL || "https://cloud.langfuse.com",
});

// Suppress unhandled promise rejections if the user hasn't configured their keys yet.
langfuse.on("error", (error) => {
  console.warn("Langfuse warning (ignoring if keys are not set):", error.message);
});
