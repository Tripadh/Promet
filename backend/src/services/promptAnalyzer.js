const ANALYZER_CRITERIA = [
  {
    key: "clarity",
    label: "Clarity",
    weight: 20,
    strength: "Clear and understandable request",
    weakness: "Request lacks clarity",
    suggestion: "Use direct wording so the task is immediately understandable.",
    evaluate: (prompt) => {
      const hasActionVerb = /\b(write|create|generate|build|design|explain|summarize|analyze|improve|list|draft|prepare|plan)\b/i.test(prompt);
      const validLength = prompt.split(/\s+/).length >= 4;
      return Number(hasActionVerb) * 0.6 + Number(validLength) * 0.4;
    },
  },
  {
    key: "context",
    label: "Context",
    weight: 20,
    strength: "Includes useful background context",
    weakness: "Missing background context",
    suggestion: "Add background details such as who this is for, where it will be used, or why it is needed.",
    evaluate: (prompt) => {
      const contextSignals = [
        /\bfor\b/i.test(prompt),
        /\bbecause\b/i.test(prompt),
        /\baudience\b|\bteam\b|\busers\b|\bcustomers\b/i.test(prompt),
        prompt.split(/\s+/).length >= 12,
      ];

      return contextSignals.filter(Boolean).length / contextSignals.length;
    },
  },
  {
    key: "specificity",
    label: "Specificity",
    weight: 20,
    strength: "Task is specific and well defined",
    weakness: "Task is too broad or vague",
    suggestion: "Define the exact deliverable and level of detail you expect.",
    evaluate: (prompt) => {
      const specificitySignals = [
        /\babout\b|\bon\b|\bregarding\b/i.test(prompt),
        /\binclude\b|\bcover\b|\bfocus\b|\bwith\b/i.test(prompt),
        /\b\d+\b/.test(prompt) || prompt.split(/\s+/).length >= 10,
      ];

      return specificitySignals.filter(Boolean).length / specificitySignals.length;
    },
  },
  {
    key: "output_format",
    label: "Output Format",
    weight: 15,
    strength: "Specifies desired output format",
    weakness: "No explicit output format",
    suggestion: "Specify the output format (for example: bullet list, table, JSON, outline, or paragraph).",
    evaluate: (prompt) => {
      const formatSignals = /\bformat\b|\btable\b|\bjson\b|\bbullet\b|\boutline\b|\bsteps\b|\bparagraph\b|\bslides\b|\breport\b/i;
      return formatSignals.test(prompt) ? 1 : 0;
    },
  },
  {
    key: "constraints",
    label: "Constraints",
    weight: 15,
    strength: "Includes useful constraints or rules",
    weakness: "No constraints or limits provided",
    suggestion: "Add constraints such as length, tone, exclusions, deadlines, or mandatory points.",
    evaluate: (prompt) => {
      const constraintSignals = /\bmax\b|\bminimum\b|\bmust\b|\bshould\b|\bwithin\b|\bexactly\b|\bavoid\b|\bdo not\b|\blimit\b/i;
      return constraintSignals.test(prompt) ? 1 : 0;
    },
  },
  {
    key: "structure",
    label: "Structure",
    weight: 10,
    strength: "Prompt includes structural guidance",
    weakness: "Prompt lacks structural guidance",
    suggestion: "Add lightweight structure, such as sections, numbered steps, or key points to cover.",
    evaluate: (prompt) => {
      const structureSignals = [
        /\n\s*[-*]\s+/.test(prompt),
        /\n\s*\d+\.\s+/.test(prompt),
        /\bsection\b|\bpart\b|\bstep\b|\bpoint\b/i.test(prompt),
      ];

      return structureSignals.filter(Boolean).length > 0 ? 1 : 0;
    },
  },
];

const clampRatio = (value) => {
  if (Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(1, value));
};

export const analyzePrompt = (prompt) => {
  const normalizedPrompt = String(prompt || "").trim();

  if (!normalizedPrompt) {
    return {
      score: 0,
      strengths: [],
      weaknesses: ["Prompt is empty"],
      suggestions: ["Provide a clear task request before running prompt improvement."],
    };
  }

  const strengths = [];
  const weaknesses = [];
  const suggestions = new Set();

  let weightedScore = 0;

  ANALYZER_CRITERIA.forEach((criterion) => {
    const ratio = clampRatio(criterion.evaluate(normalizedPrompt));
    weightedScore += criterion.weight * ratio;

    if (ratio >= 0.6) {
      strengths.push(criterion.strength);
      return;
    }

    weaknesses.push(criterion.weakness);
    suggestions.add(criterion.suggestion);
  });

  return {
    score: Math.round(weightedScore),
    strengths,
    weaknesses,
    suggestions: Array.from(suggestions),
  };
};

export { ANALYZER_CRITERIA };