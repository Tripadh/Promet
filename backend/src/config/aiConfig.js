export const AI_CONFIG = {
  MODELS: {
    quick: "meta/llama-3.1-8b-instruct",
    auto: "deepseek-ai/deepseek-v3",
    balanced: "nvidia/llama-3.1-nemotron-70b-instruct",
    expert: "meta/llama-3.1-405b-instruct",
    chat: "meta/llama-3.1-8b-instruct",
  },
  LIMITS: {
    MAX_PROMPT_LENGTH: 5000, // Maximum characters a user can send
    MAX_PREVIOUS_PROMPT_LENGTH: 10000,
    MAX_OUTPUT_TOKENS: {
      quick: 250,
      auto: 1000,
      balanced: 500,
      expert: 1500,
      chat: 500,
    },
  },
  PROVIDERS: {
    NVIDIA: {
      BASE_URL: "https://integrate.api.nvidia.com/v1",
      TIMEOUT_MS: 30000, // 30 seconds max for a request
      MAX_RETRIES: 3,
    },
  },
};
