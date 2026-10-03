function gcd(a: number, b: number): number {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y) {
    const next = y;
    y = x % y;
    x = next;
  }
  return x || 1;
}

export function formatRational(numerator: number, denominator: number): string {
  if (denominator === 0) return "";

  const sign = denominator < 0 ? -1 : 1;
  const normalizedNumerator = numerator * sign;
  const normalizedDenominator = Math.abs(denominator);
  const divisor = gcd(normalizedNumerator, normalizedDenominator);
  const reducedNumerator = normalizedNumerator / divisor;
  const reducedDenominator = normalizedDenominator / divisor;

  return reducedDenominator === 1
    ? String(reducedNumerator)
    : `${reducedNumerator}/${reducedDenominator}`;
}

export function parseQuadraticCoefficients(problemStatement: string) {
  const compact = problemStatement
    .replace(/\\\(|\\\)|\\\[|\\\]|\$\$|\$/g, "")
    .replace(/\s+/g, "");

  // Both non-leading terms are optional: a zero coefficient is simply not
  // printed, so "x^2 + 3x = 0" (c = 0) and "x^2 = 0" are valid statements.
  const match = compact.match(/x\^2(?:([+-])(\d*)x)?(?:([+-]\d+))?=0/);
  if (!match) return null;

  const bSign = match[1];
  const bCoefficient = match[2];
  const b = bSign
    ? (bSign === "-" ? -1 : 1) * (bCoefficient ? Number(bCoefficient) : 1)
    : 0;
  const c = match[3] ? Number(match[3]) : 0;

  if (Number.isNaN(b) || Number.isNaN(c)) return null;
  return { b, c };
}

function parseNumericToken(token: string): number | null {
  if (token.includes("/")) {
    const [rawNumerator, rawDenominator] = token.split("/");
    const numerator = Number(rawNumerator);
    const denominator = Number(rawDenominator);

    if (
      Number.isFinite(numerator) &&
      Number.isFinite(denominator) &&
      denominator !== 0
    ) {
      return numerator / denominator;
    }
    return null;
  }

  const value = Number(token);
  return Number.isFinite(value) ? value : null;
}

export function computeQuadraticRoots(problemStatement: string) {
  const coefficients = parseQuadraticCoefficients(problemStatement);
  if (!coefficients) return null;

  const { b, c } = coefficients;
  const discriminant = b * b - 4 * c;
  if (discriminant < 0) return null;

  const sqrtDiscriminant = Math.sqrt(discriminant);
  if (!Number.isInteger(sqrtDiscriminant)) return null;

  const roots = [
    formatRational(-b - sqrtDiscriminant, 2),
    formatRational(-b + sqrtDiscriminant, 2),
  ].sort(
    (left, right) =>
      (parseNumericToken(left) ?? 0) - (parseNumericToken(right) ?? 0),
  );

  return Array.from(new Set(roots));
}

export function parseNumericList(raw: string): number[] {
  const normalized = raw
    .replace(/\\[dt]?frac\{(-?\d+)\}\{(-?\d+)\}/g, "$1/$2")
    .replace(/\\\(|\\\)|\\\[|\\\]|\$\$|\$/g, "")
    .replace(/[a-zA-Z]+_\{?\d+\}?/g, "")
    .replace(/[a-zA-Z]+_\(\d+\)/g, "")
    .replace(/(-?\d+(?:\.\d+)?)\s*(?:\+\/-|±)\s*\\sqrt\{(\d+(?:\.\d+)?)\}/g, (_, n, m) => {
      const base = Number(n);
      const root = Math.sqrt(Number(m));
      return `${base + root}, ${base - root}`;
    })
    .replace(/(-?\d+(?:\.\d+)?)\s*(?:\+\/-|±)\s*sqrt\((\d+(?:\.\d+)?)\)/g, (_, n, m) => {
      const base = Number(n);
      const root = Math.sqrt(Number(m));
      return `${base + root}, ${base - root}`;
    })
    .replace(/(-?\d+(?:\.\d+)?)\s*(?:\+\/-|±)\s*(-?\d+(?:\.\d+)?)/g, (_, n, m) => {
      const base = Number(n);
      const offset = Number(m);
      return `${base + offset}, ${base - offset}`;
    })
    // Evaluate combined "n ± sqrt(m)" / "n ± \sqrt{m}" before extracting bare digits
    .replace(/(-?\d+(?:\.\d+)?)\s*\+\s*\\sqrt\{(\d+(?:\.\d+)?)\}/g, (_, n, m) => String(Number(n) + Math.sqrt(Number(m))))
    .replace(/(-?\d+(?:\.\d+)?)\s*\+\s*sqrt\((\d+(?:\.\d+)?)\)/g, (_, n, m) => String(Number(n) + Math.sqrt(Number(m))))
    .replace(/(-?\d+(?:\.\d+)?)\s*-\s*\\sqrt\{(\d+(?:\.\d+)?)\}/g, (_, n, m) => String(Number(n) - Math.sqrt(Number(m))))
    .replace(/(-?\d+(?:\.\d+)?)\s*-\s*sqrt\((\d+(?:\.\d+)?)\)/g, (_, n, m) => String(Number(n) - Math.sqrt(Number(m))))
    // Then evaluate any remaining standalone sqrt expressions
    .replace(/\\sqrt\{(\d+(?:\.\d+)?)\}/g, (_, m) => String(Math.sqrt(Number(m))))
    .replace(/sqrt\((\d+(?:\.\d+)?)\)/g, (_, m) => String(Math.sqrt(Number(m))));

  return (
    normalized.match(/[-+]?\d+(?:\.\d+)?(?:\/[-+]?\d+(?:\.\d+)?)?/g) ?? []
  )
    .map(parseNumericToken)
    .filter((value): value is number => value !== null);
}

export function parseSingleNumericAnswer(raw: string): number | null {
  const values = parseNumericList(raw);
  if (values.length === 0) return null;
  return values[values.length - 1] ?? null;
}

export function parseSimpleRelation(raw: string) {
  const normalized = raw
    .replace(/\\boxed\{([^}]*)\}/g, "$1")
    .replace(/\\dfrac/g, "\\frac")
    .replace(/\\frac\{(-?\d+)\}\{(-?\d+)\}/g, "$1/$2")
    .replace(/\\neq/g, "!=")
    .replace(/\bnot\s+equal\s+to\b/gi, "!=")
    .replace(/\bnot\s+equal\b/gi, "!=")
    .replace(/\bneq\b/gi, "!=")
    .replace(/\\\(|\\\)|\\\[|\\\]|\$\$|\$/g, "")
    .trim();

  const match = normalized.match(
    /^([a-zA-Z]+(?:_\d+)?)\s*(=|!=)\s*(-?\d+(?:\.\d+)?(?:\/-?\d+(?:\.\d+)?)?)$/,
  );
  if (!match) return null;

  const value = parseNumericToken(match[3]);
  if (value === null) return null;

  return {
    variable: match[1],
    operator: match[2] as "=" | "!=",
    value,
  };
}

function sameNumericSet(left: number[], right: number[]) {
  if (left.length !== right.length) return false;

  const leftSorted = [...left].sort((a, b) => a - b);
  const rightSorted = [...right].sort((a, b) => a - b);

  return leftSorted.every(
    (value, index) => Math.abs(value - rightSorted[index]) < 1e-8,
  );
}

export function isNumericListEquivalent(
  studentAnswer: string,
  groundTruth: string,
) {
  const truthValues = parseNumericList(groundTruth);
  if (!groundTruth.trim().startsWith("[") || truthValues.length === 0) {
    return null;
  }

  const studentValues = parseNumericList(studentAnswer);
  if (studentValues.length < truthValues.length) return false;

  if (sameNumericSet(studentValues, truthValues)) return true;

  const finalValues = studentValues.slice(-truthValues.length);
  return sameNumericSet(finalValues, truthValues);
}
