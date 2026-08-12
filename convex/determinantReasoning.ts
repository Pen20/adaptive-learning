import nerdamer from "nerdamer";

function normalizeArithmetic(raw: string) {
  return raw
    .replace(/\\\(|\\\)|\$+/g, "")
    .replace(/\\(?:times|cdot)/g, "*")
    .replace(/[×·]/g, "*")
    .replace(/[−–—]/g, "-")
    .replace(/\\left|\\right/g, "")
    .replace(/\\det\s*\([^)]*\)|det\s*\([^)]*\)|\|[^|]+\|/gi, "")
    .replace(/\s+/g, "")
    .replace(/(\d|\))\(/g, "$1*(")
    .replace(/\)(\d|[a-zA-Z])/g, ")*$1");
}

function normalizeSymbolic(raw: string) {
  return normalizeArithmetic(raw)
    .replace(/\^\{([^}]+)\}/g, "^($1)")
    .replace(/[{}]/g, "");
}

function symbolicEquivalent(left: string, right: string) {
  try {
    const difference = nerdamer(`(${normalizeSymbolic(left)})-(${normalizeSymbolic(right)})`)
      .expand()
      .text();
    return difference === "0";
  } catch {
    return false;
  }
}

export type ParameterReasoningStatus =
  | "not_verified"
  | "correct_but_incomplete"
  | "correct";

export function analyzeSingularParameterReasoning(
  reasoning: string,
  expectedExpression: string,
  expectedParameter: string,
): ParameterReasoningStatus {
  const parts = reasoning
    .replace(/\r/g, "")
    .split(/[=\n.;]/)
    .map((part) => part.trim())
    .filter(Boolean);
  const expressionFound = parts.some((part) =>
    symbolicEquivalent(part, expectedExpression),
  );
  if (!expressionFound) return "not_verified";

  const zeroConditionShown = /(?:=|equals?)0\b/i.test(
    reasoning.replace(/\s+/g, ""),
  );
  const parameterMatches = Array.from(
    reasoning.matchAll(/\bk\s*=\s*([^,;.\n]+)/gi),
    (match) => match[1]?.trim() ?? "",
  );
  const parameterSolved = parameterMatches.some((part) =>
    symbolicEquivalent(part, expectedParameter),
  );

  return zeroConditionShown && parameterSolved
    ? "correct"
    : "correct_but_incomplete";
}

function numericValue(expression: string): number | null {
  if (!expression || /[a-zA-Z]/.test(expression)) return null;
  try {
    const value = Number(nerdamer(expression).evaluate().text("decimals"));
    return Number.isFinite(value) ? value : null;
  } catch {
    return null;
  }
}

export function verifyNumericDeterminantReasoning(
  reasoning: string,
  expectedDeterminant: string,
) {
  const expected = Number(expectedDeterminant);
  if (!Number.isFinite(expected)) return false;

  const compact = reasoning.replace(/\r/g, "");
  const hasDeterminantStructure =
    /det|\|\s*[A-Za-z]\s*\||minor|cofactor/i.test(compact) &&
    (compact.match(/\([^)]*[+\-*/×·][^)]*\)/g)?.length ?? 0) >= 2;
  if (!hasDeterminantStructure) return false;

  const candidates = compact
    .split(/[=\n]/)
    .map(normalizeArithmetic)
    .filter(Boolean);

  return candidates.some((candidate) => {
    const value = numericValue(candidate);
    return value !== null && Math.abs(value - expected) < 1e-9;
  });
}
