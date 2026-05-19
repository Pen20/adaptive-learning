import type { AiDiagnosisResult, CasLayerResult } from "./layerTypes";

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
  };
}
