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
    /\\lim_\{x\s*\\to\s*\\infty\}[^$]*?\\frac\{(\d+)x\s*\+\s*\d+\}\{(\d+)x\s*\+\s*\d+\}/,
  );
  if (infMatch) {
    const p = Number(infMatch[1]);
    const r = Number(infMatch[2]);
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
    /\\begin\{cases\}\s*(-?\d+)x\s*\+\s*(-?\d+)\s*,/,
  );
  if (!firstMatch) return null;
  const m = Number(firstMatch[1]);
  const bConst = Number(firstMatch[2]);
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
    /f\(x\)\s*=\s*\\sqrt\{(\d+)x\s*-\s*(\d+)\}/,
  );
  if (sqrtMatch) {
    const a = Number(sqrtMatch[1]);
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
