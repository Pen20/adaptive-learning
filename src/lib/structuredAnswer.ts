import type { AnswerFormat } from "@/data/topics";

export type AnswerField = NonNullable<AnswerFormat["fields"]>[number];

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeAnswerText(value: string) {
  return value
    .replace(/\\lambda/g, "lambda")
    .replace(/\\det/g, "det")
    .replace(/\\neq/g, "!=")
    .replace(/\\dfrac/g, "\\frac")
    .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, "$1/$2")
    .replace(/\\\(|\\\)|\\\[|\\\]|\$\$|\$/g, "")
    .replace(/\\,/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function labelPattern(label: string) {
  const normalized = normalizeAnswerText(label);
  const compact = normalized.replace(/_/g, "");
  const variants = Array.from(new Set([normalized, compact].filter(Boolean)));
  return variants.map(escapeRegExp).join("|");
}

function operatorPattern(operator?: string) {
  if (operator === "!=" || operator === "\\neq") {
    return "(?:!=|not equal|neq)";
  }
  return "=";
}

function extractByField(raw: string, field: AnswerField) {
  const label = labelPattern(field.label);
  if (!label) return "";

  const pattern = new RegExp(
    `(?:${label})\\s*${operatorPattern(field.operator)}\\s*([^,;\\n]+)`,
    "i",
  );
  return raw.match(pattern)?.[1]?.trim() ?? "";
}

function extractSequentialValues(raw: string) {
  const equalityValues = Array.from(
    raw.matchAll(/(?:=|!=|not equal|neq)\s*([^,;\n]+)/gi),
  )
    .map((match) => match[1]?.trim())
    .filter((value): value is string => Boolean(value));

  if (equalityValues.length > 0) return equalityValues;

  return raw
    .split(/[,;]/)
    .map((part) => part.trim())
    .filter(Boolean);
}

export function composeStructuredAnswer(
  fields: AnswerField[],
  values: Record<string, string>,
) {
  return fields
    .map((field) => {
      const value = values[field.key]?.trim();
      if (!value) return "";
      return `${field.label} ${field.operator ?? "="} ${value}`;
    })
    .filter(Boolean)
    .join(", ");
}

export function parseStructuredAnswer(
  answer: string,
  fields: AnswerField[],
): Record<string, string> {
  const normalized = normalizeAnswerText(answer);
  const parsed: Record<string, string> = {};
  const sequentialValues = extractSequentialValues(normalized);

  fields.forEach((field, index) => {
    parsed[field.key] =
      extractByField(normalized, field) || sequentialValues[index] || "";
  });

  return parsed;
}

export function hasStructuredAnswerFields(answerFormat: AnswerFormat) {
  return Boolean(answerFormat.fields?.length);
}
