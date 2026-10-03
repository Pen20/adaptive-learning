import { internalAction } from "./_generated/server";
import { errorMessage } from "./errors";
import { v } from "convex/values";
import nerdamer from "nerdamer";
import "nerdamer/Algebra.js";
import "nerdamer/Calculus.js";
import "nerdamer/Solve.js";
import {
  computeQuadraticRoots,
  formatRational,
  isNumericListEquivalent,
  parseSimpleRelation,
  parseSingleNumericAnswer,
} from "./mathAnswerUtils";
import {
  isDomainRangeEquivalent,
  parseLimitGroundTruth,
  parsePiecewiseGroundTruth,
  parseDomainRangeGroundTruth,
} from "./calculusCasUtils";
import {
  parseLinearEquationGroundTruth,
  parseLinearSystemGroundTruth,
} from "./linearAlgebraCasUtils";

/**
 * Strips LaTeX wrappers and converts to nerdamer-compatible syntax.
 * Handles trig/log functions before stripping remaining LaTeX commands.
 */
function toNerdamerExpr(raw: string): string {
  if (/\\neq|\\leq|\\geq|\\approx/.test(raw)) {
    throw new Error("Relational statement deferred to AI grader");
  }

  return raw
    .replace(/\\\(|\\\)|\\\[|\\\]/g, "")
    .replace(/\$\$|\$/g, "")
    // Strip derivative prefix like "f'(x) =" or "g'(x) ="
    .replace(/[a-z]'\([^)]*\)\s*=\s*/g, "")
    // Named function prefix: "f(x) =" etc.
    .replace(/[a-z]\([^)]*\)\s*=\s*/g, "")
    .replace(/\\[dt]frac\{([^}]+)\}\{([^}]+)\}/g, "($1)/($2)")
    .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, "($1)/($2)")
    // LaTeX exponent braces: e^{2x} → e^(2x), x^{3} → x^(3)
    .replace(/\^\{([^}]+)\}/g, "^($1)")
    // Adjacent parenthesised factors: (a)(b) → (a)*(b)
    .replace(/\)\s*\(/g, ")*(")
    .replace(/\\sqrt\[([^\]]+)\]\{([^}]+)\}/g, "($2)^(1/$1)")
    .replace(/\\sqrt\{([^}]+)\}/g, "sqrt($1)")
    .replace(/\\sqrt/g, "sqrt")
    // Handle trig and log BEFORE the generic \\[a-zA-Z]+ strip
    .replace(/\\sin\b/g, "sin")
    .replace(/\\cos\b/g, "cos")
    .replace(/\\tan\b/g, "tan")
    .replace(/\\ln\b/g, "log")
    .replace(/\\log\b/g, "log")
    .replace(/\\exp\b/g, "e^")
    .replace(/\\cdot/g, "*")
    .replace(/\\times/g, "*")
    .replace(/\\left|\\right/g, "")
    .replace(/\\begin\{[^}]+\}|\\end\{[^}]+\}/g, "")
    .replace(/\\pi/g, "pi")
    .replace(/\\infty/g, "infinity")
    .replace(/\\[a-zA-Z]+/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * nerdamer returns an Expression object (with .text()) for most operations, but
 * plain strings and numbers for others, so the input is narrowed rather than
 * typed against the library.
 */
function formatResult(result: unknown): string {
  if (result === null || result === undefined) return "";
  if (typeof result === "string") return result;
  if (typeof result === "object" && "text" in result) {
    const { text } = result as { text: unknown };
    if (typeof text === "function") return String(text.call(result));
  }
  return String(result);
}

function parseLatexMatrix(problemStatement: string): string[][] | null {
  const matrixMatch = problemStatement.match(
    /\\begin\{(?:bmatrix|vmatrix|pmatrix|matrix)\}([\s\S]*?)\\end\{(?:bmatrix|vmatrix|pmatrix|matrix)\}/,
  );
  if (!matrixMatch) return null;

  return matrixMatch[1]
    .split(/\\\\/)
    .map((row) => row.trim())
    .filter(Boolean)
    .map((row) =>
      row
        .split("&")
        .map((cell) => cell.replace(/\$/g, "").trim())
        .filter(Boolean),
    );
}

function parseNumericMatrix(problemStatement: string): number[][] | null {
  const matrix = parseLatexMatrix(problemStatement);
  if (!matrix) return null;

  const numeric = matrix.map((row) => row.map((cell) => Number(cell)));
  if (numeric.some((row) => row.some((value) => Number.isNaN(value)))) {
    return null;
  }

  return numeric;
}

function det3(matrix: number[][]): number {
  const a = matrix.flat();
  return (
    a[0] * (a[4] * a[8] - a[5] * a[7]) -
    a[1] * (a[3] * a[8] - a[5] * a[6]) +
    a[2] * (a[3] * a[7] - a[4] * a[6])
  );
}

function parsePolynomialCoefficients(
  polynomial: string,
): [number, number, number] | null {
  const coefficients: [number, number, number] = [0, 0, 0];
  const compact = polynomial.replace(/\s+/g, "");
  const terms = compact.match(/[+-]?[^+-]+/g);
  if (!terms) return null;

  const parseCoefficient = (raw: string) => {
    if (raw === "" || raw === "+") return 1;
    if (raw === "-") return -1;
    const numeric = Number(raw);
    return Number.isFinite(numeric) ? numeric : null;
  };

  for (const term of terms) {
    if (term.includes("x^2")) {
      const coefficient = parseCoefficient(term.replace("x^2", ""));
      if (coefficient === null) return null;
      coefficients[2] += coefficient;
      continue;
    }

    if (term.includes("x")) {
      const coefficient = parseCoefficient(term.replace("x", ""));
      if (coefficient === null) return null;
      coefficients[1] += coefficient;
      continue;
    }

    const constant = Number(term);
    if (!Number.isFinite(constant)) return null;
    coefficients[0] += constant;
  }

  return coefficients;
}

function computePolynomialInnerProductDirect(problemStatement: string) {
  const pMatch = problemStatement.match(/\$\$\s*p\s*=\s*([\s\S]*?)\s*\$\$/);
  const qMatch = problemStatement.match(/\$\$\s*q\s*=\s*([\s\S]*?)\s*\$\$/);
  if (!pMatch || !qMatch) return null;

  const pCoefficients = parsePolynomialCoefficients(pMatch[1]);
  const qCoefficients = parsePolynomialCoefficients(qMatch[1]);
  if (!pCoefficients || !qCoefficients) return null;

  const innerProduct = pCoefficients.reduce(
    (sum, coefficient, index) => sum + coefficient * qCoefficients[index],
    0,
  );

  return {
    isComputable: true,
    groundTruth: String(innerProduct),
    expression: String(innerProduct),
    description:
      "Standard inner product of P2 polynomials computed from coefficient vectors",
  };
}

function computeEigenvalues3x3Direct(problemStatement: string) {
  const numericMatrix = parseNumericMatrix(problemStatement);
  if (
    !numericMatrix ||
    numericMatrix.length !== 3 ||
    !numericMatrix.every((row) => row.length === 3)
  )
    return null;

  const [[m00, m01, m02], [m10, m11, m12], [a, b, c]] = numericMatrix;
  if (
    m00 !== 0 ||
    m01 !== 1 ||
    m02 !== 0 ||
    m10 !== 0 ||
    m11 !== 0 ||
    m12 !== 1
  )
    return null;

  const poly = (x: number) => x ** 3 - c * x ** 2 - b * x - a;
  const bound = Math.max(Math.abs(a) + 1, 20);
  let r1: number | null = null;
  for (let x = -bound; x <= bound; x++) {
    if (Math.abs(poly(x)) < 1e-9) {
      r1 = x;
      break;
    }
  }
  if (r1 === null) return null;

  const B = r1 - c;
  const C = r1 * B - b;
  const disc = B * B - 4 * C;
  if (disc < 0) return null;

  const e2 = (-B + Math.sqrt(disc)) / 2;
  const e3 = (-B - Math.sqrt(disc)) / 2;
  const eigenvalues = [r1, e2, e3].sort((x, y) => x - y);
  const groundTruth = `[${eigenvalues.map((e) => e.toPrecision(14)).join(", ")}]`;

  return {
    isComputable: true,
    groundTruth,
    expression: groundTruth,
    description: `Eigenvalues of the 3×3 companion matrix`,
  };
}

// ── Calculus CAS helpers ──────────────────────────────────────────────────────

/**
 * Evaluate a nerdamer expression at a specific x value. Returns null on error.
 */
function formatNumericEigenvalue(value: number) {
  if (Math.abs(value - Math.round(value)) < 1e-8) {
    return String(Math.round(value));
  }
  return Number(value.toPrecision(14)).toString();
}

function computeEigenvalues2x2Direct(problemStatement: string) {
  const numericMatrix = parseNumericMatrix(problemStatement);
  if (
    !numericMatrix ||
    numericMatrix.length !== 2 ||
    !numericMatrix.every((row) => row.length === 2)
  ) {
    return null;
  }

  const [[a, b], [c, d]] = numericMatrix;
  const trace = a + d;
  const determinant = a * d - b * c;
  const discriminant = trace * trace - 4 * determinant;
  if (discriminant < -1e-9) return null;

  const sqrtDiscriminant = Math.sqrt(Math.max(0, discriminant));
  const eigenvalues = [
    (trace - sqrtDiscriminant) / 2,
    (trace + sqrtDiscriminant) / 2,
  ].sort((left, right) => left - right);

  const groundTruth = `[${eigenvalues.map(formatNumericEigenvalue).join(", ")}]`;
  return {
    isComputable: true,
    groundTruth,
    expression: groundTruth,
    description: "Eigenvalues of the displayed 2x2 matrix",
  };
}

function evalAt(expr: string, x: number): number | null {
  try {
    // .evaluate() forces numeric evaluation — without it, expressions
    // containing e/pi stay symbolic and Number() yields NaN.
    const val = Number(
      nerdamer(expr, { x: String(x) }).evaluate().text("decimals"),
    );
    return Number.isFinite(val) ? val : null;
  } catch {
    return null;
  }
}

/**
 * Check two symbolic function expressions are numerically equivalent by
 * sampling at several x values.
 */
function numericallyEquivalentFunctions(
  expr1: string,
  expr2: string,
): boolean {
  const testPoints = [0.25, 0.5, 1.0, 1.5, 2.0];
  let checked = 0;
  let matched = 0;
  for (const x of testPoints) {
    const v1 = evalAt(expr1, x);
    const v2 = evalAt(expr2, x);
    if (v1 === null || v2 === null) continue;
    checked++;
    if (Math.abs(v1 - v2) < 1e-6) matched++;
  }
  return checked >= 3 && matched === checked;
}

// ── Derivatives ───────────────────────────────────────────────────────────────

function computeDerivativeDirectly(problemStatement: string) {
  // Type: f(x) = A cos(Bx)
  const cosMatch = problemStatement.match(
    /f\(x\)\s*=\s*(-?\d+)\s*\\cos\((\d+)x\)/,
  );
  if (cosMatch) {
    const a = Number(cosMatch[1]);
    const b = Number(cosMatch[2]);
    try {
      const groundTruth = formatResult(
        nerdamer(`diff(${a}*cos(${b}*x), x)`),
      );
      return {
        isComputable: true,
        groundTruth,
        expression: `diff(${a}*cos(${b}*x), x)`,
        description: `d/dx[${a}cos(${b}x)] by chain rule`,
      };
    } catch {
      return null;
    }
  }

  // Type: g(x) = ln(Ax² + B)
  const lnMatch = problemStatement.match(
    /g\(x\)\s*=\s*\\ln\((\d+)x\^2\s*\+\s*(\d+)\)/,
  );
  if (lnMatch) {
    const a = Number(lnMatch[1]);
    const b = Number(lnMatch[2]);
    try {
      const groundTruth = formatResult(
        nerdamer(`diff(log(${a}*x^2 + ${b}), x)`),
      );
      return {
        isComputable: true,
        groundTruth,
        expression: `diff(log(${a}*x^2 + ${b}), x)`,
        description: `d/dx[ln(${a}x² + ${b})] by chain rule`,
      };
    } catch {
      return null;
    }
  }

  // Type: polynomial f(x) = Ax^N + Bx + C  (generated form)
  const polyMatch = problemStatement.match(
    /f\(x\)\s*=\s*(-?\d+)x\^(\d+)\s*([+-]\s*\d+)x\s*([+-]\s*\d+)/,
  );
  if (polyMatch) {
    const a = Number(polyMatch[1]);
    const n = Number(polyMatch[2]);
    const bRaw = polyMatch[3].replace(/\s/g, "");
    const cRaw = polyMatch[4].replace(/\s/g, "");
    const b = Number(bRaw);
    const c = Number(cRaw);
    try {
      const groundTruth = formatResult(
        nerdamer(`diff(${a}*x^${n} + (${b})*x + (${c}), x)`),
      );
      return {
        isComputable: true,
        groundTruth,
        expression: `diff(${a}*x^${n} + (${b})*x + (${c}), x)`,
        description: `d/dx[${a}x^${n} + ${b}x + ${c}] by power rule`,
      };
    } catch {
      return null;
    }
  }

  // Type: product rule f(x) = x^N * e^(Bx)
  const productMatch = problemStatement.match(
    /f\(x\)\s*=\s*x\^(\d+)\s*\\cdot\s*e\^\{(-?\d+)x\}/,
  );
  if (productMatch) {
    const n = Number(productMatch[1]);
    const b = Number(productMatch[2]);
    try {
      const groundTruth = formatResult(
        nerdamer(`diff(x^${n} * e^(${b}*x), x)`),
      );
      return {
        isComputable: true,
        groundTruth,
        expression: `diff(x^${n} * e^(${b}*x), x)`,
        description: `d/dx[x^${n} · e^(${b}x)] by product rule`,
      };
    } catch {
      return null;
    }
  }

  // Type: quotient rule f(x) = (Ax+B)/(Cx+D)
  const quotientMatch = problemStatement.match(
    /f\(x\)\s*=\s*\\frac\{(-?\d+)x\s*([+-]\s*\d+)\}\{(-?\d+)x\s*([+-]\s*\d+)\}/,
  );
  if (quotientMatch) {
    const a = Number(quotientMatch[1]);
    const bRaw = quotientMatch[2].replace(/\s/g, "");
    const c = Number(quotientMatch[3]);
    const dRaw = quotientMatch[4].replace(/\s/g, "");
    const b = Number(bRaw);
    const d = Number(dRaw);
    try {
      const groundTruth = formatResult(
        nerdamer(`diff((${a}*x + (${b})) / (${c}*x + (${d})), x)`),
      );
      return {
        isComputable: true,
        groundTruth,
        expression: `diff((${a}*x + (${b})) / (${c}*x + (${d})), x)`,
        description: `d/dx[(${a}x${bRaw})/(${c}x${dRaw})] by quotient rule`,
      };
    } catch {
      return null;
    }
  }

  return null;
}

// ── Main dispatcher ───────────────────────────────────────────────────────────

// The admin panel and older records address some topics by an alias (see the
// aliases at the bottom of src/data/topics/index.ts). Those problems come from
// the same generator, so they must reach the same deterministic grader instead
// of silently falling through to the AI grader.
const TOPIC_ALIASES: Record<string, string> = {
  limits_continuity: "limits",
  continuity: "piecewise_continuity",
  piecewise: "piecewise_continuity",
  derivatives_practice: "derivatives",
  quadratic: "quadratic_equations",
  systems: "linear_systems",
  equations: "linear_equations",
  matrices: "determinants",
};

export function canonicalTopicName(topicName: string): string {
  return TOPIC_ALIASES[topicName] ?? topicName;
}

// Exported for the quiz study (convex/studyQuiz.ts): quiz items must be graded
// fully deterministically, so only this direct path is allowed — never the
// LLM-extraction fallback inside computeGroundTruth.
export function computeDirectGroundTruth(
  problemStatement: string,
  rawTopicName: string,
) {
  const topicName = canonicalTopicName(rawTopicName);

  if (topicName === "eigenvalues") {
    const result = computeEigenvalues2x2Direct(problemStatement);
    if (result) return result;
  }

  if (topicName === "eigenvalues_3x3") {
    const result = computeEigenvalues3x3Direct(problemStatement);
    if (result) return result;
  }

  if (topicName === "quadratic_equations") {
    const roots = computeQuadraticRoots(problemStatement);
    if (roots) {
      return {
        isComputable: true,
        groundTruth: `[${roots.join(", ")}]`,
        expression: `[${roots.join(", ")}]`,
        description: "Roots of the displayed quadratic equation",
      };
    }
  }

  if (topicName === "determinants") {
    const numericMatrix = parseNumericMatrix(problemStatement);
    if (
      /compute the determinant/i.test(problemStatement) &&
      numericMatrix &&
      numericMatrix.length === 3 &&
      numericMatrix.every((row) => row.length === 3)
    ) {
      const determinant = det3(numericMatrix);
      return {
        isComputable: true,
        groundTruth: String(determinant),
        expression: String(determinant),
        description:
          "3×3 determinant computed directly from the displayed matrix",
      };
    }

    const symbolicMatrix = parseLatexMatrix(problemStatement);
    if (
      /matrix is singular/i.test(problemStatement) &&
      symbolicMatrix &&
      symbolicMatrix.length === 2 &&
      symbolicMatrix.every((row) => row.length === 2)
    ) {
      const [[a, b], [c, d]] = symbolicMatrix;
      if (d === "k") {
        const denominator = Number(a);
        const numerator = Number(b) * Number(c);
        if (!Number.isNaN(denominator) && !Number.isNaN(numerator)) {
          const answer = formatRational(numerator, denominator);
          return {
            isComputable: true,
            groundTruth: answer,
            expression: answer,
            description:
              "Value of k that makes the 2×2 determinant equal to zero",
          };
        }
      }
    }

    if (
      /determinant is non-zero/i.test(problemStatement) &&
      symbolicMatrix &&
      symbolicMatrix.length === 3 &&
      symbolicMatrix.every((row) => row.length === 3)
    ) {
      const [[a, b, c], [d, e, f], [g, h, i]] = symbolicMatrix;
      if (
        g === "k" &&
        b === h &&
        c === i &&
        d === "-3" &&
        e === "0" &&
        f === "-5"
      ) {
        const excludedValue = Number(a);
        if (!Number.isNaN(excludedValue)) {
          return {
            isComputable: true,
            groundTruth: `k != ${excludedValue}`,
            expression: `k != ${excludedValue}`,
            description:
              "Value of k excluded to keep the 3x3 determinant non-zero",
          };
        }
      }
    }
  }

  if (topicName === "linear_equations") {
    const result = parseLinearEquationGroundTruth(problemStatement);
    if (result) return result;
  }

  if (topicName === "linear_systems") {
    const result = parseLinearSystemGroundTruth(problemStatement);
    if (result) return result;
  }

  // ── Calculus topics ──
  if (topicName === "polynomial_inner_product") {
    const result = computePolynomialInnerProductDirect(problemStatement);
    if (result) return result;
  }

  if (topicName === "limits") {
    const result = parseLimitGroundTruth(problemStatement);
    if (result) return result;
  }

  if (topicName === "derivatives") {
    const result = computeDerivativeDirectly(problemStatement);
    if (result) return result;
  }

  if (topicName === "piecewise_continuity") {
    const result = parsePiecewiseGroundTruth(problemStatement);
    if (result) return result;
  }

  if (topicName === "domain_range") {
    const result = parseDomainRangeGroundTruth(problemStatement);
    if (result) return result;
  }

  return null;
}

/**
 * Symbolically compare two expressions using nerdamer.
 */
function areSymbolicallyEqual(
  studentExpr: string,
  truthExpr: string,
): boolean {
  try {
    if (!isNaN(Number(studentExpr)) && !isNaN(Number(truthExpr))) {
      return Math.abs(Number(studentExpr) - Number(truthExpr)) < 1e-8;
    }
    return nerdamer(studentExpr).eq(truthExpr);
  } catch {
    return false;
  }
}

/**
 * CAS: Compute the verified correct answer for a problem.
 */
export const computeGroundTruth = internalAction({
  args: {
    problemStatement: v.string(),
    topicName: v.string(),
  },
  handler: async (ctx, args) => {
    const direct = computeDirectGroundTruth(
      args.problemStatement,
      args.topicName,
    );
    if (direct) {
      console.log(
        `[CAS] Direct | Topic: ${args.topicName} | Result: ${direct.groundTruth}`,
      );
      return direct;
    }

    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_API_KEY)
      return { isComputable: false, groundTruth: null, expression: null };

    const extractPrompt = `You are a math expression extractor for a Computer Algebra System (nerdamer).

Given the problem below, determine if the FINAL correct answer can be directly evaluated as a nerdamer symbolic expression.

nerdamer expression examples:
- Equation:           k=6
- System:             [x=2, y=3]
- Vector:             [1, -1, 2]
- Matrix:             matrix([1,2],[3,4])
- Derivative:         diff(x^3 + 2*x, x)
- Limit:              limit(sin(x)/x, x, 0)
- Integral:           integrate(x^2, x)
- Solved Root:        solve(120-20*k=0, k)
- Arithmetic:         (40 - 20*2) / 5
- Symbolic Algebra:   expand((x+1)^2)

Rules:
1. Output ONLY valid JSON — no markdown.
2. If the problem asks for values satisfying a condition (e.g., k != 6), extract the defining mathematical object, boundaries, or equations (DO NOT use '!=' or inequality signs, just the root boundaries or lists).
3. Set isComputable=false if the answer is a proof, a general condition that cannot be checked algebraically, or requires interpreting graphs.
4. The expression must be completely self-contained and exactly reflect the theoretical mathematical answer.

Problem: ${args.problemStatement}
Topic: ${args.topicName}

Return JSON:
{
  "isComputable": boolean,
  "expression": "nerdamer expression string, or empty string if not computable",
  "description": "one line: what is being computed"
}`;

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
                  "You extract math computations as nerdamer symbolic expressions. Return only valid JSON.",
              },
              { role: "user", content: extractPrompt },
            ],
            response_format: { type: "json_object" },
          }),
        },
      );

      const data = await response.json();
      if (data.error) {
        console.error("CAS extraction API error:", data.error);
        return { isComputable: false, groundTruth: null, expression: null };
      }

      const extracted = JSON.parse(data.choices[0].message.content);
      if (!extracted.isComputable || !extracted.expression) {
        return { isComputable: false, groundTruth: null, expression: null };
      }

      let result;
      try {
        result = nerdamer(extracted.expression);
      } catch (e) {
        console.warn(
          "[CAS] Nerdamer failed to parse:",
          extracted.expression,
          e,
        );
        return { isComputable: false, groundTruth: null, expression: null };
      }

      const groundTruth = formatResult(result);
      console.log(
        `[CAS] Topic: ${args.topicName} | Expr: ${extracted.expression} | Result: ${groundTruth}`,
      );

      return {
        isComputable: true,
        groundTruth,
        expression: extracted.expression,
        description: extracted.description ?? "",
      };
    } catch (err) {
      console.error("[CAS] computeGroundTruth failed:", errorMessage(err));
      return { isComputable: false, groundTruth: null, expression: null };
    }
  },
});

/**
 * Deterministic equivalence check between a student answer and a verified
 * ground truth. Handles: numeric lists, plain strings (piecewise verdict),
 * symbolic expressions, and numeric function sampling (derivatives).
 * Pure function — also used directly by the quiz study (convex/studyQuiz.ts).
 */
export function checkEquivalenceDirect(
  studentAnswer: string,
  groundTruth: string,
): { isEquivalent: boolean | null; casChecked: boolean } {
  const args = { studentAnswer, groundTruth };
  try {
      // 1. Numeric list comparison (quadratic roots, eigenvalues, etc.)
      const listEquivalence = isNumericListEquivalent(
        args.studentAnswer,
        args.groundTruth,
      );
      if (listEquivalence !== null) {
        console.log(
          `[CAS] List check: "${args.studentAnswer}" vs "${args.groundTruth}" → ${listEquivalence}`,
        );
        return { isEquivalent: listEquivalence, casChecked: true };
      }

      // 2. String / verdict comparison (piecewise: "continuous" / "discontinuous")
      const verdicts = ["continuous", "discontinuous"];
      if (verdicts.includes(args.groundTruth.toLowerCase())) {
        const studentClean = args.studentAnswer
          .toLowerCase()
          .replace(/[^a-z]/g, "");
        const truthClean = args.groundTruth.toLowerCase();
        const isEquivalent =
          studentClean.includes(truthClean) ||
          truthClean.includes(studentClean);
        console.log(
          `[CAS] Verdict check: "${args.studentAnswer}" vs "${args.groundTruth}" → ${isEquivalent}`,
        );
        return { isEquivalent, casChecked: true };
      }

      // 3. Domain / Range answers — canonicalise both sides (interval, set-minus
      // and inequality notations all reduce to the same normal form). Anything
      // the canonicaliser does not recognise still falls through to the AI
      // grader, so an unusual but correct notation is never marked wrong here.
      if (
        args.groundTruth.startsWith("Domain:") ||
        args.groundTruth.startsWith("R\\")
      ) {
        const domainRange = isDomainRangeEquivalent(
          args.studentAnswer,
          args.groundTruth,
        );
        console.log(
          `[CAS] Domain/Range check: "${args.studentAnswer}" vs "${args.groundTruth}" → ${domainRange}`,
        );
        if (domainRange === null) {
          return { isEquivalent: null, casChecked: false };
        }
        return { isEquivalent: domainRange, casChecked: true };
      }

      // 4. Simple parameter relations such as "k != 3"
      const truthRelation = parseSimpleRelation(args.groundTruth);
      if (truthRelation) {
        const studentRelation = parseSimpleRelation(args.studentAnswer);
        if (!studentRelation) {
          return { isEquivalent: false, casChecked: true };
        }

        const sameVariable =
          studentRelation.variable.replace(/_/g, "").toLowerCase() ===
          truthRelation.variable.replace(/_/g, "").toLowerCase();
        const sameOperator = studentRelation.operator === truthRelation.operator;
        const sameValue =
          Math.abs(studentRelation.value - truthRelation.value) < 1e-8;

        return {
          isEquivalent: sameVariable && sameOperator && sameValue,
          casChecked: true,
        };
      }

      // 5. Plain numeric answers, including parameter-style forms like "k = 1"
      if (/^-?\d+(?:\.\d+)?(?:\/-?\d+(?:\.\d+)?)?$/.test(args.groundTruth.trim())) {
        const truthVal = parseSingleNumericAnswer(args.groundTruth);
        const studentParsed = parseSingleNumericAnswer(args.studentAnswer);
        if (truthVal !== null && studentParsed !== null) {
          const isEquivalent = Math.abs(studentParsed - truthVal) < 1e-8;
          console.log(
            `[CAS] Numeric check: "${args.studentAnswer}" vs "${args.groundTruth}" → ${isEquivalent}`,
          );
          return { isEquivalent, casChecked: true };
        }
      }

      // 6. Symbolic / function comparison — try nerdamer then numeric sampling
      const cleaned = toNerdamerExpr(args.studentAnswer);
      if (!cleaned) return { isEquivalent: null, casChecked: false };

      // First try symbolic equality
      const symbolicMatch = areSymbolicallyEqual(cleaned, args.groundTruth);
      if (symbolicMatch) {
        console.log(
          `[CAS] Symbolic match: "${cleaned}" vs "${args.groundTruth}" → true`,
        );
        return { isEquivalent: true, casChecked: true };
      }

      // Then try numeric sampling (catches derivative equivalence)
      const numericMatch = numericallyEquivalentFunctions(
        cleaned,
        args.groundTruth,
      );
      console.log(
        `[CAS] Numeric sampling: "${cleaned}" vs "${args.groundTruth}" → ${numericMatch}`,
      );
      return { isEquivalent: numericMatch, casChecked: true };
    } catch (err) {
      console.log(
        "[CAS] checkAnswerEquivalence could not parse student answer:",
        errorMessage(err),
      );
      return { isEquivalent: null, casChecked: false };
    }
}

/**
 * CAS: Check if the student's answer is equivalent to the verified ground truth.
 */
export const checkAnswerEquivalence = internalAction({
  args: {
    studentAnswer: v.string(),
    groundTruth: v.string(),
    expression: v.string(),
  },
  handler: async (ctx, args) => {
    return checkEquivalenceDirect(args.studentAnswer, args.groundTruth);
  },
});
