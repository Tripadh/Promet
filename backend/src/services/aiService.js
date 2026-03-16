import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

const SUPPORTED_MODES = ["quick", "auto", "balanced", "expert"];

const REQUIRED_SECTION_CHECKS = {
  quick: [/task/i, /constraint/i, /required output|output format/i],
  auto: [/task/i, /constraint/i, /expected output|output format/i],
  balanced: [/task/i, /constraint/i, /expected output|output format/i],
  expert: [/task/i, /constraint/i, /expected output|output format/i],
};

const COMMON_PROMPT_RULES = `Core rules:
- Always preserve the user's intent.
- Return clean Markdown.
- Ensure sections are complete and not truncated.
- Do not repeat sections or duplicate lines.
- Include this reasoning instruction naturally inside the generated prompt:
  "Before producing the final answer, reason step-by-step about possible approaches and tradeoffs."
- If the task requests a diagram and no format is specified, require Mermaid format.`;

const QUICK_STRUCTURE = `Use exactly 3 short sections:
1. **Task**
2. **Key Constraints**
3. **Required Output**
Keep each section concise.`;

const BALANCED_STRUCTURE = `Use a concise expert structure with these sections:
- **Role**
- **Task Intent**
- **Context**
- **Constraints**
- **Expected Output Format**
- **Reasoning Instruction**`;

const EXPERT_STRUCTURE = `Use a detailed multi-section structure:
- **Role Definition**
- **Task Intent**
- **Context & Inputs**
- **Constraints**
- **Evaluation Criteria**
- **Expected Output Format**
- **Reasoning Instruction**
- **Optional Diagram Requirements**`;

const MODE_TEMPLATES = {
  quick: {
    systemPrompt: `You are Prompt Improver in QUICK mode.

${COMMON_PROMPT_RULES}

${QUICK_STRUCTURE}

Keep the whole prompt compact and practical.`,
    buildUserPrompt: (userPrompt) => `Rewrite this prompt in QUICK mode while keeping it very short but structured:

${userPrompt}`,
    temperature: 0.2,
    maxTokens: 360,
  },

  auto: {
    systemPrompt: `You are Prompt Improver in AUTO mode.

${COMMON_PROMPT_RULES}

Decide structure depth from the provided complexity hint and return one complete prompt.`,
    buildUserPrompt: (userPrompt, context) => `Analyze this prompt and use the following complexity hint:

Complexity: ${context.complexity.level}
Hint: ${context.complexity.hint}

User prompt:

${userPrompt}`,
    temperature: 0.3,
    maxTokens: 950,
  },

  balanced: {
    systemPrompt: `You are Prompt Improver in BALANCED mode.

${COMMON_PROMPT_RULES}

${BALANCED_STRUCTURE}`,
    buildUserPrompt: (userPrompt) => `Rewrite this prompt in BALANCED mode:

${userPrompt}`,
    temperature: 0.28,
    maxTokens: 650,
  },

  expert: {
    systemPrompt: `You are Prompt Improver in EXPERT mode.

${COMMON_PROMPT_RULES}

${EXPERT_STRUCTURE}`,
    buildUserPrompt: (userPrompt) => `Rewrite this prompt in EXPERT mode with professional structure:

${userPrompt}`,
    temperature: 0.22,
    maxTokens: 1200,
  },
};

export const detectComplexity = (userPrompt = "") => {
  const text = String(userPrompt || "").trim();
  const words = text.split(/\s+/).filter(Boolean).length;

  const complexKeywords = [
    "project", "architecture", "timeline", "strategy", "research", "report",
    "roadmap", "multi-step", "design", "risk", "tradeoff", "integration",
    "implementation", "evaluation", "deliverables", "framework", "migration"
  ];

  const scoreFromKeywords = complexKeywords.reduce((score, keyword) => (
    text.toLowerCase().includes(keyword) ? score + 1 : score
  ), 0);

  const hasManySeparators = (text.match(/[;:]/g) || []).length >= 3;
  const score =
    (words > 120 ? 2 : words > 60 ? 1 : 0) +
    (scoreFromKeywords >= 4 ? 2 : scoreFromKeywords >= 2 ? 1 : 0) +
    (hasManySeparators ? 1 : 0);

  if (score >= 4) {
    return {
      level: "complex",
      hint: "Use a detailed multi-section prompt with explicit constraints, deliverables, and output format.",
    };
  }

  if (score >= 2) {
    return {
      level: "moderate",
      hint: "Use a structured prompt with concise sections and clear constraints.",
    };
  }

  return {
    level: "simple",
    hint: "Use a short structured prompt with only essential sections.",
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

    // Deduplicate repeated headings/lines while preserving first occurrence.
    if (seen.has(normalized)) {
      continue;
    }

    seen.add(normalized);
    output.push(line);
  }

  // Collapse too many blank lines.
  return output
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
};

export const validatePromptOutput = (output, mode = "balanced") => {
  const selectedMode = normalizeMode(mode);
  const cleaned = String(output || "").trim();
  const errors = [];

  if (!cleaned) {
    errors.push("Output is empty.");
  }

  if (cleaned.length < 40) {
    errors.push("Output is too short and likely incomplete.");
  }

  if (/\b\d+\.[\sA-Za-z]?$/.test(cleaned) || /\n\s*[-*]\s*$/.test(cleaned) || /\n\s*#+\s*[A-Za-z0-9\s]*$/.test(cleaned)) {
    errors.push("Output appears truncated.");
  }

  const requiredChecks = REQUIRED_SECTION_CHECKS[selectedMode] || REQUIRED_SECTION_CHECKS.balanced;
  for (const check of requiredChecks) {
    if (!check.test(cleaned)) {
      errors.push(`Missing required section matching: ${check}`);
    }
  }

  const headingMatches = cleaned.match(/^\s{0,3}(?:#{1,6}\s+|\*\*)([^\n*]+)(?:\*\*)?/gim) || [];
  const normalizedHeadings = headingMatches.map((h) => h.toLowerCase().replace(/[#*:\s]/g, "")).filter(Boolean);
  const headingSet = new Set();

  for (const heading of normalizedHeadings) {
    if (headingSet.has(heading)) {
      errors.push("Duplicate section detected.");
      break;
    }
    headingSet.add(heading);
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
    case "quick":
      return "Generate a short structured prompt with Task, Key Constraints, and Required Output.";

    case "auto":
      return "Detect complexity and choose structure depth automatically while keeping sections complete and non-duplicative.";

    case "expert":
      return "Generate a detailed professional prompt with explicit sections, constraints, evaluation criteria, and output format instructions.";

    case "balanced":
    default:
      return "Generate a moderately detailed structured prompt with clear task, constraints, reasoning instruction, and expected output format.";
  }
};

export const buildPrompt = (mode, userPrompt) => {
  const selectedMode = normalizeMode(mode);
  const template = MODE_TEMPLATES[selectedMode];
  const complexity = detectComplexity(userPrompt);

  return {
    selectedMode,
    temperature: template.temperature,
    maxTokens: template.maxTokens,
    messages: [
      { role: "system", content: template.systemPrompt },
      { role: "user", content: template.buildUserPrompt(userPrompt, { complexity }) }
    ],
  };
};

const assembleStreamOutput = async (stream) => {
  let fullText = "";

  for await (const chunk of stream) {
    const token = chunk?.choices?.[0]?.delta?.content || "";
    if (token) {
      fullText += token;
    }
  }

  return fullText.trim();
};

const buildDeterministicFallbackPrompt = (userPrompt = "", candidatePrompt = "") => {
  const original = String(userPrompt || "").trim();
  const candidate = String(candidatePrompt || "").trim();
  const refined = candidate || original;

  return `### Task
Rewrite the prompt below while preserving user intent and improving clarity.

### Constraints
- Preserve the original intent.
- Keep wording specific, concise, and actionable.
- Avoid inventing requirements that are not requested.

### Expected Output Format
Return one improved prompt in clean Markdown.

### Refined Prompt
${refined}`.trim();
};

export const improvePromptWithAI = async (prompt, mode = "balanced") => {

  try {
    const { selectedMode, temperature, maxTokens, messages } = buildPrompt(mode, prompt);

    const stream = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      temperature,
      max_tokens: maxTokens,
      messages,
      stream: true
    });

    const assembled = await assembleStreamOutput(stream);
    const deduped = removeDuplicateLines(assembled);
    const validated = validatePromptOutput(deduped, selectedMode);

    if (!validated.isValid) {
      console.warn(`Generated prompt failed validation: ${validated.errors.join(" ")}`);
      return buildDeterministicFallbackPrompt(prompt, deduped);
    }

    return validated.cleanedPrompt;

  } catch (error) {
    console.error("Groq Error:", error);
    return buildDeterministicFallbackPrompt(prompt);
  }

};