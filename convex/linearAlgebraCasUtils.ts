/**
 * Pure (no-Convex, no-nerdamer) CAS utilities for the elementary linear-algebra
 * topics. Exported so they can be unit-tested without the Convex runtime;
 * cas.ts imports from here for the direct-computation path.
 */
import { formatRational } from "./mathAnswerUtils";
import { coefficientValue, type CasDirectResult } from "./calculusCasUtils";

/** Strips math delimiters and whitespace so the regexes below stay readable. */
function compact(problemStatement: string): string {
  return problemStatement
    .replace(/\\\(|\\\)|\\\[|\\\]|\$\$|\$/g, "")
    .replace(/\\left|\\right|\\!|\\,|\\;/g, "")
    .replace(/\s+/g, "");
}

// ── Linear equations: ax + b = c ─────────────────────────────────────────────

export function parseLinearEquationGroundTruth(
  problemStatement: string,
): CasDirectResult {
  const text = compact(problemStatement);
  // A quadratic would also match "…x…=…"; refuse anything with a power of x.
  if (/x\^/.test(text)) return null;

  const match = text.match(/(-?\d*)x(?:([+-])(\d+))?=(-?\d+)/);
  if (!match) return null;

  const a = coefficientValue(match[1]);
  const b = match[2] ? (match[2] === "-" ? -1 : 1) * Number(match[3]) : 0;
  const c = Number(match[4]);
  if (!Number.isFinite(a) || a === 0 || !Number.isFinite(b) || !Number.isFinite(c)) {
    return null;
  }

  const answer = formatRational(c - b, a);
  if (!answer) return null;

  return {
    isComputable: true,
    groundTruth: answer,
    expression: `(${c} - (${b})) / ${a}`,
    description: `Solving ${a}x + (${b}) = ${c} gives x = ${answer}`,
  };
}

// ── Linear systems: value of k that leaves the system with no solution ───────

type SystemRow = { x: number; y: number | "k"; constant: number };

function parseSystemRow(row: string): SystemRow | null {
  const match = row.match(/^(-?\d*)x([+-])(k|-?\d*)y=(-?\d+)$/);
  if (!match) return null;

  const x = coefficientValue(match[1]);
  if (!Number.isFinite(x)) return null;

  const sign = match[2] === "-" ? -1 : 1;
  const constant = Number(match[4]);
  if (!Number.isFinite(constant)) return null;

  if (match[3] === "k") {
    // "…- ky = c" would mean the parameter enters negated; the generators never
    // print that, and mis-signing k would be worse than deferring to the AI.
    if (sign === -1) return null;
    return { x, y: "k", constant };
  }

  const y = sign * coefficientValue(match[3]);
  if (!Number.isFinite(y)) return null;
  return { x, y, constant };
}

export function parseLinearSystemGroundTruth(
  problemStatement: string,
): CasDirectResult {
  if (!/no\s+solution/i.test(problemStatement)) return null;

  const body = compact(problemStatement).match(
    /\\begin\{cases\}(.*?)\\end\{cases\}/,
  );
  if (!body) return null;

  const rows = body[1]
    .split("\\\\")
    .map((row) => row.trim())
    .filter(Boolean)
    .map(parseSystemRow);
  if (rows.length !== 2 || rows.some((row) => row === null)) return null;

  const [first, second] = rows as SystemRow[];
  // Exactly one row must carry the unknown parameter.
  if (typeof first.y !== "number" || second.y !== "k") return null;
  if (first.x === 0) return null;

  // No solution ⟺ the coefficient rows are proportional (parallel lines) while
  // the constants are not (distinct lines):  a1/a2 = b1/k  and  a1·c2 ≠ a2·c1.
  if (first.x * second.constant === second.x * first.constant) return null;

  const answer = formatRational(first.y * second.x, first.x);
  if (!answer) return null;

  return {
    isComputable: true,
    groundTruth: answer,
    expression: `(${first.y} * ${second.x}) / ${first.x}`,
    description: `Parallel-line condition a1/a2 = b1/k gives k = ${answer}`,
  };
}
