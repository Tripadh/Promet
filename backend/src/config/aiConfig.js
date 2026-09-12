export const AI_CONFIG = {
  MODELS: {
    quick: ["deepseek-ai/deepseek-v4-flash-0731", "nvidia/nemotron-3.5-lightning-30b-a3b", "moonshotai/kimi-k3"],
    auto: ["deepseek-ai/deepseek-v4-pro-0813", "openai/gpt-oss-20b", "nvidia/nemotron-3-ultra-550b-a55b"],
    balanced: ["moonshotai/kimi-k3", "openai/gpt-oss-20b", "nvidia/nemotron-3.5-lightning-30b-a3b", "deepseek-ai/deepseek-v4-pro-0813"],
    expert: ["nvidia/nemotron-3-ultra-550b-a55b", "deepseek-ai/deepseek-v4-pro-0813"],
    chat: ["deepseek-ai/deepseek-v4-flash-0731", "nvidia/nemotron-3.5-lightning-30b-a3b", "openai/gpt-oss-20b", "moonshotai/kimi-k3"],
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
