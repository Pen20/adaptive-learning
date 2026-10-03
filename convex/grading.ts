import { action, internalAction } from "./_generated/server";
import { errorMessage } from "./errors";
import { v } from "convex/values";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { api, internal } from "./_generated/api";
import { normalizeAiDiagnosis } from "./aiDiagnosis";
import { buildDidacticInterpretation } from "./didactics";
import type {
  AiDiagnosisResult,
  CasLayerResult,
  DidacticLayerResult,
  PipelineDiagnostics,
} from "./layerTypes";
import { getTopicEvaluationFiche } from "../src/data/pedagogy";
import type { ExercisePedagogyInstance } from "../src/data/pedagogy";
import {
  analyzeSingularParameterReasoning,
  verifyNumericDeterminantReasoning,
} from "./determinantReasoning";

function formatCasAnswer(value: string | null): string {
  if (!value) return "the verified answer";
  // Convert list notation [a, b, ...] → set notation \{a, b, ...\} for display
  const display =
    value.startsWith("[") && value.endsWith("]")
      ? `\\{${value.slice(1, -1)}\\}`
      : value;
  return `\\(${display}\\)`;
}

type CasResult = {
  isComputable: boolean;
  groundTruth: string | null;
  expression?: string | null;
  description?: string;
};

type CasEquivalence = {
  isEquivalent: boolean | null;
  casChecked: boolean;
};

type NormalizedGradingResult = {
  grade: number;
  finalAnswerScore: number;
  reasoningScore: number;
  feedback: string;
  errorType: string;
  isOptimized: true;
};

type PipelineCompatibleResult = {
  grade: number;
  finalAnswerScore?: number;
  reasoningScore?: number;
  feedback: string;
  errorType?: string;
  isOptimized: true;
};

function normalizeHalfPointScore(value: unknown) {
  const numeric = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numeric) && numeric >= 0.5 ? 0.5 : 0;
}

function normalizeTotalGrade(value: unknown) {
  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numeric)) return 0;
  if (numeric >= 0.75) return 1;
  if (numeric >= 0.25) return 0.5;
  return 0;
}

function addScores(finalAnswerScore: number, reasoningScore: number) {
  return Number((finalAnswerScore + reasoningScore).toFixed(2));
}

function finalAnswerScoreFromCas(
  casResult: CasResult,
  casEquivalence: CasEquivalence,
) {
  if (!casResult.isComputable || !casEquivalence.casChecked) return null;
  if (casEquivalence.isEquivalent === true) return 0.5;
  if (casEquivalence.isEquivalent === false) return 0;
  return null;
}

function errorTypeFromScores(
  finalAnswerScore: number,
  reasoningScore: number,
  fallback = "",
) {
  if (finalAnswerScore === 0.5 && reasoningScore === 0.5) return "";
  if (finalAnswerScore === 0 && reasoningScore === 0) {
    return fallback || "Incorrect mathematical reasoning";
  }
  if (finalAnswerScore === 0) return "Incorrect Final Answer";
  if (reasoningScore === 0) return "Reasoning Issue";
  return fallback;
}

function buildFinalAnswerSection(
  casResult: CasResult,
  casEquivalence: CasEquivalence,
) {
  const correctAnswer = formatCasAnswer(casResult.groundTruth);

  if (casEquivalence.isEquivalent === true) {
    return `**Final Answer:** \\(0.5/0.5\\) Your final answer is correct; it matches the CAS-verified answer ${correctAnswer}.`;
  }

  if (casEquivalence.isEquivalent === false) {
    return `**Final Answer:** \\(0/0.5\\) Your final answer does not match the CAS-verified answer ${correctAnswer}. Compare your final value, signs, and listed solutions with this verified result.`;
  }

  return `**Final Answer:** The CAS verified answer is ${correctAnswer}, but I could not automatically match your final answer to it. I used the same grading rubric below to judge whether your final answer is equivalent.`;
}

function buildVerdictSection(finalAnswerScore: number, reasoningScore: number) {
  const total = addScores(finalAnswerScore, reasoningScore);

  if (total === 1) {
    return "**Verdict:** Your score is \\(1/1\\): you earned \\(0.5\\) for the final answer and \\(0.5\\) for the reasoning steps. Both parts are correct, so this is complete.";
  }

  if (finalAnswerScore === 0.5 && reasoningScore === 0) {
    return "**Verdict:** Your score is \\(0.5/1\\): you earned the final-answer point, but the reasoning point is missing or not mathematically sound yet. Keep the answer, then repair the mathematical divergence identified above so your method supports it.";
  }

  if (finalAnswerScore === 0 && reasoningScore === 0.5) {
    return "**Verdict:** Your score is \\(0.5/1\\): your reasoning has useful mathematical structure, but the final answer does not match the verified result. Use the reasoning feedback to correct the last computation or final statement.";
  }

  return "**Verdict:** Your score is \\(0/1\\): the final answer is not correct and the reasoning does not yet justify the correct result. Start from the mistake identified above, then recompute the final answer carefully.";
}

function replaceStructuredSection(
  feedback: string,
  label: "Final Answer" | "Reasoning steps" | "Verdict",
  replacement: string,
) {
  const sectionPattern = new RegExp(
    `\\*\\*${label}:\\*\\*[\\s\\S]*?(?=\\n\\n\\*\\*(?:Final Answer|Reasoning steps|Verdict):\\*\\*|$)`,
    "i",
  );

  if (sectionPattern.test(feedback)) {
    return feedback.replace(sectionPattern, replacement);
  }

  return `${replacement}\n\n${feedback}`;
}

export function replaceVerdictWithSingleSummary(
  feedback: string,
  finalAnswerScore: number,
  reasoningScore: number,
) {
  return replaceStructuredSection(
    feedback,
    "Verdict",
    buildVerdictSection(finalAnswerScore, reasoningScore),
  );
}

function enforceHalfPointStructure(
  result: NormalizedGradingResult,
  casResult: CasResult,
  casEquivalence: CasEquivalence,
): NormalizedGradingResult {
  const casFinalAnswerScore = finalAnswerScoreFromCas(
    casResult,
    casEquivalence,
  );
  const finalAnswerScore =
    casFinalAnswerScore === null
      ? result.finalAnswerScore
      : casFinalAnswerScore;
  const reasoningScore = result.reasoningScore;
  const grade = addScores(finalAnswerScore, reasoningScore);

  let feedback = normalizeFeedbackStructure(result.feedback);

  if (casFinalAnswerScore !== null) {
    feedback = replaceStructuredSection(
      feedback,
      "Final Answer",
      buildFinalAnswerSection(casResult, casEquivalence),
    );
  }

  feedback = replaceVerdictWithSingleSummary(
    feedback,
    finalAnswerScore,
    reasoningScore,
  );

  return {
    grade,
    finalAnswerScore,
    reasoningScore,
    feedback: normalizeFeedbackStructure(feedback),
    errorType: errorTypeFromScores(
      finalAnswerScore,
      reasoningScore,
      result.errorType,
    ),
    isOptimized: true,
  };
}

function incorrectFinalAnswerFeedback(groundTruth: string | null) {
  const correctAnswer = formatCasAnswer(groundTruth);
  return {
    grade: 0,
    feedback: `**Final Answer:** \\(0/0.5\\) Your final answer is incorrect. The verified correct answer is ${correctAnswer}; update your final answer to match this value.\n\n**Reasoning steps:** \\(0/0.5\\) I could not reliably judge the reasoning steps because the model feedback was unavailable.\n\n**Verdict:** Your score is \\(0/1\\). Recalculate carefully and compare your final result with the CAS-verified answer.`,
    errorType: "Incorrect Answer",
    isOptimized: true,
  };
}

function normalizeSecondPersonFeedback(feedback: string) {
  return feedback
    .replace(/\bThe student has\b/g, "You have")
    .replace(/\bthe student has\b/g, "you have")
    .replace(/\bThe student is\b/g, "You are")
    .replace(/\bthe student is\b/g, "you are")
    .replace(/\bThe student needs\b/g, "You need")
    .replace(/\bthe student needs\b/g, "you need")
    .replace(/\bThe student should\b/g, "You should")
    .replace(/\bthe student should\b/g, "you should")
    .replace(/\bThe student wrote\b/g, "You wrote")
    .replace(/\bthe student wrote\b/g, "you wrote")
    .replace(/\bThe student gave\b/g, "You gave")
    .replace(/\bthe student gave\b/g, "you gave")
    .replace(/\bThe student received\b/g, "You received")
    .replace(/\bthe student received\b/g, "you received")
    .replace(/\bThe student's\b/g, "Your")
    .replace(/\bthe student's\b/g, "your")
    .replace(/\bThe student\b/g, "You")
    .replace(/\bthe student\b/g, "you");
}

function normalizeFeedbackStructure(feedback: string) {
  return normalizeSecondPersonFeedback(feedback)
    .replace(/(^|\n)(Final Answer|Answer):\s*/gi, "$1**Final Answer:** ")
    .replace(
      /(^|\n)(Reasoning steps|Reasoning Steps|Reasoning):\s*/gi,
      "$1**Reasoning steps:** ",
    )
    .replace(/(^|\n)(Verdict):\s*/gi, "$1**Verdict:** ")
    .replace(/\*\*\s*(Final Answer|Answer)\s*:\s*\*\*/gi, "**Final Answer:**")
    .replace(
      /\*\*\s*(Reasoning steps|Reasoning Steps|Reasoning)\s*:\s*\*\*/gi,
      "**Reasoning steps:**",
    )
    .replace(/\*\*\s*Verdict\s*:\s*\*\*/gi, "**Verdict:**");
}

function parseJsonObject(text: string) {
  const cleaned = text
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();
  if (!cleaned) return null;

  try {
    return JSON.parse(cleaned);
  } catch {
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    try {
      return JSON.parse(jsonMatch[0]);
    } catch {
      return null;
    }
  }
}

/**
 * Structural view of a Gemini `generateContent` response: only the members this
 * file reads, so the SDK's own types are not needed at the call sites.
 */
type GeminiPart = { text?: string; thought?: boolean };
type GeminiResponse = {
  text?: () => string;
  candidates?: Array<{ content?: { parts?: GeminiPart[] } }>;
};

function extractGeminiText(response: GeminiResponse) {
  try {
    const text = response.text?.();
    if (text?.trim()) return text;
  } catch {
    // Fall back to filtering raw candidate parts below.
  }

  // Gemini 2.5 Flash includes thinking parts (thought: true) — skip them
  return (
    response.candidates?.[0]?.content?.parts
      ?.filter((part) => !part.thought)
      ?.map((part) => part.text ?? "")
      .join("")
      .trim() ?? ""
  );
}

/**
 * Few-shot example shapes. The frozen-pool query returns rows validated as
 * v.any(), so its element type is unknown at the call site; these describe the
 * fields the prompt builder actually reads.
 */
type ExpertCorrectionExample = {
  correctedFeedback?: string;
  correctedGrade?: number;
};

type OutcomeValidatedExample = {
  judgeFeedback?: string;
  aiFeedback?: string;
  outcomeReward?: number;
  grade?: number;
};

/** The JSON object an LLM grader returns, before validation. */
type RawGradingContent = {
  feedback?: unknown;
  grade?: unknown;
  finalAnswerScore?: unknown;
  reasoningScore?: unknown;
  errorType?: unknown;
};

function normalizeGradingResult(content: RawGradingContent): NormalizedGradingResult {
  const rawFeedback =
    typeof content.feedback === "string"
      ? content.feedback
      : String(content.feedback ?? "");
  const hasScores =
    content.finalAnswerScore !== undefined ||
    content.reasoningScore !== undefined;
  const normalizedGrade = normalizeTotalGrade(content.grade);
  const finalAnswerScore = hasScores
    ? normalizeHalfPointScore(content.finalAnswerScore)
    : normalizedGrade >= 0.5
      ? 0.5
      : 0;
  const reasoningScore = hasScores
    ? normalizeHalfPointScore(content.reasoningScore)
    : normalizedGrade === 1
      ? 0.5
      : 0;
  const grade = hasScores
    ? addScores(finalAnswerScore, reasoningScore)
    : normalizedGrade;

  return {
    grade,
    finalAnswerScore,
    reasoningScore,
    feedback: normalizeFeedbackStructure(rawFeedback),
    errorType:
      grade === 1 ? "" : typeof content.errorType === "string" ? content.errorType : "",
    isOptimized: true,
  };
}

function hasAssessableReasoning(reasoning: string) {
  const compact = reasoning.trim();
  if (compact.length < 12) return false;

  const mathSignals = [
    /=/,
    /\\frac|\\det|\\begin|\\sqrt|\\int|\\lim|\\cdot|\\times/,
    /\b(det|solve|expand|substitute|therefore|because|since|matrix|row|column|minor|cofactor|cramer)\b/i,
    /[+\-*/^]/,
  ];

  return mathSignals.some((pattern) => pattern.test(compact));
}

function isLinearAlgebraTopic(topicName: string) {
  return /linear|quadratic|systems?|equations?|eigen|determinant|matri|independence|gram|inner product|axiom|polynomial/i.test(
    topicName,
  );
}

function buildLinearAlgebraReasoningInstruction(topicName: string) {
  if (!isLinearAlgebraTopic(topicName)) return "";

  return `
    LINEAR ALGEBRA REASONING DIAGNOSIS:
    - Read the student's entire reasoning as one connected argument before judging the reasoning point. Do NOT decide from one phrase, one line, or one notation choice in isolation.
    - If the reasoningScore is 0, the "**Reasoning steps:**" section MUST identify the root cause that lost the reasoning mark: the earliest mathematical break that makes the method unable to justify the answer.
    - Name both the local step and the underlying concept, e.g. determinant setup vs cofactor/sign expansion, characteristic polynomial setup vs root solving, row-operation equivalence, span/linear-combination logic, eigenvector equation, Gram-Schmidt projection, or inner-product axiom.
    - Accept equivalent wording and condensed valid work when the full sentence or full chain shows the correct idea. Do not penalize merely because the student used different words, tuple notation, column-vector notation, or a different valid order of steps.
    - When several later lines are consequences of the same earlier mistake, explain that root mistake instead of listing symptoms.`;
}

function casBackedFallbackFeedback(
  casResult: { isComputable: boolean; groundTruth: string | null },
  casEquivalence: { isEquivalent: boolean | null; casChecked: boolean },
  reasoning: string,
): PipelineCompatibleResult {
  if (!casResult.isComputable || !casEquivalence.casChecked) {
    return {
      grade: 0,
      feedback:
        "**Final Answer:** I could not verify the final answer automatically.\n\n**Reasoning steps:** Gemini returned an unreadable response, so no reliable reasoning judgment was available.\n\n**Verdict:** Your score is \\(0/1\\) because the grading system could not safely score either half. Please try again or switch models for this submission.",
      errorType: "Parse Error",
      isOptimized: true,
    };
  }

  if (casEquivalence.isEquivalent === false) {
    const reasoningScore = hasAssessableReasoning(reasoning) ? 0.5 : 0;
    const grade = addScores(0, reasoningScore);
    return {
      grade,
      feedback: `**Final Answer:** \\(0/0.5\\) Your final answer does not match the CAS-verified answer ${formatCasAnswer(casResult.groundTruth)}.\n\n**Reasoning steps:** \\(${reasoningScore}/0.5\\) ${reasoningScore === 0.5 ? "Your reasoning contains enough mathematical structure to review, but the final value still needs correction." : "Your reasoning is too brief to assess the method."}\n\n${buildVerdictSection(0, reasoningScore)}`,
      errorType: errorTypeFromScores(0, reasoningScore),
      isOptimized: true,
    };
  }

  if (!hasAssessableReasoning(reasoning)) {
    return {
      grade: 0.5,
      feedback: `**Final Answer:** \\(0.5/0.5\\) Your final answer is correct; it matches the CAS-verified answer ${formatCasAnswer(casResult.groundTruth)}.\n\n**Reasoning steps:** \\(0/0.5\\) Your reasoning is too brief to assess the method.\n\n${buildVerdictSection(0.5, 0)}`,
      errorType: "Thin Reasoning",
      isOptimized: true,
    };
  }

  return {
    grade: 1,
    feedback: `**Final Answer:** \\(0.5/0.5\\) Your final answer is correct; it matches the CAS-verified answer ${formatCasAnswer(casResult.groundTruth)}.\n\n**Reasoning steps:** \\(0.5/0.5\\) Your reasoning includes enough mathematical work to support the answer.\n\n${buildVerdictSection(0.5, 0.5)}`,
    errorType: "",
    isOptimized: true,
  };
}

function enforceCasFinalAnswer(
  result: { grade: number; feedback: string; errorType?: string },
  casResult: { isComputable: boolean; groundTruth: string | null },
  casEquivalence: { isEquivalent: boolean | null; casChecked: boolean },
) {
  if (!casResult.isComputable || !casEquivalence.casChecked) {
    return {
      ...result,
      feedback: normalizeFeedbackStructure(result.feedback),
    };
  }

  if (casEquivalence.isEquivalent === false) {
    return incorrectFinalAnswerFeedback(casResult.groundTruth);
  }

  if (casEquivalence.isEquivalent === true) {
    const answerHeader = `**Final Answer:** Your final answer is correct; it matches the verified answer ${formatCasAnswer(casResult.groundTruth)}.`;
    const feedback = result.feedback || "";
    const reconciledFeedback = feedback.includes("**Reasoning steps:**")
      ? feedback.replace(
          /\*\*Final Answer:\*\*[\s\S]*?(?=\n\n\*\*Reasoning steps:\*\*)/,
          answerHeader,
        )
      : `${answerHeader}\n\n${feedback}`;

    return {
      ...result,
      feedback: normalizeFeedbackStructure(reconciledFeedback),
      errorType:
        result.grade === 1 ? "" : result.errorType || "Reasoning Issue",
    };
  }

  return {
    ...result,
    feedback: normalizeFeedbackStructure(result.feedback),
  };
}

function buildCasLayerResult(
  casResult: CasResult,
  casEquivalence: CasEquivalence,
): CasLayerResult {
  return {
    isComputable: casResult.isComputable,
    checked: casEquivalence.casChecked,
    equivalent: casEquivalence.isEquivalent,
    expectedAnswer: casResult.groundTruth,
    expression: casResult.expression ?? null,
    description: casResult.description ?? "",
    confidence: casEquivalence.casChecked
      ? 0.95
      : casResult.isComputable
        ? 0.75
        : 0.25,
  };
}

function appendDidacticFeedback(
  feedback: string,
  didacticLayer: DidacticLayerResult,
) {
  if (!didacticLayer.feedback) return normalizeFeedbackStructure(feedback);
  if (feedback.includes("**Learning focus:**")) {
    return normalizeFeedbackStructure(feedback);
  }
  return normalizeFeedbackStructure(`${feedback}\n\n${didacticLayer.feedback}`);
}

function attachPipelineDiagnostics(
  result: PipelineCompatibleResult,
  topicName: string,
  casResult: CasResult,
  casEquivalence: CasEquivalence,
  aiContent: unknown,
  exercisePedagogy?: ExercisePedagogyInstance | null,
) {
  const casLayer = buildCasLayerResult(casResult, casEquivalence);
  const reasoningScore =
    result.reasoningScore !== undefined
      ? normalizeHalfPointScore(result.reasoningScore)
      : result.grade === 1
        ? 0.5
        : 0;
  const aiLayer: AiDiagnosisResult = normalizeAiDiagnosis(
    aiContent,
    { topicName, errorType: result.errorType, reasoningScore, casLayer },
    exercisePedagogy
      ? {
          ficheId: exercisePedagogy.ficheId,
          ficheVersion: exercisePedagogy.ficheVersion,
          taskTypeId: exercisePedagogy.taskTypeId,
        }
      : undefined,
  );
  const didacticLayer = buildDidacticInterpretation({
    topicName,
    grade: result.grade,
    casLayer,
    aiDiagnosis: aiLayer,
  });
  const layerDiagnostics: PipelineDiagnostics = {
    casLayer,
    aiLayer,
    didacticLayer,
  };
  const misconceptionId = aiLayer.pedagogicalEvaluation?.misconceptionId;
  const canonicalMisconception = misconceptionId
    ? getTopicEvaluationFiche(topicName)?.misconceptions.find(
        (item) => item.misconceptionId === misconceptionId,
      )
    : undefined;
  if (aiLayer.pedagogicalEvaluation && canonicalMisconception) {
    aiLayer.pedagogicalEvaluation.misconceptionLabel =
      canonicalMisconception.label;
  }

  return {
    ...result,
    feedback: exercisePedagogy
      ? removeNumberedStepReferences(
          appendDidacticFeedback(result.feedback, didacticLayer),
        )
      : appendDidacticFeedback(result.feedback, didacticLayer),
    errorType:
      result.grade === 1
        ? ""
        : canonicalMisconception?.label ||
          aiLayer.pedagogicalEvaluation?.misconceptionLabel ||
          aiLayer.misconception ||
          aiLayer.errorType ||
          result.errorType ||
          "Unclassified mathematical error",
    techniqueUsed: aiLayer.techniqueUsed,
    misconception: result.grade === 1 ? "" : aiLayer.misconception,
    conceptTags: didacticLayer.conceptTags,
    praxeology: didacticLayer.praxeology,
    profileUpdate: didacticLayer.profileUpdate,
    layerDiagnostics,
    pedagogicalEvaluation: aiLayer.pedagogicalEvaluation,
  };
}

function reconcileVerifiedDeterminantReasoning(
  result: NormalizedGradingResult,
  content: Record<string, unknown>,
  reasoning: string,
  exercisePedagogy: ExercisePedagogyInstance | null,
) {
  const singularExpectations =
    exercisePedagogy?.taskTypeId === "DET-SINGULAR-2X2"
      ? exercisePedagogy.expectedIntermediateResults?.["two-by-two-formula"]
      : undefined;
  if (
    singularExpectations?.determinantExpression &&
    singularExpectations.parameterValue
  ) {
    const status = analyzeSingularParameterReasoning(
      reasoning,
      singularExpectations.determinantExpression,
      singularExpectations.parameterValue,
    );
    if (status === "correct_but_incomplete") {
      const feedback = replaceStructuredSection(
        result.feedback,
        "Reasoning steps",
        `**Reasoning steps:** \\(0/0.5\\) Your determinant expression \\(${singularExpectations.determinantExpression}\\) is correct, but your reasoning stops before applying the singularity condition. Set this expression equal to zero, then solve for the parameter.`,
      );
      return {
        result: {
          ...result,
          reasoningScore: 0,
          grade: result.finalAnswerScore,
          feedback,
          errorType: "Incomplete singularity reasoning",
        },
        content: {
          ...content,
          reasoningScore: 0,
          grade: result.finalAnswerScore,
          errorType: "Incomplete singularity reasoning",
          techniqueId: "two-by-two-formula",
          techniqueUsed: "Two-by-two determinant equation",
          reasoningStatus: "correct_but_incomplete",
          misconception: "Incomplete singularity reasoning",
          firstIncorrectStepId: "set-zero",
          misconceptionId: "DET-M6",
          remediationPrompt:
            "Use the singularity condition by setting your determinant expression equal to zero, then solve for the parameter.",
        },
      };
    }
    if (status === "correct") {
      const reasoningScore = 0.5;
      return {
        result: {
          ...result,
          reasoningScore,
          grade: addScores(result.finalAnswerScore, reasoningScore),
          feedback: replaceStructuredSection(
            result.feedback,
            "Reasoning steps",
            "**Reasoning steps:** \\(0.5/0.5\\) Your determinant expression, singularity condition, and parameter solution are mathematically correct.",
          ),
          errorType: result.finalAnswerScore === 0.5 ? "" : "Incorrect Final Answer",
        },
        content: {
          ...content,
          reasoningScore,
          grade: addScores(result.finalAnswerScore, reasoningScore),
          errorType: result.finalAnswerScore === 0.5 ? "" : "Incorrect Final Answer",
          techniqueId: "two-by-two-formula",
          techniqueUsed: "Two-by-two determinant equation",
          reasoningStatus: "correct",
          misconception: "",
          firstIncorrectStepId: "",
          misconceptionId: "",
          remediationPrompt: "",
        },
      };
    }
  }

  const expected =
    exercisePedagogy?.taskTypeId === "DET-COMPUTE-3X3"
      ? exercisePedagogy.expectedIntermediateResults?.["cofactor-expansion"]
          ?.finalDeterminant
      : undefined;
  if (!expected || !verifyNumericDeterminantReasoning(reasoning, expected)) {
    return { result, content };
  }

  const finalAnswerScore = result.finalAnswerScore;
  const reasoningScore = 0.5;
  const feedback = replaceStructuredSection(
    result.feedback,
    "Reasoning steps",
    "**Reasoning steps:** \\(0.5/0.5\\) Your cofactor expansion, minor calculations, and signs form a valid calculation of the determinant. Your notation is condensed but mathematically correct.",
  );
  const correctedContent = {
    ...content,
    reasoningScore,
    grade: addScores(finalAnswerScore, reasoningScore),
    errorType: finalAnswerScore === 0.5 ? "" : "Incorrect Final Answer",
    misconception: "",
    reasoningStatus: "correct",
    firstIncorrectStepId: "",
    misconceptionId: "",
    remediationPrompt: "",
    criterionResults: Array.isArray(content.criterionResults)
      ? content.criterionResults.map((criterion) => ({
          ...(typeof criterion === "object" && criterion ? criterion : {}),
          status: "satisfied",
        }))
      : [],
  };

  return {
    result: {
      ...result,
      reasoningScore,
      grade: addScores(finalAnswerScore, reasoningScore),
      feedback,
      errorType: finalAnswerScore === 0.5 ? "" : "Incorrect Final Answer",
    },
    content: correctedContent,
  };
}

export const INTERMEDIATE_EQUIVALENCE_RULE = `
INTERMEDIATE-EXPRESSION EQUIVALENCE CHECK (MANDATORY):
- Before marking any intermediate expression as incorrect, simplify both the learner's expression and the expected expression mentally or with the supplied exercise values.
- Multiplying or dividing by 1, adding or subtracting 0, redundant parentheses, reordered addition or multiplication, expanded/factored forms, and equivalent fractions do NOT create a reasoning divergence.
- In particular, 2k - 2 and 2k - 2 × 1 are exactly equivalent; never describe one as the correction of the other.
- Only report a divergence when you can state a non-zero mathematical difference that changes the value, solution set, sign, or logical condition.
- If the expressions are equivalent, award the reasoning credit supported by the work. You may suggest simplification as a non-penalizing note, but errorType, misconceptionId, firstIncorrectStepId, and remediationPrompt must not identify that notation as an error.
`;

export function removeNumberedStepReferences(feedback: string) {
  return feedback
    .replace(/\b(?:at|in|from)\s+Step\s+\d+\s*[\u2014\u2013:-]?\s*/gi, "where ")
    .replace(/\bStep\s+\d+\s*[\u2014\u2013:-]?\s*/gi, "")
    .replace(/Your reasoning (?:first )?diverges where\s*/gi, "Your reasoning diverges when ")
    .replace(/\s{2,}/g, " ")
    .replace(/ \n/g, "\n");
}

export const gradeSubmission = action({
  // ... (omitting for brevity as I'm replacing the whole file structure or a large chunk)
  args: {
    problemStatement: v.string(),
    studentAnswer: v.string(),
    reasoning: v.string(),
    model: v.string(),
    topicName: v.string(),
    answerFormatInstruction: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    try {
      const answerFormatContext = args.answerFormatInstruction
        ? `Expected Final Answer Format: ${args.answerFormatInstruction}
      Treat any listed alternative formats as semantically equivalent. If the problem asks for multiple values, set notation is accepted and order does not matter.`
        : "";
      const linearAlgebraReasoningInstruction =
        buildLinearAlgebraReasoningInstruction(args.topicName);

      const prompt = `
    You are a strict but helpful math tutor. Grade the following student submission for correctness and logic.
    Address the student directly in the second person (e.g., "Your answer is..."). Never refer to the learner as "the student".

    Problem: ${args.problemStatement}
    Student's Final Answer: ${args.studentAnswer}
    Student's Reasoning: ${args.reasoning}
    ${answerFormatContext}
    ${linearAlgebraReasoningInstruction}

    IMPORTANT: If "Student's Final Answer" is empty or missing, you MUST identify their intended final answer from their "Reasoning" steps. If no final answer can be found anywhere, the grade should be 0.

    IMPORTANT: Grade 1 is ONLY awarded when the final answer is correct AND the reasoning is mathematically sound and non-trivial. A correct answer with thin, vague, or missing reasoning MUST receive grade 0. Feedback MUST then state: "Your answer is correct, but you need to show your full reasoning steps so I can assess your understanding and methodology."

    IMPORTANT: STRICT MATH DELIMITER PROTOCOL
    - You MUST wrap EVERY mathematical symbol, variable, matrix, or expression in LaTeX delimiters.
    - Use \\( ... \\) for inline math (e.g., \\(x\\), \\(\\mathbf{u}\\), \\(\\frac{1}{2}\\)).
    - Use \\[ ... \\] for block math (e.g., matrices, long equations).
    - NEVER use $ or $$ as delimiters. NEVER output raw LaTeX without delimiters.
    - Example of CORRECT formatting: "Your vector \\(\\mathbf{u}\\) is independent."
    - Example of INCORRECT formatting: "Your vector $\\mathbf{u}$ is independent."

    MANDATORY FEEDBACK STRUCTURE — you MUST produce exactly three labelled sections. Never collapse them into one paragraph.

    Section 1 — write the literal header "**Final Answer:**" then on the same line:
    Assess only the final answer. Is it correct or not? If incorrect, state the correct answer AND one actionable sentence on what the student needs to fix specifically in their final answer. If correct, confirm it.

    Section 2 — write the literal header "**Reasoning steps:**" then on the same line:
    Assess only the reasoning steps independently from the answer. Read the full reasoning sentence or chain before deciding. If the steps are correct, confirm them. If a step is wrong or missing, identify the root mathematical cause that lost the reasoning mark, name the step where that cause first appears, and add one actionable sentence on what the student needs to show or correct in their working. This section must never be skipped or merged with Section 1.

    Section 3 — write the literal header "**Verdict:**" then on the same line:
    Justify the grade in 2-3 sentences. List every mistake found across the answer and the reasoning. If grade is 1, confirm both are correct. Use "you" and "your"; never write "the student".

    Return ONLY a valid JSON object with no markdown formatting. The JSON must have:
    - "grade": 1 for correct, 0 for incorrect.
    - "feedback": structured as "**Final Answer:** ... \\n\\n**Reasoning steps:** ... \\n\\n**Verdict:** ...". ALWAYS follow the DELIMITER PROTOCOL.
    - "errorType": If grade is 0, a 2-4 word category of the error. If grade is 1, return an empty string.
    IMPORTANT: Double-escape all backslashes in the JSON string (e.g., "\\\\text", "\\\\frac").
        `;

      if (args.model === "gemini-2.5-flash") {
        const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
        if (!GOOGLE_API_KEY)
          return { grade: 0, feedback: "Error: Missing GOOGLE_API_KEY" };

        const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        // Gemini prompt slightly adjusted for JSON structure enforcement via prompt engineering as strict JSON mode varies
        const geminiPrompt = `
             System: You are a helpful math tutor. Grade the following student submission.
             
              Problem: ${args.problemStatement}
              Student Answer: ${args.studentAnswer}
              Reasoning: ${args.reasoning}
              ${answerFormatContext}

              Instructions:
              1. Address the student directly in the second person. Never refer to the learner as "the student".
              2. Return ONLY a valid JSON object. Do not wrap it in markdown code blocks.
              3. The JSON must have "grade" (1 or 0) and "feedback" (string).
              4. Double escape LaTeX backslashes in the JSON string (e.g., \\\\frac, \\\\mathbf).
              5. STRICTLY use \\\\[ ... \\\\] delimiters for block math (matrices, separate equations).
              6. STRICTLY use \\\\( ... \\\\) delimiters for ALL inline math (e.g., \\\\(x\\\\), \\\\(\\\\frac{1}{2}\\\\)).
              7. NEVER use $ or $$ as delimiters. NEVER output raw LaTeX without delimiters.
              8. Do NOT wrap normal text explanations in math delimiters.
              9. Apply the expected final answer format exactly like the OpenAI grader: accepted alternatives are equivalent, and set notation order does not matter.

             JSON Output:
             `;

        const result = await model.generateContent(geminiPrompt);
        const response = await result.response;
        const text = response.text();

        // Clean potential markdown blocks if Gemini adds them
        const cleaned = text
          .replace(/```json/g, "")
          .replace(/```/g, "")
          .trim();

        try {
          const parsed = JSON.parse(cleaned);
          return {
            grade: parsed.grade,
            feedback: normalizeSecondPersonFeedback(parsed.feedback),
            errorType: "",
          };
        } catch {
          console.error("Gemini JSON Parse Error", text);
          return {
            grade: 0,
            feedback: "Error parsing Gemini response.",
            errorType: "Parse Error",
          };
        }
      } else {
        // OpenAI (gpt-4o, gpt-4o-mini, or any unrecognised model falls back to OpenAI)
        const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
        if (!OPENAI_API_KEY)
          return { grade: 0, feedback: "Error: Missing OPENAI_API_KEY" };

        const completion = await fetch(
          "https://api.openai.com/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${OPENAI_API_KEY}`,
            },
            body: JSON.stringify({
              model: args.model.startsWith("gpt") ? args.model : "gpt-4o-mini", // Default to mini if unknown/deprecated model passed
              messages: [
                {
                  role: "system",
                  content:
                    "You are a helpful math tutor. Grade the work. Talk directly to the learner in the second person (e.g., 'You did...'). Never write 'the student'. Return strictly valid JSON. IMPORTANT: You must DOUBLE-ESCAPE all LaTeX backslashes in the JSON string (e.g., use '\\\\text', '\\\\frac', '\\\\infty'). STRICTLY use \\\\( and \\\\) for inline math and \\\\[ and \\\\] for block math. NEVER use $ or $$ as delimiters.",
                },
                { role: "user", content: prompt },
              ],
              response_format: { type: "json_object" },
            }),
          },
        );

        const data = await completion.json();
        if (data.error)
          return {
            grade: 0,
            feedback: `OpenAI Error: ${data.error.message}`,
            errorType: "API Error",
          };

        const content = data.choices[0].message.content;
        const parsed = JSON.parse(content);
        return {
          grade: parsed.grade,
          feedback: normalizeSecondPersonFeedback(parsed.feedback),
          errorType: parsed.errorType || "",
        };
      }
    } catch (err) {
      console.error("Unexpected Grading Error:", err);
      return {
        grade: 0,
        feedback: `Unexpected system error: ${errorMessage(err)}`,
        errorType: "System Error",
      };
    }
  },
});

export const checkPracticeAnswer = action({
  args: {
    questionText: v.string(),
    userAnswer: v.string(),
    correctAnswer: v.string(),
  },
  handler: async (ctx, args) => {
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_API_KEY)
      return { isCorrect: false, feedback: "Error: Missing OpenAI Key" };

    const prompt = `
      Question: ${args.questionText}
      Expected Answer: ${args.correctAnswer}
      Student Answer: ${args.userAnswer}

      Is the student's answer correct? Provide a short explanation.
      Address the student directly in the second person (e.g., "Your answer is..."). Never refer to the learner as "the student".
      Return JSON: { "isCorrect": boolean, "feedback": "3-sentence explanation" }
    `;

    try {
      const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
              {
                role: "system",
                content:
                  "You are a helpful math tutor. Verify the answer. Address the learner directly as you/your; never write 'the student'. Return strictly valid JSON. IMPORTANT: You must DOUBLE-ESCAPE all LaTeX backslashes in the JSON string (e.g., use '\\\\text', '\\\\frac', '\\\\infty'). STRICTLY use \\\\( and \\\\) for ALL inline math (e.g., \\\\(x\\\\), \\\\(\\\\frac{1}{2}\\\\)). STRICTLY use \\\\[ and \\\\] for block/display math (e.g., matrices). NEVER use $ or $$ delimiters.",
              },
              { role: "user", content: prompt },
            ],
            response_format: { type: "json_object" },
          }),
        },
      );

      const data = await response.json();
      const content = JSON.parse(data.choices[0].message.content);
      return {
        isCorrect: content.isCorrect,
        feedback: normalizeSecondPersonFeedback(content.feedback),
      };
    } catch (e) {
      console.error("Practice Grading Error:", e);
      return {
        isCorrect: false,
        feedback: "Error checking answer. Please try again.",
      };
    }
  },
});

export const transcribeReasoning = action({
  args: {
    image: v.string(), // base64 string
  },
  handler: async (ctx, args) => {
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_API_KEY) throw new Error("Missing OPENAI_API_KEY");

    try {
      const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
              {
                role: "system",
                content: `You are a high-precision Math Transcription Expert specializing in handwritten pedagogical solutions.
              
              YOUR TASK:
              Transcribe the provided image into clean, professionally formatted LaTeX.
              
              HANDWRITING RULES:
              1. **Ambiguity Resolution**: Carefully distinguish between 'x' (variable) and '×' (multiplication), '0' (zero) and 'o' (letter), 'l' (ell) and '1' (one).
              2. **Structural Fidelity**: If a solution is written in multi-line steps with alignment (e.g., sequels of equations), use the LaTeX 'aligned' environment or multiple $$...$$ blocks to maintain that vertical flow.
              3. **Matrix/Vector Support**: For handwritten matrices or vectors, use the 'bmatrix' or 'pmatrix' environments.
              4. **Latex Delimiters**: 
                 - Use $...$ for inline variables or short terms.
                 - Use $$...$$ for significant formulas, multi-line derivations, or centered results.
              
              OUTPUT CONSTRAINTS:
              - Return ONLY the LaTeX transcription. 
              - Do NOT include any conversational text (e.g. "Here is the transcription...").
              - Do NOT use markdown code blocks; just the raw text with LaTeX delimiters.
              - Ensure the output is immediately readable by a MathJax/KaTeX renderer.`,
              },
              {
                role: "user",
                content: [
                  { type: "text", text: "Transcribe this image." },
                  {
                    type: "image_url",
                    image_url: {
                      url: args.image,
                    },
                  },
                ],
              },
            ],
            max_tokens: 1000,
          }),
        },
      );

      const data = await response.json();
      if (data.error) throw new Error(data.error.message);

      return data.choices[0].message.content;
    } catch (err) {
      console.error("Transcription Error:", err);
      throw new Error("Failed to transcribe image. Please try again.");
    }
  },
});

export const gradeOptimized = action({
  args: {
    problemStatement: v.string(),
    studentAnswer: v.string(),
    reasoning: v.string(),
    model: v.string(),
    topicName: v.string(),
    answerFormatInstruction: v.optional(v.string()),
    reasoningStepsContext: v.optional(v.string()),
    exercisePedagogyJson: v.optional(v.string()),
    temperature: v.optional(v.number()),
    // Quiz study flags (set by gradingPipeline for enrolled participants):
    // includeOutcomeContext=false disables the outcome-validated few-shot pool
    // (conditions A and B); frozenPoolPhase reads few-shot pools from the
    // phase snapshot instead of live data, so the treatment stays constant.
    includeOutcomeContext: v.optional(v.boolean()),
    frozenPoolPhase: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const exercisePedagogy = args.exercisePedagogyJson
      ? (JSON.parse(args.exercisePedagogyJson) as ExercisePedagogyInstance)
      : null;
    const topicFiche = getTopicEvaluationFiche(args.topicName);
    // Start independent work together to reduce the synchronous grading wait.
    const casResultPromise = ctx.runAction(internal.cas.computeGroundTruth, {
      problemStatement: args.problemStatement,
      topicName: args.topicName,
    }) as Promise<{
      isComputable: boolean;
      groundTruth: string | null;
      expression: string | null;
      description?: string;
    }>;

    const expertCorrectionsPromise =
      args.frozenPoolPhase !== undefined
        ? ctx.runQuery(internal.experiment.getFrozenPool, {
            phase: args.frozenPoolPhase,
            poolType: "expertCorrections",
            topicName: args.topicName,
            limit: 1,
          })
        : ctx.runQuery(api.corrections.getApprovedCorrectionsForTopic, {
            topicName: args.topicName,
            limit: 1,
          });

    // Approach 4 — fetch outcome-validated examples in parallel (min reward = 5 mastery points)
    const highRewardPromise =
      args.includeOutcomeContext === false
        ? Promise.resolve([])
        : args.frozenPoolPhase !== undefined
          ? ctx.runQuery(internal.experiment.getFrozenPool, {
              phase: args.frozenPoolPhase,
              poolType: "outcomeValidated",
              topicName: args.topicName,
              limit: 2,
            })
          : ctx.runQuery(internal.submissions.getHighRewardSubmissions, {
              topicName: args.topicName,
              minReward: 5,
              limit: 2,
            });

    // 1. CAS: compute the verified correct answer before involving the AI
    const casResult = await casResultPromise;

    // 2. CAS: check student answer equivalence (short-circuit when possible)
    let casEquivalence: { isEquivalent: boolean | null; casChecked: boolean } =
      { isEquivalent: null, casChecked: false };
    if (casResult.isComputable && casResult.expression) {
      casEquivalence = (await ctx.runAction(
        internal.cas.checkAnswerEquivalence,
        {
          studentAnswer: args.studentAnswer || args.reasoning,
          groundTruth: casResult.groundTruth!,
          expression: casResult.expression,
        },
      )) as { isEquivalent: boolean | null; casChecked: boolean };
    }

    // 3. Get few-shot examples (expert corrections) for this topic
    const expertCorrections = await expertCorrectionsPromise;

    let fewShotContext = "";
    if (expertCorrections && expertCorrections.length > 0) {
      fewShotContext = `
      ### Reference Standards (Expert Professor Corrections):
      ${(expertCorrections as ExpertCorrectionExample[])
        .map(
          (c, i) => `
      Example ${i + 1}:
      - AI Feedback was corrected to: "${c.correctedFeedback}"
      - Corrected Grade: ${c.correctedGrade}
      `,
        )
        .join("\n")}
      `;
    }

    // Approach 4 — inject outcome-validated few-shot examples (feedback proven to raise mastery)
    const highRewardSubmissions = await highRewardPromise;
    let outcomeValidatedContext = "";
    if (highRewardSubmissions && highRewardSubmissions.length > 0) {
      const examples = (highRewardSubmissions as OutcomeValidatedExample[]).filter(
        (s) => s.judgeFeedback || s.aiFeedback,
      );
      if (examples.length > 0) {
        outcomeValidatedContext = `
      ### Outcome-Validated Feedback Examples (these feedback styles produced measurable mastery improvement):
      ${examples
        .map(
          (s, i) => `
      Example ${i + 1} (mastery gain: +${s.outcomeReward} points, grade: ${s.grade}):
      - Feedback that worked: "${s.judgeFeedback || s.aiFeedback}"
      `,
        )
        .join("\n")}
      When generating feedback, favour the pedagogical style shown above — specific, actionable, and targeted to the exact mistake.
      `;
      }
    }

    const linearAlgebraReasoningInstruction =
      buildLinearAlgebraReasoningInstruction(args.topicName);

    const reasoningScaffold = args.reasoningStepsContext
      ? `
EXPECTED REASONING PROCESS (${args.topicName}):
${args.reasoningStepsContext}

When grading "**Reasoning steps:**": Compare the student's work with the expected reasoning internally and identify the first mathematical divergence. In learner-facing feedback, NEVER mention a numbered step, a step ID, or wording such as "Step 2". Write "Your reasoning diverges when..." and describe the mathematical operation directly. State what was expected versus what the student wrote. If the reasoning is correct, describe the mathematical work completed successfully without listing step numbers.
`
      : "";

    const pedagogicalEvaluationContext = topicFiche && exercisePedagogy
      ? `
TOPIC-LEVEL FICHE PEDAGOGIQUE D'EVALUATION:
${JSON.stringify({
  ficheId: topicFiche.ficheId,
  ficheVersion: topicFiche.ficheVersion,
  taskType: topicFiche.taskTypes.find((task) => task.taskTypeId === exercisePedagogy.taskTypeId),
  evaluationRubric: topicFiche.evaluationRubric,
  misconceptions: topicFiche.misconceptions,
  exerciseInstance: exercisePedagogy,
})}

PEDAGOGICAL EVALUATION RULES:
- Treat the fiche as the authoritative reasoning-evaluation policy for this task.
- Identify the valid technique actually explored by the learner. Do not require cofactor expansion when another allowed technique is valid.
- Evaluate only the applicable reasoningComponents and their acceptableEvidence for the identified technique.
- Apply the fiche equivalencePolicy before classifying any component.
- Classify the overall reasoning using exactly one fiche reasoningStatus. Distinguish correct_but_incomplete from incorrect.
- For correct_but_incomplete reasoning, explicitly acknowledge the correct mathematics before naming the missing condition or conclusion.
- Identify the first genuine mathematical divergence or omission; later dependent errors are consequences, not separate root causes.
- Apply the fiche scoringPolicy. Criterion weights are for diagnosis and feedback, not fractional scoring.
- Follow the fiche feedbackPolicy, including its preferred phrase for the selected status.
- Use only IDs present in the fiche. Use an empty string when no incorrect step or misconception exists.
- Give a remediationPrompt that asks the learner to repair the first error without immediately revealing the full solution.
`
      : "";

    // 4. Build CAS context block injected into the prompt
    const casContext = casResult.isComputable
      ? `
    ⚠️  CAS VERIFIED ANSWER (computed deterministically by mathjs — do NOT recompute):
        Expression evaluated: ${casResult.expression}
        Correct answer: ${formatCasAnswer(casResult.groundTruth)}
        ${casResult.description ? `What was computed: ${casResult.description}` : ""}
        ${
          casEquivalence.casChecked
            ? casEquivalence.isEquivalent === true
              ? "CAS EQUIVALENCE CHECK: Student's answer matches the verified answer ✓ — the final answer is CORRECT."
              : "CAS EQUIVALENCE CHECK: Student's answer does NOT match the verified answer ✗ — the final answer is WRONG."
            : "CAS equivalence check could not parse student answer — use the verified answer above to judge correctness."
        }
    Use the verified answer above as ground truth. Do NOT perform your own numerical computation.
      `
      : "";

    const unifiedPrompt = `
    You are a supportive Math Professor. Grade the submission for the topic: "${args.topicName}".

    ${fewShotContext}
    ${outcomeValidatedContext}
    ${casContext}

    Problem: ${args.problemStatement}
    Student's Final Answer: ${args.studentAnswer}
    Student's Reasoning: ${args.reasoning}
    ${args.answerFormatInstruction ? `Expected Final Answer Format: ${args.answerFormatInstruction}` : ""}
    ${linearAlgebraReasoningInstruction}
    ${reasoningScaffold}
    ${pedagogicalEvaluationContext}
    ${INTERMEDIATE_EQUIVALENCE_RULE}

    SCORING RUBRIC:
    - The total grade is 1 point.
    - Final Answer is worth 0.5 point. Return "finalAnswerScore": 0.5 if the final answer is correct/equivalent, otherwise 0.
    - Reasoning steps are worth 0.5 point. Return "reasoningScore": 0.5 only when the reasoning is mathematically sound enough to justify the answer, otherwise 0.
    - The returned "grade" MUST equal finalAnswerScore + reasoningScore, so it can only be 0, 0.5, or 1.
    - When CAS says the final answer is correct or incorrect, you MUST use that CAS result for finalAnswerScore. Do not override it.

    RULES:
    0. **Direct Address Only**: Address the learner as "you" and "your" in every section. Never write "the student", "the learner", or third-person phrases such as "The student has shown".
    1. **Grade is the sum of two half-points**: Award up to \\(0.5\\) for Final Answer and up to \\(0.5\\) for Reasoning steps. A correct final answer with weak reasoning earns \\(0.5\\), not \\(0\\) or \\(1\\).
    2. **Thin/Missing Reasoning → Grade 0**: If the reasoning is empty or says nothing mathematical (e.g. "I did it on paper"), assign grade 0. Feedback MUST state: "Your answer is correct, but you need to show your reasoning steps so I can assess your understanding."
    IMPORTANT HALF-POINT CLARIFICATION: This overrides any binary grading wording. Missing or weak reasoning means reasoningScore is 0, but finalAnswerScore can still be 0.5 if CAS or equivalence shows the final answer is correct.
    3. **Final Answer Detection**: If "Student's Final Answer" is empty, find the answer within the "Reasoning" steps. If no answer can be found anywhere, finalAnswerScore is 0.
    4. **Trust the CAS**: If a CAS verified answer is provided above, use it as the ground truth for correctness. Do NOT recompute the answer yourself — AI arithmetic is unreliable. The CAS is always right.
    5. **Reasoning Consistency**: Read the full reasoning sentence or chain before judging. Only assign grade 0 for incorrect reasoning if the whole argument is mathematically wrong, misses a required justification, or directly contradicts the final answer. A different but valid method, condensed steps, or unconventional notation must receive full credit.
    6. **Semantic Equivalence**: Mathematically equivalent statements and intermediate expressions MUST receive the same grade regardless of phrasing, notation, neutral factors, or algebraic form. Apply the mandatory intermediate-expression equivalence check above before identifying any divergence. Rephrasing or simplifying an equivalent expression is NOT a reasoning error.
    7. **Wrong Answer or Wrong Reasoning → Show the Correct Result**: If the final answer or reasoning is wrong, briefly state what the correct answer/result is after explaining the mistake. One or two sentences is enough.
    8. **Be concise**: Each feedback section should be one short sentence unless a specific mathematical mistake must be named.
    8a. **Notice Rule (no penalty)**: Even when awarding full reasoning marks, if you notice ANY minor issue — wrong sign (e.g., \\(\\det(A + \\lambda I)\\) instead of \\(\\det(A - \\lambda I)\\)), a notation slip, an incorrect intermediate step that did not affect the final answer, or a self-corrected error — you MUST add a brief notice in the "**Reasoning steps:**" section after the score line. Format it as: "Note: [describe the issue clearly and what the correct form is]." This notice does NOT reduce the score. If everything is completely correct, omit the notice.
    9. **STRICT MATH DELIMITER PROTOCOL**:
       - You MUST wrap EVERY mathematical symbol, variable, matrix, or expression in delimiters.
       - Use \\( ... \\) for inline math and \\[ ... \\] for block math. Double-escape backslashes in JSON (e.g., "\\\\frac", "\\\\mathbf").
       - NEVER use $ or $$ as delimiters. NEVER output raw LaTeX (e.g., \\boldsymbol, \\begin) without delimiters.

    MANDATORY FEEDBACK STRUCTURE — produce exactly three sections with these exact bold headers. Never collapse them.

    Section 1 — write the literal header "**Final Answer:**" then on the same line:
    Assess only the final answer. Is it correct or not? Show its half-point score \\(x/0.5\\). If incorrect, state the correct answer AND one actionable sentence on what needs to be fixed. If correct, confirm it.

    Section 2 — write the literal header "**Reasoning steps:**" then on the same line:
    Assess only the reasoning independently. Show its half-point score \\(x/0.5\\). Read the full reasoning chain and check algebraic equivalence before deciding. If correct, confirm it. If wrong or missing, identify a genuine mathematical divergence that changes the value, sign, solution set, or logic, then give one actionable correction. Never call an equivalent unsimplified expression a divergence. Never skip or merge this with Section 1.

    Section 3 — write the literal header "**Verdict:**" then on the same line:
    Justify the grade in 2-3 sentences. List every mistake found. If grade is 1, confirm both parts are correct. Use "you" and "your"; never write "the student".

    Return ONLY a valid JSON object:
    {
      "finalAnswerScore": number (0 or 0.5),
      "reasoningScore": number (0 or 0.5),
      "grade": number (0, 0.5, or 1),
      "feedback": "**Final Answer:** ... \\n\\n**Reasoning steps:** ... \\n\\n**Verdict:** ...",
      "errorType": "precise 2-5 word mathematical error category if grade < 1, else empty. Never use vague labels such as Answer and Reasoning, Incorrect Answer, or Reasoning Issue",
      "techniqueUsed": "the mathematical technique or strategy you identify",
      "misconception": "the underlying misconception if grade < 1, else empty",
      "errorLocation": "final answer, reasoning steps, calculation, notation, or none detected",
      "conceptTags": ["short mathematical concept tags"],
      "diagnosisConfidence": number between 0 and 1
      ${topicFiche && exercisePedagogy ? `,
      "techniqueId": "an allowed techniqueId from the fiche",
      "reasoningStatus": "correct|correct_but_incomplete|incorrect|missing|not_applicable",
      "completedStepIds": ["correctly completed stepIds from that technique"],
      "firstIncorrectStepId": "first incorrect stepId, or empty string",
      "misconceptionId": "best matching misconceptionId, or empty string",
      "criterionResults": [{"criterionId":"criterion ID", "status":"satisfied|partial|incorrect|not-evidenced", "evidence":"brief evidence from the submitted reasoning"}],
      "remediationPrompt": "one focused question that helps repair the first error without giving the complete answer"` : ""}
    }
    `;

    const answerFormatSystemInstruction = args.answerFormatInstruction
      ? `\n\nExpected final answer format: ${args.answerFormatInstruction}\nAccept every listed alternative format as equivalent. If the answer is a set or list of roots/eigenvalues/solutions, set notation is accepted and order does not matter.`
      : "";
    const systemMessage =
      "You are a supportive Math Professor. Use this exact half-point rubric: Final Answer is 0.5, Reasoning steps are 0.5, and grade is their sum. Address the learner directly as you/your; never write 'the student'. Return strictly valid JSON. IMPORTANT: Double-escape all LaTeX backslashes (e.g., '\\\\frac', '\\\\mathbf'). Use \\\\( and \\\\) for inline math and \\\\[ and \\\\] for block math. NEVER use $ or $$ as delimiters.";

    try {
      if (args.model === "gemini-2.5-flash") {
        const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
        if (!GOOGLE_API_KEY)
          return {
            grade: 0,
            feedback: "Error: Missing GOOGLE_API_KEY",
            errorType: "Config Error",
            isOptimized: true,
          };

        const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);
        const geminiSystemInstruction =
          systemMessage +
          answerFormatSystemInstruction +
          "\n\nYou MUST use the same instruction as the OpenAI grader. Format feedback with **Final Answer:**, **Reasoning steps:**, and **Verdict:** sections.";

        let content: RawGradingContent | null = null;
        let lastGeminiText = "";

        try {
          const geminiModel = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            systemInstruction: geminiSystemInstruction,
            generationConfig: {
              responseMimeType: "application/json",
              temperature: args.temperature ?? 0,
              maxOutputTokens: 2000,
            },
          });

          const result = await geminiModel.generateContent(unifiedPrompt);
          lastGeminiText = extractGeminiText(result.response);
          content = parseJsonObject(lastGeminiText);
        } catch (structuredError) {
          console.error(
            "Gemini structured grading failed, retrying with prompt-only JSON mode:",
            structuredError,
          );
        }

        if (!content) {
          try {
            const fallbackGeminiModel = genAI.getGenerativeModel({
              model: "gemini-2.5-flash",
              generationConfig: {
                temperature: args.temperature ?? 0,
                maxOutputTokens: 2000,
              },
            });

            const fallbackPrompt = `${geminiSystemInstruction}\n\n${unifiedPrompt}\n\nReturn ONLY a valid JSON object.`;
            const fallbackResult =
              await fallbackGeminiModel.generateContent(fallbackPrompt);
            lastGeminiText = extractGeminiText(fallbackResult.response);
            content = parseJsonObject(lastGeminiText);
          } catch (fallbackError) {
            console.error(
              "Gemini fallback grading failed after structured mode error:",
              fallbackError,
            );
          }
        }

        if (!content) {
          console.error("Gemini returned no parseable JSON object:", {
            text: lastGeminiText,
          });
          return attachPipelineDiagnostics(
            casBackedFallbackFeedback(
              casResult,
              casEquivalence,
              args.reasoning,
            ),
            args.topicName,
            casResult,
            casEquivalence,
            null,
            exercisePedagogy,
          );
        }
        const graded = normalizeGradingResult(content);
        const reconciled = reconcileVerifiedDeterminantReasoning(
          graded,
          content,
          args.reasoning,
          exercisePedagogy,
        );
        return attachPipelineDiagnostics(
          enforceHalfPointStructure(
            reconciled.result,
            casResult,
            casEquivalence,
          ),
          args.topicName,
          casResult,
          casEquivalence,
          reconciled.content,
          exercisePedagogy,
        );
      } else {
        const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
        if (!OPENAI_API_KEY)
          return {
            grade: 0,
            feedback: "Error: Missing OPENAI_API_KEY",
            errorType: "Config Error",
            isOptimized: true,
          };

        const openaiModel = args.model.startsWith("gpt")
          ? args.model
          : "gpt-4o-mini";
        const response = await fetch(
          "https://api.openai.com/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${OPENAI_API_KEY}`,
            },
            body: JSON.stringify({
              model: openaiModel,
              messages: [
                { role: "system", content: systemMessage },
                { role: "user", content: unifiedPrompt },
              ],
              response_format: {
                type: "json_schema",
                json_schema: {
                  name: "grading_result",
                  strict: true,
                  schema: {
                    type: "object",
                    properties: {
                      finalAnswerScore: { type: "number" },
                      reasoningScore: { type: "number" },
                      grade: { type: "number" },
                      feedback: { type: "string" },
                      errorType: { type: "string" },
                      techniqueUsed: { type: "string" },
                      misconception: { type: "string" },
                      errorLocation: { type: "string" },
                      conceptTags: {
                        type: "array",
                        items: { type: "string" },
                      },
                      diagnosisConfidence: { type: "number" },
                      techniqueId: { type: "string" },
                      reasoningStatus: { type: "string", enum: ["correct", "correct_but_incomplete", "incorrect", "missing", "not_applicable"] },
                      completedStepIds: { type: "array", items: { type: "string" } },
                      firstIncorrectStepId: { type: "string" },
                      misconceptionId: { type: "string" },
                      criterionResults: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            criterionId: { type: "string" },
                            status: { type: "string", enum: ["satisfied", "partial", "incorrect", "not-evidenced"] },
                            evidence: { type: "string" },
                          },
                          required: ["criterionId", "status", "evidence"],
                          additionalProperties: false,
                        },
                      },
                      remediationPrompt: { type: "string" },
                    },
                    required: [
                      "finalAnswerScore",
                      "reasoningScore",
                      "grade",
                      "feedback",
                      "errorType",
                      "techniqueUsed",
                      "misconception",
                      "errorLocation",
                      "conceptTags",
                      "diagnosisConfidence",
                      "techniqueId",
                      "reasoningStatus",
                      "completedStepIds",
                      "firstIncorrectStepId",
                      "misconceptionId",
                      "criterionResults",
                      "remediationPrompt",
                    ],
                    additionalProperties: false,
                  },
                },
              },
              temperature: args.temperature ?? 0,
              max_tokens: 900,
            }),
          },
        );

        const data = await response.json();
        if (data.error)
          return attachPipelineDiagnostics(
            {
              grade: 0,
              feedback: `API Error: ${data.error.message}`,
              errorType: "API Error",
              isOptimized: true,
            },
            args.topicName,
            casResult,
            casEquivalence,
            null,
            exercisePedagogy,
          );
        const content = JSON.parse(data.choices[0].message.content);
        const graded = normalizeGradingResult(content);
        const reconciled = reconcileVerifiedDeterminantReasoning(
          graded,
          content,
          args.reasoning,
          exercisePedagogy,
        );
        return attachPipelineDiagnostics(
          enforceHalfPointStructure(
            reconciled.result,
            casResult,
            casEquivalence,
          ),
          args.topicName,
          casResult,
          casEquivalence,
          reconciled.content,
          exercisePedagogy,
        );
      }
    } catch (e) {
      console.error("Optimized Grading Error:", e);
      return attachPipelineDiagnostics(
        {
          grade: 0,
          feedback:
            "**Final Answer:** Unverifiable\n\n**Reasoning steps:** An unexpected syntax error occurred while generating your feedback. Please try checking your answer again.\n\n**Verdict:** System Error",
          errorType: "Feedback Error",
          isOptimized: true,
        },
        args.topicName,
        casResult,
        casEquivalence,
        null,
        exercisePedagogy,
      );
    }
  },
});

// Background action — called by scheduler after saveSubmission, never directly by the client
export const runJudgeForSubmission = internalAction({
  args: {
    submissionId: v.id("submissions"),
    problemStatement: v.string(),
    studentAnswer: v.string(),
    reasoning: v.string(),
    grade: v.number(),
    feedback: v.string(),
    topicName: v.string(),
    // Quiz study — background judge must use the frozen pool too, so the
    // judgeConfidence logged for condition A is measured under the same
    // few-shot context as conditions B/C.
    frozenPoolPhase: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    try {
      const judgeResult = (await ctx.runAction(api.judge.evaluateEvaluator, {
        problemStatement: args.problemStatement,
        studentAnswer: args.studentAnswer,
        studentReasoning: args.reasoning,
        assistantGrade: args.grade,
        assistantFeedback: args.feedback,
        topicName: args.topicName,
        frozenPoolPhase: args.frozenPoolPhase,
      })) as {
        suggestedGrade: number;
        refinedFeedback: string;
        errorType: string;
        isModified: boolean;
        judgeConfidence: number;
        reasoning: string;
      };

      await ctx.runMutation(internal.submissions.patchSubmissionWithJudge, {
        submissionId: args.submissionId,
        grade: args.grade,
        feedback: normalizeSecondPersonFeedback(args.feedback),
        errorType: judgeResult.errorType || "",
        judgeFeedback: normalizeSecondPersonFeedback(
          judgeResult.refinedFeedback,
        ),
        isJudgeModified: judgeResult.isModified,
        judgeConfidence: judgeResult.judgeConfidence,
      });
    } catch (err) {
      console.error(
        "Background judge failed for submission",
        args.submissionId,
        err,
      );
      // Patch judgeStatus to complete even on failure so the UI doesn't hang
      await ctx.runMutation(internal.submissions.patchSubmissionWithJudge, {
        submissionId: args.submissionId,
        grade: args.grade,
        feedback: args.feedback,
        errorType: "",
        judgeFeedback: "",
        isJudgeModified: false,
        judgeConfidence: 0,
      });
    }
  },
});

export const gradeWithJudge = action({
  args: {
    problemStatement: v.string(),
    studentAnswer: v.string(),
    reasoning: v.string(),
    model: v.string(),
    topicName: v.string(),
    answerFormatInstruction: v.optional(v.string()),
    reasoningStepsContext: v.optional(v.string()),
    exercisePedagogyJson: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // 1. Get initial grade
    const initialResult = (await ctx.runAction(
      api.grading.gradeOptimized,
      args,
    )) as { grade: number; feedback: string; errorType?: string };

    try {
      // 2. Invoke Judge
      const judgeResult = (await ctx.runAction(api.judge.evaluateEvaluator, {
        problemStatement: args.problemStatement,
        studentAnswer: args.studentAnswer,
        studentReasoning: args.reasoning,
        assistantGrade: initialResult.grade,
        assistantFeedback: initialResult.feedback,
        topicName: args.topicName,
      })) as {
        suggestedGrade: number;
        refinedFeedback: string;
        errorType: string;
        isModified: boolean;
        judgeConfidence: number;
        reasoning: string;
      };

      // 3. Prepare final result
      return {
        grade: initialResult.grade,
        feedback: normalizeSecondPersonFeedback(initialResult.feedback),
        errorType: judgeResult.errorType || initialResult.errorType || "",
        judgeMetadata: {
          judgeFeedback: normalizeSecondPersonFeedback(
            judgeResult.refinedFeedback,
          ),
          isJudgeModified: judgeResult.isModified,
          judgeConfidence: judgeResult.judgeConfidence,
          judgeReasoning: judgeResult.reasoning,
        },
      };
    } catch (err) {
      console.error("Judge failed, falling back to initial result", err);
      return {
        grade: initialResult.grade,
        feedback: normalizeSecondPersonFeedback(initialResult.feedback),
        errorType: initialResult.errorType || "",
        judgeMetadata: undefined,
      };
    }
  },
});

// Grades a student answer against a teacher-defined marking scheme (partial marking).
// Each criterion is awarded its full marks or 0. Total grade is sum of awarded marks (0-1).
export const gradeWithMarkingScheme = action({
  args: {
    problemStatement: v.string(),
    studentAnswer: v.string(),
    studentReasoning: v.string(),
    topicName: v.string(),
    model: v.string(),
    criteria: v.array(
      v.object({
        id: v.string(),
        description: v.string(),
        marks: v.number(),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const criteriaLines = args.criteria
      .map((c) => `- [${c.id}] (${c.marks} marks): "${c.description}"`)
      .join("\n");

    const prompt = `
You are a strict Math Professor grading an exam answer against a specific marking scheme.

Topic: ${args.topicName}
Problem: ${args.problemStatement}
Student's Final Answer: ${args.studentAnswer || "(see reasoning)"}
Student's Reasoning: ${args.studentReasoning || "(none provided)"}

MARKING SCHEME — evaluate each criterion independently:
${criteriaLines}

RULES:
1. For each criterion, award the FULL marks listed or 0 — no partial marks within a criterion.
2. totalGrade = sum of all awarded marks (between 0.0 and 1.0).
3. If no reasoning is provided, every criterion gets 0.
4. Award marks only when the criterion is clearly and explicitly met.
5. Address the learner directly (second person). Use "you" and "your"; never write "the student".
6. STRICT MATH DELIMITER PROTOCOL: Use \\( \\) for inline math and \\[ \\] for block math. Double-escape all backslashes in JSON (e.g., "\\\\frac", "\\\\mathbf").

Return ONLY valid JSON (no markdown):
{
  "criteria": [
    { "id": "<criterion id>", "awarded": <marks or 0>, "met": <true/false>, "reason": "Brief reason why marks were or were not awarded" }
  ],
  "totalGrade": <0.0 to 1.0>,
  "feedback": "Concise overall feedback referencing which criteria were met or missed"
}
    `;

    const systemMsg =
      "You are a strict Math Professor. Return only valid JSON. Double-escape all LaTeX backslashes. Use \\\\( and \\\\) for inline math and \\\\[ and \\\\] for block math. Never use $ or $$.";

    try {
      if (args.model === "gemini-2.5-flash") {
        const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
        if (!GOOGLE_API_KEY)
          return {
            grade: 0,
            feedback: "Error: Missing GOOGLE_API_KEY",
            criteriaResults: [],
            errorType: "Config Error",
          };

        const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);
        const geminiModel = genAI.getGenerativeModel({
          model: "gemini-2.5-flash",
          generationConfig: { responseMimeType: "application/json" },
        });
        const result = await geminiModel.generateContent(
          `${systemMsg}\n\n${prompt}`,
        );
        const text = result.response.text();
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch)
          return {
            grade: 0,
            feedback: "Error: unexpected Gemini response.",
            criteriaResults: [],
            errorType: "Parse Error",
          };
        const content = JSON.parse(jsonMatch[0]);
        return {
          grade: content.totalGrade ?? 0,
          feedback: normalizeSecondPersonFeedback(content.feedback ?? ""),
          criteriaResults: content.criteria ?? [],
          errorType: content.totalGrade === 1 ? "" : "Partial / Incorrect",
        };
      } else {
        const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
        if (!OPENAI_API_KEY)
          return {
            grade: 0,
            feedback: "Error: Missing OPENAI_API_KEY",
            criteriaResults: [],
            errorType: "Config Error",
          };

        const openaiModel = args.model.startsWith("gpt")
          ? args.model
          : "gpt-4o-mini";
        const response = await fetch(
          "https://api.openai.com/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${OPENAI_API_KEY}`,
            },
            body: JSON.stringify({
              model: openaiModel,
              messages: [
                { role: "system", content: systemMsg },
                { role: "user", content: prompt },
              ],
              response_format: { type: "json_object" },
            }),
          },
        );
        const data = await response.json();
        if (data.error)
          return {
            grade: 0,
            feedback: `API Error: ${data.error.message}`,
            criteriaResults: [],
            errorType: "API Error",
          };
        const content = JSON.parse(data.choices[0].message.content);
        return {
          grade: content.totalGrade ?? 0,
          feedback: normalizeSecondPersonFeedback(content.feedback ?? ""),
          criteriaResults: content.criteria ?? [],
          errorType: content.totalGrade === 1 ? "" : "Partial / Incorrect",
        };
      }
    } catch (e) {
      console.error("Marking scheme grading error:", e);
      return {
        grade: 0,
        feedback: "Error during grading. Please try again.",
        criteriaResults: [],
        errorType: "System Error",
      };
    }
  },
});

// ─── RLHF: Best-of-N Sampling ─────────────────────────────────────────────────
//
// Generates N independent grading candidates at temperature > 0 (so outputs
// genuinely differ), then uses the LLM-as-Judge as a reward model to score
// each candidate. The candidate with the highest judge confidence is returned.
//
// This implements the RLAIF Best-of-N pattern:
//   1. Sample N candidates from the policy (gradeOptimized × N)
//   2. Score each with the reward model (evaluateEvaluator)
//   3. Return argmax over reward scores
//
// N is capped at 3 to keep API cost predictable (3 grading + 3 judge calls).
export const gradeBestOfN = action({
  args: {
    problemStatement: v.string(),
    studentAnswer: v.string(),
    reasoning: v.string(),
    model: v.string(),
    topicName: v.string(),
    answerFormatInstruction: v.optional(v.string()),
    reasoningStepsContext: v.optional(v.string()),
    exercisePedagogyJson: v.optional(v.string()),
    n: v.optional(v.number()),
    // Quiz study flags — forwarded to gradeOptimized (candidate generation)
    // and evaluateEvaluator (judge few-shot pool). See gradeOptimized.
    includeOutcomeContext: v.optional(v.boolean()),
    frozenPoolPhase: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const N = Math.min(Math.max(args.n ?? 3, 2), 3);

    const gradingArgs = {
      problemStatement: args.problemStatement,
      studentAnswer: args.studentAnswer,
      reasoning: args.reasoning,
      model: args.model,
      topicName: args.topicName,
      answerFormatInstruction: args.answerFormatInstruction,
      reasoningStepsContext: args.reasoningStepsContext,
      exercisePedagogyJson: args.exercisePedagogyJson,
      temperature: 0.4,
      includeOutcomeContext: args.includeOutcomeContext,
      frozenPoolPhase: args.frozenPoolPhase,
    };

    // Step 1 — Generate N candidates in parallel at temperature=0.4 for diversity
    const candidates = (await Promise.all(
      Array.from({ length: N }, () =>
        ctx.runAction(api.grading.gradeOptimized, gradingArgs),
      ),
    )) as Array<{
      grade: number;
      feedback: string;
      errorType?: string;
      [key: string]: unknown;
    }>;

    // Step 2 — Score every candidate with the judge (this is the reward model)
    const judgeResults = (await Promise.all(
      candidates.map((candidate) =>
        ctx.runAction(api.judge.evaluateEvaluator, {
          problemStatement: args.problemStatement,
          studentAnswer: args.studentAnswer,
          studentReasoning: args.reasoning,
          assistantGrade: candidate.grade,
          assistantFeedback: candidate.feedback,
          topicName: args.topicName,
          frozenPoolPhase: args.frozenPoolPhase,
        }),
      ),
    )) as Array<{
      suggestedGrade: number;
      refinedFeedback: string;
      errorType: string;
      isModified: boolean;
      judgeConfidence: number;
      reasoning: string;
    }>;

    // Step 3 — Select the candidate the reward model rates highest
    const selectableIndices = candidates
      .map((candidate, index) => ({ candidate, index }))
      .filter(({ candidate }) => candidate.errorType !== "Feedback Error")
      .map(({ index }) => index);
    const candidatePool =
      selectableIndices.length > 0
        ? selectableIndices
        : candidates.map((_, index) => index);

    let bestIndex = 0;
    let bestConfidence = -1;
    for (const i of candidatePool) {
      if (judgeResults[i].judgeConfidence > bestConfidence) {
        bestConfidence = judgeResults[i].judgeConfidence;
        bestIndex = i;
      }
    }

    const bestCandidate = candidates[bestIndex];

    // The judge is used as a reward model for ranking only. Once a candidate
    // has been CAS-backed and selected, we do not let the judge overwrite its
    // grade or feedback, since that can corrupt a correct final-answer verdict.
    const finalGrade = bestCandidate.grade;
    const finalFeedback = normalizeSecondPersonFeedback(bestCandidate.feedback);

    return {
      ...bestCandidate,
      grade: finalGrade,
      feedback: finalFeedback,
      errorType: bestCandidate.errorType || "",
      bestOfNMetadata: {
        n: N,
        selectedIndex: bestIndex,
        selectedJudgeConfidence: bestConfidence,
        allCandidates: candidates.map((c, i) => ({
          index: i,
          grade: c.grade,
          judgeConfidence: judgeResults[i].judgeConfidence,
          isJudgeModified: judgeResults[i].isModified,
        })),
      },
    };
  },
});
