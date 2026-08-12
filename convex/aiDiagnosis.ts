import type {
  AiDiagnosisResult,
  CasLayerResult,
  PedagogicalCriterionResult,
  PedagogicalEvaluation,
} from "./layerTypes";

type DiagnosisFallback = {
  topicName: string;
  errorType?: string;
  reasoningScore: 0 | 0.5;
  casLayer: CasLayerResult;
};

function asRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

function asString(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function asConfidence(value: unknown): number {
  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numeric)) return 0.6;
  return Math.max(0, Math.min(1, numeric));
}

function asHalfPoint(value: unknown, fallback: 0 | 0.5): 0 | 0.5 {
  const numeric = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numeric) && numeric >= 0.5 ? 0.5 : fallback;
}

function asStringArray(value: unknown, fallback: string[]): string[] {
  if (!Array.isArray(value)) return fallback;
  const cleaned = value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
  return cleaned.length ? Array.from(new Set(cleaned)) : fallback;
}

function asNullableString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function normalizeCriterionResults(value: unknown): PedagogicalCriterionResult[] {
  if (!Array.isArray(value)) return [];
  const statuses = new Set(["satisfied", "partial", "incorrect", "not-evidenced"]);
  return value.flatMap((item) => {
    const record = asRecord(item);
    const criterionId = asNullableString(record.criterionId);
    if (!criterionId) return [];
    const rawStatus = asString(record.status, "not-evidenced");
    const status = statuses.has(rawStatus)
      ? (rawStatus as PedagogicalCriterionResult["status"])
      : "not-evidenced";
    return [{ criterionId, status, evidence: asString(record.evidence, "No evidence identified.") }];
  });
}

function normalizePedagogicalEvaluation(
  content: Record<string, unknown>,
  expected?: Omit<PedagogicalEvaluation, "techniqueId" | "techniqueLabel" | "reasoningStatus" | "completedStepIds" | "firstIncorrectStepId" | "misconceptionId" | "misconceptionLabel" | "criterionResults" | "remediationPrompt">,
): PedagogicalEvaluation | undefined {
  if (!expected) return undefined;
  return {
    ...expected,
    techniqueId: asString(content.techniqueId, "unidentified-technique"),
    techniqueLabel: asString(content.techniqueUsed, "Unidentified technique"),
    reasoningStatus: (["correct", "correct_but_incomplete", "incorrect", "missing", "not_applicable"] as const).includes(
      content.reasoningStatus as "correct",
    )
      ? (content.reasoningStatus as PedagogicalEvaluation["reasoningStatus"])
      : "missing",
    completedStepIds: asStringArray(content.completedStepIds, []),
    firstIncorrectStepId: asNullableString(content.firstIncorrectStepId),
    misconceptionId: asNullableString(content.misconceptionId),
    misconceptionLabel: asNullableString(content.misconception),
    criterionResults: normalizeCriterionResults(content.criterionResults),
    remediationPrompt: asNullableString(content.remediationPrompt),
  };
}

function defaultTechnique(topicName: string): string {
  const topic = topicName.replace(/_/g, " ");
  return `Work on ${topic}`;
}

function defaultMisconception(errorType: string, casLayer: CasLayerResult) {
  if (!errorType && casLayer.equivalent === true) {
    return "No clear misconception detected";
  }
  if (errorType) return errorType;
  if (casLayer.equivalent === false) return "Final answer is not equivalent";
  return "Reasoning needs clearer mathematical justification";
}

export function buildFallbackAiDiagnosis({
  topicName,
  errorType = "",
  reasoningScore,
  casLayer,
}: DiagnosisFallback): AiDiagnosisResult {
  return {
    techniqueUsed: defaultTechnique(topicName),
    errorType:
      errorType ||
      (casLayer.equivalent === false ? "Incorrect Final Answer" : ""),
    misconception: defaultMisconception(errorType, casLayer),
    errorLocation:
      casLayer.equivalent === false
        ? "final answer"
        : reasoningScore === 0
          ? "reasoning steps"
          : "none detected",
    reasoningScore,
    conceptTags: [topicName],
    confidence: casLayer.checked ? 0.75 : 0.55,
  };
}

export function normalizeAiDiagnosis(
  content: unknown,
  fallback: DiagnosisFallback,
  pedagogicalContext?: Omit<PedagogicalEvaluation, "techniqueId" | "techniqueLabel" | "reasoningStatus" | "completedStepIds" | "firstIncorrectStepId" | "misconceptionId" | "misconceptionLabel" | "criterionResults" | "remediationPrompt">,
): AiDiagnosisResult {
  const record = asRecord(content);
  const fallbackDiagnosis = buildFallbackAiDiagnosis(fallback);
  const errorType = asString(record.errorType, fallbackDiagnosis.errorType);

  return {
    techniqueUsed: asString(
      record.techniqueUsed,
      fallbackDiagnosis.techniqueUsed,
    ),
    errorType,
    misconception: asString(
      record.misconception,
      fallbackDiagnosis.misconception,
    ),
    errorLocation: asString(
      record.errorLocation,
      fallbackDiagnosis.errorLocation,
    ),
    reasoningScore: asHalfPoint(
      record.reasoningScore,
      fallbackDiagnosis.reasoningScore,
    ),
    conceptTags: asStringArray(record.conceptTags, [
      ...fallbackDiagnosis.conceptTags,
      ...(errorType ? [errorType] : []),
    ]),
    confidence: asConfidence(record.diagnosisConfidence),
    pedagogicalEvaluation: normalizePedagogicalEvaluation(
      record,
      pedagogicalContext,
    ),
  };
}
