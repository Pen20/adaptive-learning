/**
 * Pure (no-Convex, no-nerdamer) CAS utilities for calculus topics.
 * Exported so they can be unit-tested without the Convex runtime.
 * cas.ts imports from here for the direct-computation path.
 */

export function gcdCalc(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) {
    const t = b;
    b = a % b;
    a = t;
  }
  return a || 1;
}

export function reduceFraction(num: number, den: number): string {
  const g = gcdCalc(num, den);
  return den / g === 1 ? String(num / g) : `${num / g}/${den / g}`;
}

/**
 * Coefficient captured from a statement, where a leading 1 is printed
 * implicitly: "x + 3" means 1, "-x + 3" means -1 (see src/data/topics/format.ts).
 */
export function coefficientValue(captured: string | undefined): number {
  if (captured === undefined) return NaN;
  if (captured === "" || captured === "+") return 1;
  if (captured === "-") return -1;
  return Number(captured);
}

// ── Limits ────────────────────────────────────────────────────────────────────

export type CasDirectResult = {
  isComputable: true;
  groundTruth: string;
  expression: string;
  description: string;
} | null;

export function parseLimitGroundTruth(
  problemStatement: string,
): CasDirectResult {
  // Type 0 — factoring: lim_{x→a} (x²-a²)/(x-a) = 2a
  const factorMatch = problemStatement.match(
    /\\lim_\{x\s*\\to\s*(-?\d+)\}[^$]*?\\frac\{x\^2\s*-\s*(\d+)\}/,
  );
  if (factorMatch) {
    const a = Number(factorMatch[1]);
    const aSquared = Number(factorMatch[2]);
    if (Math.abs(a * a - aSquared) < 1e-9) {
      const answer = 2 * a;
      return {
        isComputable: true,
        groundTruth: String(answer),
        expression: `2 * ${a}`,
        description: `Difference-of-squares limit at x = ${a}; answer = ${answer}`,
      };
    }
  }

  // Type 1 — cancellation: lim_{x→a} (bx+c)(x-a)/(x-a) = ba+c
  const cancelMatch = problemStatement.match(
    /\\lim_\{x\s*\\to\s*(-?\d+)\}[^$]*?\\frac\{\((\d+)x\s*\+\s*(\d+)\)/,
  );
  if (cancelMatch) {
    const a = Number(cancelMatch[1]);
    const b = Number(cancelMatch[2]);
    const c = Number(cancelMatch[3]);
    const answer = b * a + c;
    return {
      isComputable: true,
      groundTruth: String(answer),
      expression: `${b}*${a} + ${c}`,
      description: `Cancellation limit at x = ${a}; answer = ${answer}`,
    };
  }

  // Type 2 — direct substitution: lim_{x→a} (bx²+c) = ba²+c
  const polyMatch = problemStatement.match(
    /\\lim_\{x\s*\\to\s*(-?\d+)\}\s*\((\d+)x\^2\s*\+\s*(\d+)\)/,
  );
  if (polyMatch) {
    const a = Number(polyMatch[1]);
    const b = Number(polyMatch[2]);
    const c = Number(polyMatch[3]);
    const answer = b * a * a + c;
    return {
      isComputable: true,
      groundTruth: String(answer),
      expression: `${b}*${a}^2 + ${c}`,
      description: `Direct substitution at x = ${a}; answer = ${answer}`,
    };
  }

  // Type 3 — limit at infinity: lim_{x→∞} (px+q)/(rx+s) = p/r
  const infMatch = problemStatement.match(
    /\\lim_\{x\s*\\to\s*\\infty\}[^$]*?\\frac\{(-?\d*)x\s*\+\s*\d+\}\{(-?\d*)x\s*\+\s*\d+\}/,
  );
  if (infMatch) {
    const p = coefficientValue(infMatch[1]);
    const r = coefficientValue(infMatch[2]);
    const groundTruth = reduceFraction(p, r);
    return {
      isComputable: true,
      groundTruth,
      expression: `${p}/${r}`,
      description: `Limit at infinity: leading-term ratio ${p}/${r} = ${groundTruth}`,
    };
  }

  return null;
}

// ── Piecewise Continuity ──────────────────────────────────────────────────────

export function parsePiecewiseGroundTruth(
  problemStatement: string,
): CasDirectResult {
  const boundaryMatch = problemStatement.match(/at\s*\$x\s*=\s*(-?\d+)\$/);
  if (!boundaryMatch) return null;
  const x1 = Number(boundaryMatch[1]);

  const firstMatch = problemStatement.match(
    /\\begin\{cases\}\s*(-?\d*)x\s*\+\s*(-?\d+)\s*,/,
  );
  if (!firstMatch) return null;
  const m = coefficientValue(firstMatch[1]);
  const bConst = Number(firstMatch[2]);
  if (!Number.isFinite(m)) return null;
  const leftLimit = m * x1 + bConst;

  const secondMatch = problemStatement.match(/\\\\\s*x\s*\+\s*(-?\d+)\s*,/);
  if (!secondMatch) return null;
  const q = Number(secondMatch[1]);
  const rightValue = x1 + q;

  const isContinuous = Math.abs(leftLimit - rightValue) < 1e-9;
  const verdict = isContinuous ? "continuous" : "discontinuous";

  return {
    isComputable: true,
    groundTruth: verdict,
    expression: `leftLimit=${leftLimit}, rightValue=${rightValue}`,
    description: `Left limit = ${leftLimit}, right value = ${rightValue} at x = ${x1} → ${verdict}`,
  };
}

// ── Domain & Range ────────────────────────────────────────────────────────────

export function parseDomainRangeGroundTruth(
  problemStatement: string,
): CasDirectResult {
  // Type 0: f(x) = a + |x² - b|
  const absMatch = problemStatement.match(
    /f\(x\)\s*=\s*(-?\d+)\s*\+\s*\|x\^2\s*-\s*(-?\d+)\|/,
  );
  if (absMatch) {
    const a = Number(absMatch[1]);
    return {
      isComputable: true,
      groundTruth: `Domain: (-inf, inf), Range: [${a}, inf)`,
      expression: `minValue=${a}`,
      description: `Minimum value of f is ${a}`,
    };
  }

  // Type 1: f(x) = sqrt(ax - b)
  const sqrtMatch = problemStatement.match(
    /f\(x\)\s*=\s*\\sqrt\{(-?\d*)x\s*-\s*(\d+)\}/,
  );
  if (sqrtMatch) {
    const a = coefficientValue(sqrtMatch[1]);
    const b = Number(sqrtMatch[2]);
    const lower = reduceFraction(b, a);
    return {
      isComputable: true,
      groundTruth: `Domain: [${lower}, inf), Range: [0, inf)`,
      expression: `lowerBound=${b}/${a}`,
      description: `Radicand non-negative requires x ≥ ${lower}`,
    };
  }

  // Type 2: f(x) = c / (x - a)
  const rationalMatch = problemStatement.match(
    /f\(x\)\s*=\s*\\frac\{(-?\d+)\}\{x\s*-\s*(-?\d+)\}/,
  );
  if (rationalMatch) {
    const a = Number(rationalMatch[2]);
    return {
      isComputable: true,
      groundTruth: `Domain: R\\{${a}}, Range: R\\{0}`,
      expression: `excludedX=${a}`,
      description: `Denominator zero at x = ${a}`,
    };
  }

  return null;
}

// ── Domain & Range answer comparison ──────────────────────────────────────────
//
// Interval answers used to be handed straight to the AI grader because they are
// prose-like. They are in fact a small, closed language: the three generated
// families have answers "all reals", "[bound, inf)" and "R without one point".
// Canonicalising both sides lets the deterministic grader settle them, and any
// expression that does NOT canonicalise returns null so the AI still decides —
// a student is never marked wrong just because the parser did not recognise a
// notation.

function normalizeSetText(raw: string): string {
  return raw
    .replace(/\\left|\\right|\\!|\\,|\\;/g, "")
    .replace(/\\\(|\\\)|\\\[|\\\]|\$\$|\$/g, "")
    .replace(/\\mathbb\{R\}|\\mathbf\{R\}|ℝ/g, "R")
    .replace(/\\infty|∞/g, "inf")
    .replace(/\binfinity\b/gi, "inf")
    .replace(/\\setminus|\\backslash/g, "\\")
    .replace(/\\cup|∪/g, "U")
    .replace(/\\in\b|∈/g, " in ")
    .replace(/\\geq|\\ge\b|≥/g, ">=")
    .replace(/\\leq|\\le\b|≤/g, "<=")
    .replace(/\\neq|\\ne\b|≠/g, "!=")
    .replace(/\\([{}])/g, "$1")
    .replace(/\\[a-zA-Z]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** "3", "-2", "3/2", "1.5" → number; anything else → null. */
function numericToken(raw: string): number | null {
  const token = raw.trim();
  const fraction = /^(-?\d+)\s*\/\s*(-?\d+)$/.exec(token);
  if (fraction && Number(fraction[2]) !== 0) {
    return Number(fraction[1]) / Number(fraction[2]);
  }
  return /^-?\d+(?:\.\d+)?$/.test(token) ? Number(token) : null;
}

/**
 * Canonical form of one set expression:
 *   "R"          — all real numbers
 *   "[a,inf)"    — closed ray
 *   "R\{a}"      — the reals minus one point
 * Returns null for anything else (including empty or unrecognised text).
 */
export function canonicalizeSetExpression(raw: string): string | null {
  const text = normalizeSetText(raw)
    .toLowerCase()
    .replace(/^(?:the\s+)?(?:set\s+of\s+)?/, "")
    .replace(/f\(x\)|\by\b/g, "x")
    .replace(/\s+/g, " ")
    .trim();
  if (!text) return null;

  const compact = text.replace(/\s+/g, "");

  // R minus a point: "r\{4}", "x!=4", "all reals except 4"
  const excludedPatterns = [
    /^r\\?\{(-?[\d./]+)\}$/,
    /^x!=(-?[\d./]+)$/,
    /^allrealsexcept(-?[\d./]+)$/,
    /^allrealnumbersexcept(-?[\d./]+)$/,
  ];
  for (const pattern of excludedPatterns) {
    const match = pattern.exec(compact);
    if (!match) continue;
    const value = numericToken(match[1]);
    return value === null ? null : `R\\{${value}}`;
  }

  // Same set written as a union: "(-inf,4)u(4,inf)"
  const union = /^\(-inf,(-?[\d./]+)\)u\((-?[\d./]+),inf\)$/.exec(compact);
  if (union) {
    const left = numericToken(union[1]);
    const right = numericToken(union[2]);
    if (left === null || right === null || left !== right) return null;
    return `R\\{${left}}`;
  }

  // All reals: "(-inf,inf)", "r", "allreals", "xinr"
  if (/^\(-inf,inf\)$/.test(compact) || /^r$/.test(compact) || /^allreals$/.test(compact)) {
    return "R";
  }
  if (/^xinr$/.test(compact) || /^allrealnumbers$/.test(compact)) return "R";

  // Closed ray: "[2,inf)", "x>=2"
  const ray = /^\[(-?[\d./]+),inf\)$/.exec(compact) ?? /^x>=(-?[\d./]+)$/.exec(compact);
  if (ray) {
    const bound = numericToken(ray[1]);
    return bound === null ? null : `[${bound},inf)`;
  }

  return null;
}

/**
 * Splits an answer into its domain and range halves and canonicalises both.
 * Accepts "Domain: X, Range: Y", "X and Y", and "X ; Y".
 */
export function canonicalizeDomainRangeAnswer(
  raw: string,
): { domain: string; range: string } | null {
  const text = normalizeSetText(raw);

  let domainPart: string | undefined;
  let rangePart: string | undefined;

  const labelled = /domain\s*[:=]?\s*([\s\S]*?)(?:,|;|\band\b)?\s*range\s*[:=]?\s*([\s\S]*)$/i.exec(
    text,
  );
  if (labelled) {
    domainPart = labelled[1];
    rangePart = labelled[2];
  } else {
    const halves = text.split(/\s+and\s+|\s*;\s*/i);
    if (halves.length === 2) {
      [domainPart, rangePart] = halves;
    }
  }

  if (!domainPart || !rangePart) return null;

  const domain = canonicalizeSetExpression(domainPart.replace(/[.,\s]+$/, ""));
  const range = canonicalizeSetExpression(rangePart.replace(/[.,\s]+$/, ""));
  if (!domain || !range) return null;

  return { domain, range };
}

/**
 * Deterministic verdict for a domain/range answer, or null when either side
 * cannot be canonicalised (the AI grader then decides).
 */
export function isDomainRangeEquivalent(
  studentAnswer: string,
  groundTruth: string,
): boolean | null {
  const truth = canonicalizeDomainRangeAnswer(groundTruth);
  if (!truth) return null;
  const student = canonicalizeDomainRangeAnswer(studentAnswer);
  if (!student) return null;
  return student.domain === truth.domain && student.range === truth.range;
}
