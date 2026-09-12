import { describe, it, expect, vi, beforeEach } from "vitest";
import { nvidiaProvider } from "../src/services/providers/NvidiaProvider.js";
import { AI_CONFIG } from "../src/config/aiConfig.js";

// Mock the openAI client
const mockCreate = vi.fn();

vi.mock("openai", () => {
  class OpenAI {
    constructor() {
      this.chat = { completions: { create: mockCreate } };
    }
  }
  OpenAI.APIError = class extends Error {
    constructor(status, message) {
      super(message);
      this.status = status;
      this.name = "APIError";
    }
  };
  return { default: OpenAI };
});

describe("NvidiaProvider Retry and Error Handling Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NVIDIA_API_KEY = "test-key";
    nvidiaProvider.client = null; // force re-init
  });

  it("retries on 429 transient error and then succeeds", async () => {
    const mockResponse = { choices: [{ message: { content: "Success" } }] };
    
    const OpenAIModule = await import("openai");
    
    mockCreate
      .mockRejectedValueOnce(new OpenAIModule.default.APIError(429, "Too Many Requests"))
      .mockResolvedValueOnce(mockResponse);

    // Override sleep to run instantly in tests
    nvidiaProvider._sleep = vi.fn().mockResolvedValue();

    const result = await nvidiaProvider.generateCompletion({
      models: ["test-model"],
      messages: [{ role: "user", content: "test" }],
      temperature: 0.5,
      maxTokens: 100,
    });

    expect(result).toBe("Success");
    expect(mockCreate).toHaveBeenCalledTimes(2);
    expect(nvidiaProvider._sleep).toHaveBeenCalledTimes(1);
  });

  it("fails immediately on 401 permanent error without retrying", async () => {
    const OpenAIModule = await import("openai");
    mockCreate.mockRejectedValueOnce(new OpenAIModule.default.APIError(401, "Unauthorized"));

    await expect(nvidiaProvider.generateCompletion({
      models: ["test-model"],
      messages: [],
    })).rejects.toThrow(/authentication failed/);

    expect(mockCreate).toHaveBeenCalledTimes(1);
  });

  it("aborts when signal is aborted before request", async () => {
    const controller = new AbortController();
    controller.abort();

    await expect(nvidiaProvider.generateCompletion({
      models: ["test-model"],
      messages: [],
      signal: controller.signal,
    })).rejects.toThrow(/Aborted/);
    
    expect(mockCreate).not.toHaveBeenCalled();
  });
});
