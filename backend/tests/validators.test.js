import { describe, it, expect } from "vitest";
import { validatePromptRequest } from "../src/utils/validators.js";
import { AI_CONFIG } from "../src/config/aiConfig.js";

describe("Input Validation Tests", () => {
  it("rejects empty input", () => {
    const req = { body: { prompt: "" } };
    const res = validatePromptRequest(req);
    expect(res.isValid).toBe(false);
    expect(res.errors[0]).toContain("empty");
  });

  it("rejects missing prompt", () => {
    const req = { body: {} };
    const res = validatePromptRequest(req);
    expect(res.isValid).toBe(false);
  });

  it("rejects overly long input", () => {
    const longPrompt = "A".repeat(AI_CONFIG.LIMITS.MAX_PROMPT_LENGTH + 1);
    const req = { body: { prompt: longPrompt } };
    const res = validatePromptRequest(req);
    expect(res.isValid).toBe(false);
    expect(res.errors[0]).toContain("exceeds maximum length");
  });

  it("accepts valid short input", () => {
    const req = { body: { prompt: "Refactor this code." } };
    const res = validatePromptRequest(req);
    expect(res.isValid).toBe(true);
  });

  it("rejects invalid mode", () => {
    const req = { body: { prompt: "test", mode: "invalid_mode" } };
    const res = validatePromptRequest(req);
    expect(res.isValid).toBe(false);
    expect(res.errors[0]).toContain("Invalid mode");
  });

  it("accepts valid mode", () => {
    const req = { body: { prompt: "test", mode: "expert" } };
    const res = validatePromptRequest(req);
    expect(res.isValid).toBe(true);
  });
});
