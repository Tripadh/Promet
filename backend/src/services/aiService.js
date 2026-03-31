import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

const SUPPORTED_MODES = ["quick", "auto", "balanced", "expert"];

// Per-mode model — expert gets the big model
const MODE_MODELS = {
  quick:    "llama-3.1-8b-instant",
  auto:     "llama-3.3-70b-versatile",
  balanced: "llama-3.1-8b-instant",
  expert:   "llama-3.3-70b-versatile",
};

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

const COMMON_PROMPT_RULES = `You are an intelligent AI assistant designed to improve user prompts with precision and restraint.

Core rules:
1. ALWAYS PRESERVE THE USER'S ORIGINAL INTENT. Do not introduce unrelated ideas.
2. CRITICAL: DETECT AND RESPECT ALL NEGATIVE CONSTRAINTS. If the user says "do not include X", you MUST NOT include it.
3. Fix grammar and spelling mistakes.
4. Improve clarity, structure, and effectiveness while keeping the exact same meaning.
5. Return ONLY the improved prompt. Do NOT include explanations, meta commentary, or analysis.
6. Keep output structured, clear, and ready to use.
7. Do NOT add prompt-engineering sections like "Task", "Constraints", or markdown-style headings unless the mode allows it (e.g., Expert mode).
8. Behave like a selective, high-quality system. If the prompt is already excellent, make only minimal refinements.`;

const MODE_TEMPLATES = {
  quick: {
    systemPrompt: `You are Prompt Improver in QUICK mode.

${COMMON_PROMPT_RULES}

Action: Fix grammar and slightly improve clarity.
Make the prompt concise and practical. Keep the output as brief as possible while remaining effective.
DO NOT introduce new context or invent details.`,
    buildUserPrompt: (userPrompt) => `Rewrite this prompt to be short, clear, and immediately actionable:

${userPrompt}`,
    temperature: 0.2,
    maxTokens: 200,
  },

  auto: {
    systemPrompt: `You are Prompt Improver in AUTO (Creative Thinker) mode.

${COMMON_PROMPT_RULES}

Rules for AUTO mode:
- Act as a senior product thinker that thinks outside the box.
- FIERCELY preserve the user's original core intent.
- Suggest 2-3 innovative, unconventional ideas or features that align with the user's goal but elevate the concept.
- Suggest alternative approaches or better technologies that solve the root problem more elegantly.
- Use imperative language ("Build", "Design", "Create") and absolutely NEVER use first-person language ("I will create").
- Produce a powerful prompt that transforms a basic idea into an outstanding product vision while remaining disciplined.`,
    buildUserPrompt: (userPrompt, context) => `Analyze this prompt. As a senior product thinker, elevate the prompt's ambition. Inject innovative ideas, challenge weak assumptions, and suggest better approaches while keeping the core intent intact.

Complexity: ${context.complexity.level}

User prompt:

${userPrompt}`,
    temperature: 0.65,
    maxTokens: 1000,
  },

  balanced: {
    systemPrompt: `You are Prompt Improver in BALANCED mode.

${COMMON_PROMPT_RULES}

Expand the prompt intelligently. Focus on fixing grammar, clarifying requirements, improving wording, and adding MINIMAL useful context.
Do not overcomplicate or bloat the prompt. Structure your output with clear numbered requirements or bullet points where it helps readability.
Produce a reasonably detailed prompt, typically around 8–12 lines for moderate inputs. Do not restrict length to a specific number of sentences, and avoid unnecessary repetition or filler.`,
    buildUserPrompt: (userPrompt) => `Rewrite this prompt to be balanced, clear, and highly effective. Add useful context and structure requirements clearly:

${userPrompt}`,
    temperature: 0.4,
    maxTokens: 450,
  },

  expert: {
    systemPrompt: `You are Prompt Improver in EXPERT mode.

${COMMON_PROMPT_RULES}

**EXPERT OVERRIDES TO COMMON RULES:**
- IGNORING RULE 7 & 10: You MUST use clean Markdown formatting, structured sections (e.g., "🎯 Project Overview", "⚡ Technical Constraints", "📋 Output Format"), and bullet points to break down complex prompts expertly. 
- Do NOT just create a giant wall of text. Use headings to make the prompt readable and professional.

Your job is to transform the user's prompt into a perfect 10/10, architecturally rich, and technically detailed prompt suitable for expert-level AI responses.

Guidelines:
1. **PURE EXECUTION:** Do not just "describe" constraints—execute them within the final improved prompt. If the user asks for a JSON format, provide a structured JSON schema or example in the prompt. If they ask for creative rules (e.g., poetry constraints), explicitly state them as hard LLM rules.
2. **DEEP CONTEXT:** Expand the request significantly with deeper engineering context, architecture considerations, scalability concerns, integration points, and operational aspects when relevant.
3. **EDGE CASES & ERROR HANDLING:** Automatically inject instructions for the target LLM to handle errors, edge cases, and fallback scenarios.
4. **EXPERT PERSONA:** Write the prompt so the target AI acts as a "Senior Staff Developer" or domain expert.
5. **NO FLUFF:** No conversational padding ("Here is your prompt"). Just return the ultimate, perfect prompt itself.`,
    buildUserPrompt: (userPrompt) => `Improve the following prompt into a perfect 10/10 expert-level engineering request.

Ensure the final prompt has:
- Beautiful Markdown structuring (Clear headings, bullet points, code blocks for schemas/examples if relevant).
- Explicit, structured constraints that the target AI cannot misinterpret.
- Architectural depth, edge case handling, and best-practice engineering guidelines.
- Absolute adherence to the user's original negative constraints (if any).

Prompt:
${userPrompt}`,
    temperature: 0.3,
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

export const removeDuplicateLines = (input = "") => {
  const lines = String(input || "").split(/\r?\n/);
  const seen = new Set();
  const output = [];

  for (const line of lines) {
    const normalized = line.trim().toLowerCase();

    if (!normalized) {
      output.push(line);
      continue;
    }

    if (seen.has(normalized)) continue;

    seen.add(normalized);
    output.push(line);
  }

  return output
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
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
    ? `Previous Prompt:\n${previousPrompt}\n\nUpdate Instruction:\n${userPrompt}`
    : template.buildUserPrompt(userPrompt, { complexity });

  return {
    selectedMode,
    temperature,
    maxTokens: template.maxTokens,
    model: MODE_MODELS[selectedMode],
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userContent },
    ],
  };
};

const assembleStreamOutput = async (stream) => {
  let fullText = "";
  for await (const chunk of stream) {
    const token = chunk?.choices?.[0]?.delta?.content || "";
    if (token) fullText += token;
  }
  return fullText.trim();
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
// NEW: Detect Intent (Chat vs Improve)
// ─────────────────────────────────────────────
export const detectIntent = (text = "", intentMode = "auto") => {
  if (intentMode === "chat") return "chat";
  if (intentMode === "improve") return "improve";

  const trimmed = String(text || "").trim();
  const lower = trimmed.toLowerCase();
  const words = lower.split(/\s+/).filter(Boolean);

  // 1. Run short input guard (1 word goes to chat)
  if (words.length <= 1) {
    return "chat";
  }

  // 2. If input is a 2-word command -> improve
  const commandWords = ["build", "create", "make", "fix", "write", "design"];
  if (words.length === 2 && commandWords.includes(words[0])) {
    return "improve";
  }

  // 3. If contains action verbs (word-level match) -> improve
  const actionVerbs = [
    "build", "create", "design", "analyze", "generate",
    "develop", "write", "make", "improve", "expand", "summarize", "fix"
  ];
  if (words.some(word => actionVerbs.includes(word))) {
    return "improve";
  }

  // 4. Strong constraints for Improve mode
  if (trimmed.includes('\n') || trimmed.length > 120) {
    return "improve";
  }

  // 5. Default fallback is chat
  return "chat";
};

// ─────────────────────────────────────────────
// NEW: Chat Mode streaming function
// ─────────────────────────────────────────────
export const chatWithAIStream = async (prompt, onToken) => {
  try {
    const stream = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      temperature: 0.5,
      max_tokens: 500,
      messages: [
        {
          role: "system",
          content: "You are a friendly assistant. Respond naturally and casually. Do not use prompt-engineering formatting templates unless the user specifically asks you to improve a prompt.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      stream: true,
    });

    let fullText = "";
    for await (const chunk of stream) {
      const token = chunk?.choices?.[0]?.delta?.content || "";
      if (token) {
        fullText += token;
        onToken(token);
      }
    }
    return fullText.trim();
  } catch (error) {
    console.error("Groq Chat Streaming Error:", error);
    const fallback = "I'm having trouble responding right now. Please try again.";
    for (const char of fallback) { onToken(char); }
    return fallback;
  }
};

export const chatWithAI = async (prompt) => {
  try {
    const response = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      temperature: 0.5,
      max_tokens: 500,
      messages: [
        {
          role: "system",
          content: "You are a friendly assistant. Respond naturally and casually. Do not use prompt-engineering formatting templates unless the user specifically asks you to improve a prompt.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });
    return response.choices[0]?.message?.content?.trim() || "I'm having trouble responding right now. Please try again.";
  } catch (error) {
    console.error("Groq Chat Error:", error);
    return "I'm having trouble responding right now. Please try again.";
  }
};

// ─────────────────────────────────────────────
// Main improve function (non-streaming)
// Returns { needsClarification, message } if input
// is meaningless, otherwise returns the improved prompt string.
// ─────────────────────────────────────────────
export const improvePromptWithAI = async (prompt, mode = "balanced", isRetry = false, store = null, domain = null) => {
  const memStore = store || createMemoryStore();
  const isUpdate = Boolean(memStore.memory) && !isRetry;

  // NEW: check for meaningless input before hitting the LLM
  if (isMeaninglessInput(prompt, isUpdate)) {
    return buildClarificationResponse(prompt);
  }

  try {
    const { selectedMode, temperature, maxTokens, model, messages } = buildPrompt(
      mode, prompt, isRetry, memStore.memory, domain
    );

    const stream = await groq.chat.completions.create({
      model,
      temperature,
      max_tokens: maxTokens,
      messages,
      stream: true,
    });

    const assembled = await assembleStreamOutput(stream);
    const deduped = removeDuplicateLines(assembled);
    const validated = validatePromptOutput(deduped, selectedMode);

    if (!validated.isValid) {
      console.warn(`Generated prompt failed validation: ${validated.errors.join(" ")}`);
      const fallback = buildDeterministicFallbackPrompt(prompt, deduped);
      if (!isRetry) memStore.memory = fallback;
      return fallback;
    }

    memStore.memory = validated.cleanedPrompt;
    return validated.cleanedPrompt;

  } catch (error) {
    console.error("Groq Error:", error);
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
export const improvePromptWithAIStream = async (prompt, mode = "balanced", isRetry = false, onToken, store = null, domain = null) => {
  const memStore = store || createMemoryStore();
  const isUpdate = Boolean(memStore.memory) && !isRetry;

  // NEW: check for meaningless input before hitting the LLM
  if (isMeaninglessInput(prompt, isUpdate)) {
    const clarification = buildClarificationResponse(prompt);
    // Stream the clarification message token by token so UI stays consistent
    for (const char of clarification.message) {
      onToken(char);
      // small yield to keep streaming feel
      await new Promise(r => setTimeout(r, 0));
    }
    return clarification;
  }

  try {
    const { selectedMode, temperature, maxTokens, model, messages } = buildPrompt(
      mode, prompt, isRetry, memStore.memory, domain
    );

    const stream = await groq.chat.completions.create({
      model,
      temperature,
      max_tokens: maxTokens,
      messages,
      stream: true,
    });

    let fullText = "";

    for await (const chunk of stream) {
      const token = chunk?.choices?.[0]?.delta?.content || "";
      if (token) {
        fullText += token;
        onToken(token);
      }
    }

    const deduped = removeDuplicateLines(fullText);
    const validated = validatePromptOutput(deduped, selectedMode);

    if (!validated.isValid) {
      console.warn(`Generated prompt failed validation: ${validated.errors.join(" ")}`);
      const fallback = buildDeterministicFallbackPrompt(prompt, deduped);
      if (!isRetry) memStore.memory = fallback;
      return fallback;
    }

    memStore.memory = validated.cleanedPrompt;
    return validated.cleanedPrompt;

  } catch (error) {
    console.error("Groq Streaming Error:", error);
    const fallback = buildDeterministicFallbackPrompt(prompt);
    if (!isRetry) memStore.memory = fallback;
    return fallback;
  }
};

// ─────────────────────────────────────────────
// Generate Chat Title
// Returns a short 2-4 word summary for a new chat
// ─────────────────────────────────────────────
export const generateChatTitle = async (prompt) => {
  try {
    const response = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      temperature: 0.3,
      max_tokens: 15,
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
    });

    const title = response?.choices?.[0]?.message?.content?.trim() || "";
    // Clean up any stray quotes the model might have added
    return title.replace(/^["']|["']$/g, "").substring(0, 60);
  } catch (error) {
    console.error("Generate chat title error:", error);
    return null;
  }
};