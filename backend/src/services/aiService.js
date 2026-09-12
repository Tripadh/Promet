import { nvidiaProvider } from "./providers/NvidiaProvider.js";
import { AI_CONFIG } from "../config/aiConfig.js";

const SUPPORTED_MODES = ["quick", "auto", "balanced", "expert"];

// ─────────────────────────────────────────────
// Domain-specific instruction injections
// Appended to the system prompt when a domain is selected
// ─────────────────────────────────────────────
const DOMAIN_INSTRUCTIONS = {
  tech: `\n\nDOMAIN CONTEXT — Tech / Code:
The user is working in a technical/software engineering context. Tailor the improved prompt to reflect:
- Senior developer tone with precise technical language
- Include architecture, system design, error handling, and scalability considerations
- Mention relevant technologies, design patterns, and best practices where appropriate
- The output should sound like it was written by a Staff Software Engineer`,

  social: `\n\nDOMAIN CONTEXT — Social Media:
The user wants a prompt optimized for social media content creation. Tailor the improved prompt to:
- Open with a strong hook that grabs attention in the first sentence
- Use short, punchy sentences and casual conversational tone
- Include suggestions for emojis, hashtags, and platform-specific formatting (Instagram, Twitter/X, LinkedIn, TikTok)
- Focus on engagement, shareability, and emotional impact`,

  marketing: `\n\nDOMAIN CONTEXT — Marketing:
The user is in a marketing/advertising context. Tailor the improved prompt to:
- Use persuasive, conversion-focused language
- Clearly define the target audience, value proposition, and call-to-action (CTA)
- Include copywriting principles (AIDA: Attention, Interest, Desire, Action)
- Optimize for the specific marketing channel (email, ad, landing page, etc.)`,

  creative: `\n\nDOMAIN CONTEXT — Creative Writing:
The user wants a prompt for creative or storytelling purposes. Tailor the improved prompt to:
- Specify narrative tone, genre, perspective (first/third person), and mood
- Include rich sensory details, character depth, and world-building cues
- Encourage originality, metaphor, and stylistic flair
- Avoid corporate or technical language — keep it literary and evocative`,

  email: `\n\nDOMAIN CONTEXT — Email:
The user wants a prompt for composing a professional or personal email. Tailor the improved prompt to:
- Specify the email's purpose, sender/recipient relationship, and desired tone (formal/informal)
- Include a clear subject line instruction, structured body (opening, main point, closing), and sign-off
- Keep language concise, professional, and action-oriented
- Avoid filler phrases — every sentence should serve a purpose`,

  education: `\n\nDOMAIN CONTEXT — Education:
The user wants a prompt for educational or learning content. Tailor the improved prompt to:
- Specify the target audience's knowledge level (beginner, intermediate, expert)
- Use clear, structured explanations with examples, analogies, and step-by-step breakdowns
- Encourage the AI to check for understanding, anticipate common misconceptions, and explain "why" not just "what"
- Maintain an encouraging, patient, and approachable tone`,
};

const COMMON_PROMPT_RULES = `<rules>
1. FIERCE PRESERVATION: You must absolutely preserve the user's original core intent. Do not hallucinate entirely different goals.
2. NEGATIVE CONSTRAINTS: If the user says "do not include X" or "no Y", you MUST mathematically ensure X or Y is excluded.
3. ZERO FLUFF: NEVER start your response with "Here is your improved prompt:" or "Certainly!". NEVER include conversational filler. You are an API; output ONLY the exact, raw, ready-to-use prompt text.
4. CLARITY: Fix all grammar, spelling, and syntactic ambiguity.
5. NO META-COMMENTARY: Do NOT include explanations of what you changed or why you changed it.
</rules>`;

const MODE_TEMPLATES = {
  quick: {
    systemPrompt: `You are Prompt Improver in QUICK mode.

${COMMON_PROMPT_RULES}

<task>
Fix grammar, punctuation, and slightly improve the clarity of the user's prompt. 
Make the prompt concise and highly practical.
Keep the output as brief as possible while remaining effective. DO NOT over-engineer it.
</task>`,
    buildUserPrompt: (userPrompt) => `Rewrite this prompt to be short, grammatically perfect, and immediately actionable:\n\n${userPrompt}`,
    temperature: 0.1,
    maxTokens: 250,
  },

  auto: {
    systemPrompt: `You are Prompt Improver in AUTO (Creative Thinker) mode.

${COMMON_PROMPT_RULES}

<persona>
You are an Elite Principal Product Manager and Creative Visionary. You don't just follow instructions; you elevate them to industry-leading standards.
</persona>

<task>
- Elevate the prompt's ambition and scope while fiercely preserving the core intent.
- Inject 2-3 highly innovative, unconventional ideas that the user didn't think of.
- Suggest alternative approaches or superior technologies if applicable.
- Use powerful imperative language ("Build", "Design", "Architect") and NEVER use first-person language ("I will").
- Transform a basic idea into an outstanding, professional product vision.
</task>`,
    buildUserPrompt: (userPrompt, context) => `As an Elite Product Visionary, analyze and elevate this prompt. Inject innovative ideas, challenge weak assumptions, and suggest vastly superior approaches while keeping the core intent intact.

[COMPLEXITY LEVEL: ${context.complexity.level}]

User Prompt:
${userPrompt}`,
    temperature: 0.7,
    maxTokens: 1000,
  },

  balanced: {
    systemPrompt: `You are Prompt Improver in BALANCED mode.

${COMMON_PROMPT_RULES}

<persona>
You are a Pragmatic Technical Lead and Expert Prompt Engineer. You strike the ideal balance between clarity, structure, and brevity.
</persona>

<task>
- Expand the prompt intelligently while strictly preserving core intent.
- Fix all grammatical ambiguities and structure requirements using clean bullet points.
- Add minimal, highly relevant context to guide the target LLM effectively.
- Keep the output concise, practical, and well-organized (8–15 lines).
</task>`,
    buildUserPrompt: (userPrompt) => `Elevate this prompt to be well-structured, clear, and balanced. Add precise requirements and useful context without bloat:\n\n${userPrompt}`,
    temperature: 0.3,
    maxTokens: 500,
  },

  expert: {
    systemPrompt: `You are Prompt Improver in EXPERT mode.

${COMMON_PROMPT_RULES}

<persona>
You are an Elite Staff-Level Prompt Engineer and Systems Architect. You produce flawless, highly structured, edge-case-resistant engineering prompts.
</persona>

<task>
Transform the user's prompt into a perfect 10/10, architecturally rich, and technically exhaustive request.
1. STRUCTURE: You MUST use clean Markdown formatting with standard prompt-engineering sections (e.g., "🎯 Objective", "⚡ Constraints", "📋 Output Format", "🛡️ Edge Cases").
2. EXECUTION: Do not just "describe" constraints—execute them within the final improved prompt as hard LLM rules.
3. CONTEXT: Expand the request significantly with deeper engineering context, scalability concerns, integration points, and operational aspects when relevant.
4. ERROR HANDLING: Automatically inject explicit instructions for the target LLM to handle errors, edge cases, and fallback scenarios.
</task>`,
    buildUserPrompt: (userPrompt) => `Re-engineer the following prompt into a perfect 10/10 expert-level request using professional Markdown structure:\n\n${userPrompt}`,
    temperature: 0.4,
    maxTokens: 1500,
  },
};

// ─────────────────────────────────────────────
// NEW: Meaningless input detection
// Returns true if the input has no real intent —
// random words, gibberish, single chars, or pure
// filler with zero actionable meaning.
// ─────────────────────────────────────────────
export const isMeaninglessInput = (text = "", isUpdate = false) => {
  const trimmed = String(text || "").trim();

  // Empty or just whitespace
  if (!trimmed) return true;

  // Single character or just punctuation/numbers
  if (trimmed.length <= 2) return true;

  // Only non-alphabetic characters
  if (!/[a-zA-Z]{2,}/.test(trimmed)) return true;

  const words = trimmed.split(/\s+/).filter(Boolean);

  const commonWords = new Set([
    "a", "an", "the", "i", "me", "my", "we", "you", "it", "is", "are", "do",
    "make", "build", "create", "write", "design", "develop", "generate", "give",
    "show", "tell", "help", "get", "use", "add", "find", "fix", "update", "run",
    "something", "anything", "stuff", "thing", "things", "this", "that", "what",
    "can", "will", "want", "need", "like", "just", "please", "now", "some",
    "for", "with", "from", "to", "in", "on", "at", "by", "as", "or", "and",
    "be", "have", "has", "had", "been", "being", "should", "would", "could",
    "mobile", "app", "fitness", "coach", "web", "site", "api", "tool", "game",
    "design", "user", "friendly", "create", "share", "plan", "scheduling",
    "feature", "track", "progress", "workout", "client", "personalized",
  ]);

  const knownWordCount = words.filter(w => commonWords.has(w.toLowerCase())).length;

  // Gibberish check based on unrealistic word patterns (e.g. "asdfgh")
  const unknownWords = words.filter(w => !commonWords.has(w.toLowerCase()));
  let unrealisticWords = 0;
  
  for (const word of unknownWords) {
    const cleaned = word.toLowerCase().replace(/[^a-z]/g, '');
    if (cleaned.length < 2) continue;
    
    // Check for unrealistic English patterns
    // - 4+ consonants in a row (very rare)
    // - Less than 15% vowels (too consonant-heavy)
    const consonantClusters = (cleaned.match(/[bcdfghjklmnpqrstvwxyz]{4,}/g) || []).length;
    const vowels = cleaned.match(/[aeiou]/g) || [];
    const vowelRatio = vowels.length / cleaned.length;
    
    if (consonantClusters > 0 || vowelRatio < 0.15) {
      unrealisticWords++;
    }
  }
  
  // If >50% of unknown words are unrealistic, it's gibberish
  if (unknownWords.length > 0 && (unrealisticWords / unknownWords.length) > 0.5) {
    // Only return true if there's hardly any known words to anchor it
    if (knownWordCount < 2) return true;
  }

  // If this is an update to an existing prompt (like "change the name to apple"), 
  // we do NOT want to apply the strict length/domain rules. It's valid context.
  if (isUpdate) return false;

  // Pure filler: all words are generic fillers with zero domain signal
  const fillerOnlyPatterns = [
    /^(do\s+)?something$/i,
    /^(make|build|create|write|give|do)\s+(me\s+)?(something|anything|stuff|a\s+thing)$/i,
    /^(help|assist)\s+(me\s+)?please$/i,
    /^(just\s+)?(do|make|write|build|fix)\s+it$/i,
    /^idk$/i,
    /^(hi|hey|hello|ok|okay|yes|no|maybe|sure|lol|wtf|hmm+|ugh|meh)$/i,
    /^[a-z]{1,3}$/i,
    /^(.)\1{2,}$/i, // repeated single char like "aaaa", "????"
    /^(make\s+it\s+)?better$/i,
    /^(make|build|create|write|do|give|generate)\s+(something|anything|stuff|it)\s+\w+$/i,
    /^(make|build|create)\s+(something|a\s+thing)\s+(cool|awesome|fun|great|good|nice|better|amazing|interesting|unique|new)$/i,
    /^(just\s+)?(make|build|create|write)\s+(me\s+)?(something|anything)\s*(\w*)$/i,
  ];

  if (fillerOnlyPatterns.some(p => p.test(trimmed))) return true;

  // Domain nouns that indicate a real task/request
  const domainNouns = [
    "website", "web", "app", "application", "api", "tool", "script", "bot",
    "dashboard", "game", "form", "page", "email", "report", "function",
    "component", "service", "database", "server", "cli", "extension",
    "plugin", "library", "test", "story", "essay", "poem", "letter",
    "blog", "article", "summary", "site", "system", "platform", "code",
    "program", "software", "feature", "module", "widget", "chart", "ui",
    "rest", "graphql", "schema",
  ];

  const lower = trimmed.toLowerCase();
  const hasDomain = domainNouns.some(n => lower.includes(n));

  // Short input with only generic filler words and no domain signal
  if (words.length <= 4 && knownWordCount === words.length) {
    if (!hasDomain) return true;
  }

  // Additional check for short inputs with vague patterns
  // 5 words or fewer, AND no domain noun, AND contains vague verb + vague object
  if (words.length <= 5 && !hasDomain) {
    const vagueVerbs = ["make", "build", "create", "write", "do", "give", "generate"];
    const vagueObjects = ["something", "anything", "stuff", "it", "thing"];
    
    const hasVagueVerb = vagueVerbs.some(v => lower.includes(v));
    const hasVagueObject = vagueObjects.some(o => lower.includes(o));

    // If has vague verb + vague object combo but no domain noun, it's meaningless
    if (hasVagueVerb && hasVagueObject) {
      return true;
    }
  }

  return false;
};

// Clarification response — returned instead of calling the LLM
// when input is meaningless. Friendly, short, actionable.
export const buildClarificationResponse = (userPrompt = "") => {
  return {
    needsClarification: true,
    message: `Your input is too vague to improve effectively. Please provide more details such as:
- What you want to create
- Target audience
- Desired outcome
Example: 'Write an Instagram caption for a fitness product launch targeting young adults.'`,
  };
};

// ─────────────────────────────────────────────
// Detect if input is vague — short with no domain signal
// (used for complexity scoring, not full meaningless check)
// ─────────────────────────────────────────────
const isVagueInput = (text = "") => {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length >= 6) return false;

  const domainNouns = [
    "website", "app", "api", "tool", "script", "bot", "dashboard", "game",
    "form", "page", "email", "report", "function", "component", "service",
    "database", "server", "cli", "extension", "plugin", "library", "test",
    "story", "essay", "poem", "letter", "blog", "article", "summary",
  ];
  const lower = text.toLowerCase();
  const hasDomain = domainNouns.some(n => lower.includes(n));
  return !hasDomain;
};

export const detectComplexity = (userPrompt = "") => {
  const text = String(userPrompt || "").trim();
  const words = text.split(/\s+/).filter(Boolean).length;

  // Catch vague/ultra-short inputs before keyword scoring
  if (isVagueInput(text)) {
    return {
      level: "moderate",
      hint: "Input is vague or very short with no clear domain. Make reasonable assumptions about what the user likely wants (e.g. a software product or creative output), state them clearly, and expand with useful context and requirements.",
    };
  }

  const complexKeywords = [
    "project", "architecture", "timeline", "strategy", "research", "report",
    "roadmap", "multi-step", "design", "risk", "tradeoff", "integration",
    "implementation", "evaluation", "deliverables", "framework", "migration",
    "saas", "app", "application", "system", "platform", "api", "database",
    "backend", "frontend", "deploy", "auth", "authentication", "dashboard",
    "microservice", "pipeline", "workflow", "scale", "cloud", "server",
  ];

  const scoreFromKeywords = complexKeywords.reduce((score, keyword) => (
    text.toLowerCase().includes(keyword) ? score + 1 : score
  ), 0);

  const hasManySeparators = (text.match(/[;:,]/g) || []).length >= 3;

  const broadIntentPatterns = [
    /build\s+(me\s+)?(a|an)\s+\w+/i,
    /create\s+(a|an)\s+(full|complete|entire)\s+/i,
    /make\s+(a|an)\s+\w+\s+(app|site|system|tool|platform)/i,
    /develop\s+(a|an)\s+/i,
    /design\s+(a|an)\s+/i,
  ];
  const isBroadIntent = broadIntentPatterns.some(p => p.test(text));

  const score =
    (words > 120 ? 2 : words > 60 ? 1 : 0) +
    (scoreFromKeywords >= 4 ? 2 : scoreFromKeywords >= 2 ? 1 : 0) +
    (hasManySeparators ? 1 : 0) +
    (isBroadIntent ? 1 : 0);

  if (score >= 4) {
    return {
      level: "complex",
      hint: "Create a detailed, comprehensive prompt with clear requirements.",
    };
  }

  if (score >= 2) {
    return {
      level: "moderate",
      hint: "Create a clear, moderately detailed prompt.",
    };
  }

  return {
    level: "simple",
    hint: "Create a concise, straightforward prompt.",
  };
};



export const validatePromptOutput = (output, mode = "balanced") => {
  const cleaned = String(output || "").trim();
  const errors = [];

  if (!cleaned) errors.push("Output is empty.");
  if (cleaned.length < 10) errors.push("Output is too short and likely incomplete.");

  if (mode === "auto") {
    const wordCount = cleaned.split(/\s+/).length;
    if (wordCount < 40) {
      errors.push("Auto mode output is too short. Expected a properly expanded prompt (at least ~40 words).");
    }
    
    // First-person detection for AUTO mode
    const firstPersonPatterns = [
      /^i will\b/i,
      /^i'll\b/i,
      /^we will\b/i,
      /^we'll\b/i,
      /^i am going to\b/i,
      /^we are going to\b/i
    ];
    
    if (firstPersonPatterns.some(pattern => pattern.test(cleaned))) {
      errors.push("Auto mode output illegally begins with first-person language.");
    }
  }

  if (
    /\b\d+\.[\sA-Za-z]?$/.test(cleaned) ||
    /\n\s*[-*]\s*$/.test(cleaned) ||
    /\n\s*#+\s*[A-Za-z0-9\s]*$/.test(cleaned)
  ) {
    errors.push("Output appears truncated.");
  }

  return {
    isValid: errors.length === 0,
    errors,
    cleanedPrompt: cleaned,
  };
};

export const normalizeMode = (mode) => {
  const normalized = String(mode || "balanced").toLowerCase();
  return SUPPORTED_MODES.includes(normalized) ? normalized : "balanced";
};

export const generateModeInstruction = (mode) => {
  const selectedMode = normalizeMode(mode);

  switch (selectedMode) {
    case "quick":   return "Generate a short, concise, and practical prompt.";
    case "auto":    return "Act as a senior product thinker: inject innovative ideas, suggest alternatives, and challenge weak assumptions.";
    case "expert":  return "Generate a highly detailed, professional, and comprehensive prompt.";
    case "balanced":
    default:        return "Generate a clear, moderately detailed prompt.";
  }
};

export const buildPrompt = (mode, userPrompt, isRetry = false, previousPrompt = null, domain = null) => {
  const selectedMode = normalizeMode(mode);
  const template = MODE_TEMPLATES[selectedMode];
  const complexity = detectComplexity(userPrompt);

  let systemPrompt = template.systemPrompt;

  // Inject domain-specific instructions when a domain is selected
  if (domain && DOMAIN_INSTRUCTIONS[domain]) {
    systemPrompt += DOMAIN_INSTRUCTIONS[domain];
  }

  if (isRetry) {
    systemPrompt += `\n\nNOTE: The user has requested to retry this generation. Provide a slightly different, alternative phrasing and creative approach compared to what you would normally produce.`;
  }

  if (previousPrompt) {
    systemPrompt += `\n\nYou are updating an existing prompt. The user is providing an instruction to modify or extend the previous prompt. Update the previous prompt according to the new instruction while maintaining its role and overall structure.`;
  }

  const temperature = isRetry ? Math.min(template.temperature + 0.4, 1.0) : template.temperature;

  const userContent = previousPrompt
    ? `Previous Prompt:\n${previousPrompt}\n\nUpdate Instruction:\n<user_content>\n${userPrompt}\n</user_content>`
    : template.buildUserPrompt(`<user_content>\n${userPrompt}\n</user_content>`, { complexity });

  return {
    selectedMode,
    temperature,
    maxTokens: template.maxTokens,
    models: AI_CONFIG.MODELS[selectedMode],
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userContent },
    ],
  };
};



const buildDeterministicFallbackPrompt = (userPrompt = "", candidatePrompt = "") => {
  const original = String(userPrompt || "").trim();
  const candidate = String(candidatePrompt || "").trim();
  return candidate || original;
};

export const createMemoryStore = () => ({ memory: null });

export const clearPromptMemory = (store) => {
  store.memory = null;
};

// ─────────────────────────────────────────────
// NEW: Strict Short Input Guard
// ─────────────────────────────────────────────
export const isTooShortInput = (text = "") => {
  const trimmed = String(text || "").trim();
  const words = trimmed.split(/\s+/).filter(Boolean);
  
  // ONLY block: empty input, 1-word inputs
  if (words.length <= 1) return true;
  
  return false;
};

// ─────────────────────────────────────────────
// Main improve function (non-streaming)
// Returns { needsClarification, message } if input
// is meaningless, otherwise returns the improved prompt string.
// ─────────────────────────────────────────────
export const improvePromptWithAI = async (prompt, mode = "balanced", isRetry = false, store = null, domain = null, signal = null) => {
  const memStore = store || createMemoryStore();
  const isUpdate = Boolean(memStore.memory) && !isRetry;

  if (isMeaninglessInput(prompt, isUpdate)) {
    return buildClarificationResponse(prompt);
  }

  try {
    const { selectedMode, temperature, maxTokens, models, messages } = buildPrompt(
      mode, prompt, isRetry, memStore.memory, domain
    );

    const assembled = await nvidiaProvider.generateCompletion({
      models,
      temperature,
      maxTokens,
      messages,
      signal,
    });

    const validated = validatePromptOutput(assembled, selectedMode);

    if (!validated.isValid) {
      console.warn(`Generated prompt failed validation: ${validated.errors.join(" ")}`);
      // We bubble up errors now, instead of deterministic fallback, so the controller knows.
      throw new Error(`Validation failed: ${validated.errors.join(" ")}`);
    }

    memStore.memory = validated.cleanedPrompt;
    return validated.cleanedPrompt;

  } catch (error) {
    console.error("Nvidia Error:", error);
    const fallback = buildDeterministicFallbackPrompt(prompt);
    if (!isRetry) memStore.memory = fallback;
    return fallback;
  }
};

// ─────────────────────────────────────────────
// Streaming improve function
// If input is meaningless, calls onToken with the
// clarification message and returns early — no LLM call.
// ─────────────────────────────────────────────
export const improvePromptWithAIStream = async (prompt, mode = "balanced", isRetry = false, onToken, store = null, domain = null, signal = null) => {
  const memStore = store || createMemoryStore();
  const isUpdate = Boolean(memStore.memory) && !isRetry;

  if (isMeaninglessInput(prompt, isUpdate)) {
    const clarification = buildClarificationResponse(prompt);
    for (const char of clarification.message) {
      onToken(char);
      await new Promise(r => setTimeout(r, 0));
    }
    return clarification;
  }

  try {
    const { selectedMode, temperature, maxTokens, models, messages } = buildPrompt(
      mode, prompt, isRetry, memStore.memory, domain
    );

    const stream = await nvidiaProvider.streamCompletion({
      models,
      temperature,
      maxTokens,
      messages,
      signal,
    });

    let fullText = "";

    for await (const chunk of stream) {
      const token = chunk?.choices?.[0]?.delta?.content || "";
      if (token) {
        fullText += token;
        onToken(token);
      }
    }

    const validated = validatePromptOutput(fullText, selectedMode);

    if (!validated.isValid) {
      console.warn(`Generated prompt failed validation: ${validated.errors.join(" ")}`);
      throw new Error(`Validation failed: ${validated.errors.join(" ")}`);
    }

    memStore.memory = validated.cleanedPrompt;
    return validated.cleanedPrompt;

  } catch (error) {
    console.error("Nvidia Streaming Error:", error);
    const fallback = buildDeterministicFallbackPrompt(prompt);
    if (!isRetry) memStore.memory = fallback;
    return fallback;
  }
};

// ─────────────────────────────────────────────
// Generate Chat Title
// Returns a short 2-4 word summary for a new chat
// ─────────────────────────────────────────────
export const generateChatTitle = async (prompt, signal = null) => {
  try {
    const titleText = await nvidiaProvider.generateCompletion({
      models: AI_CONFIG.MODELS.quick,
      temperature: 0.3,
      maxTokens: 15,
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant. Generate a very short, concise title (2-4 words maximum) summarizing the main topic of the following user prompt. Do not use quotes, punctuation, or conversational filler. Return ONLY the title text.",
        },
        {
          role: "user",
          content: String(prompt).trim(),
        },
      ],
      signal,
    });

    // Clean up any stray quotes the model might have added
    return (titleText || "").replace(/^["']|["']$/g, "").substring(0, 60);
  } catch (error) {
    console.error("Generate chat title error:", error);
    return null;
  }
};