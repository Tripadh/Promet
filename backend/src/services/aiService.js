import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

const SUPPORTED_MODES = ["quick", "auto", "balanced", "expert"];

// Per-mode model — expert gets the big model
const MODE_MODELS = {
  quick:    "llama-3.1-8b-instant",
  auto:     "llama-3.1-8b-instant",
  balanced: "llama-3.1-8b-instant",
  expert:   "llama-3.3-70b-versatile",
};

const COMMON_PROMPT_RULES = `Core rules:
- Always preserve the user's original intent.
- Improve clarity, grammar, and effectiveness of the prompt.
- When appropriate, expand the prompt by adding useful context, implied requirements, and additional details that help the AI produce better results.
- Return ONLY the final improved prompt.
- Do NOT add prompt-engineering sections like "Task", "Constraints", "Expected Output Format", etc.
- Do NOT include explanations, analysis, or conversational padding.
- Output must be a single cohesive prompt ready to be pasted directly into an LLM.`;

const MODE_TEMPLATES = {
  quick: {
    systemPrompt: `You are Prompt Improver in QUICK mode.

${COMMON_PROMPT_RULES}

Make the prompt concise and practical. Keep the output under 50 words.

IMPORTANT — Short or vague input rule:
If the input is fewer than 6 words OR has no clear domain/subject (e.g. "build me something", "make a thing", "write something"), do NOT just echo it.
Instead, assume a software/product context and expand it into at least 2 clear, actionable sentences that specify what to build, for whom, and the expected outcome.
Never output fewer than 15 words.`,
    buildUserPrompt: (userPrompt) => `Rewrite this prompt to be short, clear, and immediately actionable:

${userPrompt}`,
    temperature: 0.2,
    maxTokens: 200,
  },

  auto: {
    systemPrompt: `You are Prompt Improver in AUTO mode.

${COMMON_PROMPT_RULES}

Use the complexity hint to determine the level of detail and expansion:
- For simple prompts: slightly expand and clarify intent.
- For moderate prompts: generate a detailed prompt clarifying requirements and adding context.
- For complex prompts: produce highly descriptive prompts outlining expectations and deep context.
The result should adapt to input complexity and can reach 10+ lines when the input is complex. Do not limit the prompt to a specific number of sentences.

IMPORTANT — Vague/ambiguous input rule:
If the complexity hint is "vague" OR the input is fewer than 6 words with no clear domain, treat it as MODERATE complexity.
Make reasonable assumptions about what the user likely wants (e.g. a software tool, product, or creative output), state those assumptions clearly in the improved prompt, and expand with useful context and requirements.
Never output fewer than 3 sentences for vague inputs.`,
    buildUserPrompt: (userPrompt, context) => `Analyze this prompt and use the following complexity hint:

Complexity: ${context.complexity.level}
Hint: ${context.complexity.hint}

User prompt:

${userPrompt}`,
    temperature: 0.3,
    maxTokens: 500,
  },

  balanced: {
    systemPrompt: `You are Prompt Improver in BALANCED mode.

${COMMON_PROMPT_RULES}

Expand the prompt intelligently. Focus on clarifying requirements, improving wording, adding helpful details, and expanding context where appropriate.
Structure your output with clear numbered requirements or bullet points where it helps readability.
Produce a reasonably detailed prompt, typically around 8–12 lines for moderate inputs. Do not restrict length to a specific number of sentences, and avoid unnecessary repetition or filler.`,
    buildUserPrompt: (userPrompt) => `Rewrite this prompt to be balanced, clear, and highly effective. Add useful context and structure requirements clearly:

${userPrompt}`,
    temperature: 0.4,
    maxTokens: 450,
  },

  expert: {
    systemPrompt: `You are Prompt Improver in EXPERT mode.

${COMMON_PROMPT_RULES}

Your job is to transform the user's prompt into a highly advanced, architecturally rich, and technically detailed prompt suitable for expert-level AI responses.

Guidelines:
- Expand the request significantly with deeper engineering context.
- Include architecture considerations, scalability concerns, integration points, and operational aspects when relevant.
- Add implied requirements that an experienced software architect would consider.
- Describe technologies, workflows, system components, and interactions where appropriate.
- Ensure the prompt is noticeably more detailed than BALANCED mode.
- The output should resemble a professional system design or engineering specification.
- IMPORTANT: Format the output in clear paragraphs separated by blank lines. Do NOT write a single run-on sentence or paragraph. Break the output into logical sections: overview, technical requirements, architecture, and deliverables.`,
    buildUserPrompt: (userPrompt) => `Improve the following prompt into a highly detailed expert-level engineering request.

Expand the prompt with architectural thinking, advanced technical considerations, system components, integration concerns, scalability considerations, and professional context while preserving the original intent.

Format the output as multiple short paragraphs — NOT one long run-on sentence. Each paragraph should cover a distinct aspect: overview, technical stack, architecture, operational concerns, and deliverables.

Prompt:
${userPrompt}`,
    temperature: 0.22,
    maxTokens: 900,
  },
};

// ─────────────────────────────────────────────
// NEW: Meaningless input detection
// Returns true if the input has no real intent —
// random words, gibberish, single chars, or pure
// filler with zero actionable meaning.
// ─────────────────────────────────────────────
export const isMeaninglessInput = (text = "") => {
  const trimmed = String(text || "").trim();

  // Empty or just whitespace
  if (!trimmed) return true;

  // Single character or just punctuation/numbers
  if (trimmed.length <= 2) return true;

  // Only non-alphabetic characters
  if (!/[a-zA-Z]{2,}/.test(trimmed)) return true;

  const words = trimmed.split(/\s+/).filter(Boolean);

  // Gibberish: very short AND no recognizable English words
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

  // STRICT GIBBERISH CHECK: If 70%+ of words are unknown AND no real English word present
  const recognizedRatio = knownWordCount / words.length;
  if (words.length > 2 && recognizedRatio < 0.3) {
    // 70%+ unknown words with NO known English words = gibberish
    // Example: "Injbihvug hijnobuivhgu fhvjhkijgukhfmgnmhj" (0 known words)
    return true;
  }

  // Secondary check: words with unusual letter patterns
  if (words.length > 1 && recognizedRatio < 0.5) {
    // At least 50% unknown - check if those unknown words look realistic
    const unknownWords = words.filter(w => !commonWords.has(w.toLowerCase()));
    let unrealisticWords = 0;
    
    for (const word of unknownWords) {
      const cleaned = word.toLowerCase().replace(/[^a-z]/g, '');
      if (cleaned.length < 2) continue;
      
      // Check for unrealistic English patterns
      // - 4+ consonants in a row (very rare in English)
      // - Less than 15% vowels (too consonant-heavy)
      // - More than 70% consonants (unrealistic)
      const consonantClusters = (cleaned.match(/[bcdfghjklmnpqrstvwxyz]{4,}/g) || []).length;
      const vowels = cleaned.match(/[aeiou]/g) || [];
      const vowelRatio = vowels.length / cleaned.length;
      
      if (consonantClusters > 0 || vowelRatio < 0.15) {
        unrealisticWords++;
      }
    }
    
    // If 75%+ of unknown words are unrealistic, it's gibberish
    if (unknownWords.length > 0 && unrealisticWords / unknownWords.length > 0.75) {
      return true;
    }
  }

  // Pure filler: all words are generic fillers with zero domain signal
  const fillerOnlyPatterns = [
    /^(do\s+)?something$/i,
    /^(make|build|create|write|give|do)\s+(me\s+)?(something|anything|stuff|a\s+thing)$/i,
    /^(help|assist)\s+(me\s+)?please$/i,
    /^(just\s+)?(do|make|write|build)\s+it$/i,
    /^idk$/i,
    /^(hi|hey|hello|ok|okay|yes|no|maybe|sure|lol|wtf|hmm+|ugh|meh)$/i,
    /^[a-z]{1,3}$/i,
    /^(.)\1{2,}$/i, // repeated single char like "aaaa", "????"
    // NEW: Vague action + vague object + optional adjectives
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
    message: `Could you be more specific? Your prompt "${userPrompt.trim()}" is too vague for me to improve effectively.\n\nTry answering one or more of these:\n- What do you want to build or create?\n- Who is it for?\n- What should it do?\n\nExample: "build me a task manager app for teams" or "write a professional email declining a job offer".`,
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
    case "auto":    return "Detect complexity and choose the appropriate level of detail automatically.";
    case "expert":  return "Generate a highly detailed, professional, and comprehensive prompt.";
    case "balanced":
    default:        return "Generate a clear, moderately detailed prompt.";
  }
};

export const buildPrompt = (mode, userPrompt, isRetry = false, previousPrompt = null) => {
  const selectedMode = normalizeMode(mode);
  const template = MODE_TEMPLATES[selectedMode];
  const complexity = detectComplexity(userPrompt);

  let systemPrompt = template.systemPrompt;

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
// Main improve function (non-streaming)
// Returns { needsClarification, message } if input
// is meaningless, otherwise returns the improved prompt string.
// ─────────────────────────────────────────────
export const improvePromptWithAI = async (prompt, mode = "balanced", isRetry = false, store = null) => {
  const memStore = store || createMemoryStore();

  // NEW: check for meaningless input before hitting the LLM
  if (isMeaninglessInput(prompt)) {
    return buildClarificationResponse(prompt);
  }

  try {
    const { selectedMode, temperature, maxTokens, model, messages } = buildPrompt(
      mode, prompt, isRetry, memStore.memory
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
export const improvePromptWithAIStream = async (prompt, mode = "balanced", isRetry = false, onToken, store = null) => {
  const memStore = store || createMemoryStore();

  // NEW: check for meaningless input before hitting the LLM
  if (isMeaninglessInput(prompt)) {
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
      mode, prompt, isRetry, memStore.memory
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