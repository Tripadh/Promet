import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

const SUPPORTED_MODES = ["quick", "auto", "balanced", "expert"];

const MODE_TEMPLATES = {
  quick: {
    systemPrompt: `You are Prompt Improver in QUICK mode.

Your only job is to rewrite the user's prompt into a clearer version.

Rules:
- Always rewrite the prompt. Never return the user's text unchanged.
- Keep the output very short: maximum 1-2 sentences.
- Use plain text only. No headings, sections, labels, lists, bullets, or markdown.
- Do not add structured blocks like Task, Context, Requirements, or Output Format.
- Keep the original intent, but make wording clearer and slightly more specific.
- Return only the improved prompt text.`,
    buildUserPrompt: (userPrompt) => `Rewrite this prompt in QUICK mode:

${userPrompt}`,
    temperature: 0.25,
    maxTokens: 220,
  },

  auto: {
    systemPrompt: `You are Prompt Improver in AUTO mode.

Your job is to decide the best output structure based on the complexity of the user's request.

Rules:
- If the request is simple, return a concise clear paragraph prompt.
- If the request is complex (e.g., seminar, report, project, multi-step task), return a compact structured prompt.
- Do not force sections when not needed.
- Keep the output practical and easy to use.
- Return only the improved prompt text.`,
    buildUserPrompt: (userPrompt) => `Analyze this prompt and choose the right complexity automatically:

${userPrompt}`,
    temperature: 0.4,
    maxTokens: 500,
  },

  balanced: {
    systemPrompt: `You are Prompt Improver in BALANCED mode.

Your job is to produce a moderately detailed prompt with clear structure and practical guidance.

Rules:
- Use moderate structure with short sections or bullet points.
- Include task intent, useful context, and expected output format.
- Keep it concise and avoid excessive detail.
- Keep wording clear for general AI usage.
- Return only the improved prompt text.`,
    buildUserPrompt: (userPrompt) => `Rewrite this prompt in BALANCED mode:

${userPrompt}`,
    temperature: 0.35,
    maxTokens: 650,
  },

  expert: {
    systemPrompt: `You are Prompt Improver in EXPERT mode.

Your job is to produce a highly detailed, professional prompt-engineered instruction set.

Rules:
- Include: role definition, context, structured sections, constraints, and output format instructions.
- Add audience specification when relevant to the task.
- Use a clean professional structure with explicit expectations.
- Keep the final prompt focused on execution quality.
- Return only the improved prompt text.`,
    buildUserPrompt: (userPrompt) => `Rewrite this prompt in EXPERT mode with professional structure:

${userPrompt}`,
    temperature: 0.3,
    maxTokens: 900,
  },
};

export const normalizeMode = (mode) => {
  const normalized = String(mode || "balanced").toLowerCase();

  return SUPPORTED_MODES.includes(normalized) ? normalized : "balanced";
};

export const generateModeInstruction = (mode) => {
  const selectedMode = normalizeMode(mode);

  switch (selectedMode) {
    case "quick":
      return "Generate a very short improved prompt in 1-2 sentences only. No sections, no bullets, and no complex formatting.";

    case "auto":
      return "Analyze prompt complexity automatically. For simple tasks use concise prose, and for complex tasks use compact structure without forcing sections.";

    case "expert":
      return "Generate a detailed professional prompt with role definition, context, structured sections, constraints, and explicit output format instructions.";

    case "balanced":
    default:
      return "Generate a moderately detailed structured prompt with clear instructions, context, and expected output format, while keeping it concise.";
  }
};

export const buildPrompt = (mode, userPrompt) => {
  const selectedMode = normalizeMode(mode);
  const template = MODE_TEMPLATES[selectedMode];

  return {
    selectedMode,
    temperature: template.temperature,
    maxTokens: template.maxTokens,
    messages: [
      { role: "system", content: template.systemPrompt },
      { role: "user", content: template.buildUserPrompt(userPrompt) }
    ],
  };
};

export const improvePromptWithAI = async (prompt, mode = "balanced") => {

  try {
    const { temperature, maxTokens, messages } = buildPrompt(mode, prompt);

    const stream = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      temperature,
      max_tokens: maxTokens,
      messages,
      stream: true
    });

    return stream;

  } catch (error) {
    console.error("Groq Error:", error);
    throw new Error("AI generation failed");
  }

};