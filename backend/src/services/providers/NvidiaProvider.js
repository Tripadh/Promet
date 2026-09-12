import OpenAI from "openai";
import { AI_CONFIG } from "../../config/aiConfig.js";

class ProviderError extends Error {
  constructor(message, status, code) {
    super(message);
    this.name = "ProviderError";
    this.status = status;
    this.code = code;
  }
}

class NvidiaProvider {
  constructor() {
    // Lazy initialization so it doesn't crash on boot if env is missing
    this.client = null;
  }

  getClient() {
    if (!this.client) {
      if (!process.env.NVIDIA_API_KEY) {
        throw new Error("NVIDIA_API_KEY is not configured in the environment.");
      }
      this.client = new OpenAI({
        apiKey: process.env.NVIDIA_API_KEY,
        baseURL: AI_CONFIG.PROVIDERS.NVIDIA.BASE_URL,
      });
    }
    return this.client;
  }

  /**
   * Exponential backoff sleep
   */
  async _sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Normalizes provider errors into structured objects.
   */
  _handleError(error) {
    if (error instanceof OpenAI.APIError) {
      const status = error.status;
      if (status === 429) {
        throw new ProviderError("Rate limit exceeded from NVIDIA API.", status, "RATE_LIMIT");
      }
      if (status >= 500) {
        throw new ProviderError("NVIDIA API is currently unavailable.", status, "PROVIDER_UNAVAILABLE");
      }
      if (status === 401 || status === 403) {
        throw new ProviderError("NVIDIA API authentication failed. Check API key.", status, "AUTH_ERROR");
      }
      throw new ProviderError(error.message || "NVIDIA API Error", status, "API_ERROR");
    }
    
    if (error.name === "AbortError" || error.code === "ECONNABORTED") {
      throw new ProviderError("Request cancelled or timed out.", 408, "TIMEOUT_OR_ABORT");
    }

    throw new ProviderError(`Internal Error: ${error.message}`, 500, "INTERNAL");
  }

  /**
   * Executes a provider call with bounded exponential backoff.
   */
  async _executeWithRetry(operation, signal) {
    let attempt = 0;
    const maxRetries = AI_CONFIG.PROVIDERS.NVIDIA.MAX_RETRIES;

    while (attempt <= maxRetries) {
      try {
        if (signal?.aborted) {
          throw new DOMException("Aborted", "AbortError");
        }
        return await operation();
      } catch (error) {
        // Don't retry if aborted
        if (signal?.aborted || error.name === "AbortError") {
          throw error;
        }

        // Only retry transient errors
        const isTransient = 
          error instanceof OpenAI.APIError && 
          (error.status === 429 || error.status >= 500);
          
        const isNetworkError = error.code === "ECONNRESET" || error.code === "ETIMEDOUT";

        if ((!isTransient && !isNetworkError) || attempt === maxRetries) {
          this._handleError(error);
        }

        attempt++;
        // Bounded exponential backoff with jitter
        const delay = Math.min(1000 * Math.pow(2, attempt) + Math.random() * 1000, 10000);
        console.warn(`[NvidiaProvider] Transient error (Attempt ${attempt}/${maxRetries}). Retrying in ${Math.round(delay)}ms...`);
        await this._sleep(delay);
      }
    }
  }

  /**
   * Generates a single string response with fallback support.
   */
  async generateCompletion({ models, messages, temperature, maxTokens, signal }) {
    const client = this.getClient();
    let lastError = null;
    
    // Ensure models is an array
    const modelChain = Array.isArray(models) ? models : [models];

    for (const currentModel of modelChain) {
      try {
        return await this._executeWithRetry(async () => {
          const response = await client.chat.completions.create(
            {
              model: currentModel,
              messages,
              temperature,
              max_tokens: maxTokens,
            },
            { signal }
          );
          return response.choices[0]?.message?.content?.trim() || "";
        }, signal);
      } catch (error) {
        if (signal?.aborted || error.name === "AbortError") throw error;
        console.warn(`[NvidiaProvider] Model ${currentModel} failed. Falling back to next... Error: ${error.message}`);
        lastError = error;
      }
    }
    
    // If we exhaust all models
    throw lastError || new Error("All fallback models failed.");
  }

  /**
   * Streams a response with fallback support.
   */
  async streamCompletion({ models, messages, temperature, maxTokens, signal }) {
    const client = this.getClient();
    let lastError = null;

    const modelChain = Array.isArray(models) ? models : [models];

    for (const currentModel of modelChain) {
      try {
        return await this._executeWithRetry(async () => {
          return await client.chat.completions.create(
            {
              model: currentModel,
              messages,
              temperature,
              max_tokens: maxTokens,
              stream: true,
            },
            { signal }
          );
        }, signal);
      } catch (error) {
        if (signal?.aborted || error.name === "AbortError") throw error;
        console.warn(`[NvidiaProvider] Model ${currentModel} failed. Falling back to next... Error: ${error.message}`);
        lastError = error;
      }
    }

    throw lastError || new Error("All fallback models failed.");
  }
}

export const nvidiaProvider = new NvidiaProvider();
