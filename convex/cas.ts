import { internalAction } from "./_generated/server";
import { v } from "convex/values";

/**
 * Strips common LaTeX wrappers and converts LaTeX notation to mathjs-compatible syntax.
 * This allows us to evaluate student answers and problem expressions numerically.
 */
function toMathjsExpr(raw: string): string {
  return raw
    .replace(/\\\(|\\\)|\\\[|\\\]/g, "")   // remove \( \) \[ \]
    .replace(/\$\$|\$/g, "")               // remove $ $$
    .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, "($1)/($2)")
    .replace(/\\sqrt\{([^}]+)\}/g, "sqrt($1)")
    .replace(/\\sqrt/g, "sqrt")
    .replace(/\\cdot/g, "*")
    .replace(/\\times/g, "*")
    .replace(/\\left|\\right/g, "")
    .replace(/\\begin\{[^}]+\}|\\end\{[^}]+\}/g, "")
    .replace(/\\[a-zA-Z]+/g, "")           // strip remaining LaTeX commands
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Format a mathjs result to a clean, human-readable string.
 */
function formatResult(result: any, math: any): string {
  if (result === null || result === undefined) return "";

  // Matrix / array
  if (result && typeof result.toArray === "function") {
    const arr = result.toArray();
    return JSON.stringify(arr);
  }
  if (Array.isArray(result)) {
    return JSON.stringify(result);
  }
  // Complex number
  if (result && result.re !== undefined && result.im !== undefined) {
    if (Math.abs(result.im) < 1e-10) return math.format(result.re, { precision: 10 });
    return `${math.format(result.re, { precision: 6 })} + ${math.format(result.im, { precision: 6 })}i`;
  }
  // Node (symbolic expression from derivative etc.)
  if (result && typeof result.toString === "function" && typeof result.evaluate !== "function") {
    return result.toString();
  }
  if (typeof result === "number") {
    return math.format(result, { precision: 10 });
  }
  return String(result);
}

/**
 * Numerically compare two mathjs results.
 * Returns true if they are equivalent within floating-point tolerance.
 */
function areNumericallyEqual(a: any, b: any, math: any): boolean {
  try {
    // Both numbers
    if (typeof a === "number" && typeof b === "number") {
      return Math.abs(a - b) < 1e-8;
    }
    // Both matrices
    if (a && b && typeof a.toArray === "function" && typeof b.toArray === "function") {
      const arrA = a.toArray().flat(Infinity);
      const arrB = b.toArray().flat(Infinity);
      if (arrA.length !== arrB.length) return false;
      return arrA.every((v: number, i: number) => Math.abs(v - arrB[i]) < 1e-8);
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * CAS: Compute the verified correct answer for a problem.
 *
 * Step 1 — ask AI (cheaply, gpt-4o-mini) to express the answer as a mathjs expression.
 * Step 2 — evaluate with mathjs (deterministic, no hallucination).
 * Step 3 — return verified ground truth to inject into the grading prompt.
 */
export const computeGroundTruth = internalAction({
  args: {
    problemStatement: v.string(),
    topicName: v.string(),
  },
  handler: async (ctx, args) => {
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_API_KEY) return { isComputable: false, groundTruth: null, expression: null };

    const extractPrompt = `You are a math expression extractor for a Computer Algebra System (mathjs library).

Given the problem below, determine if the FINAL correct answer can be directly evaluated as a mathjs expression.

mathjs expression examples:
- Determinant:        det([[2, -3], [1, 4]])
- Matrix inverse:     inv([[1, 2], [3, 4]])
- Matrix multiply:    multiply([[1,2],[3,4]], [[5,6],[7,8]])
- Transpose:          transpose([[1,2,3],[4,5,6]])
- Arithmetic:         (40 - 20*2) / 5
- Square root:        sqrt(25)
- Eigenvalues:        eigs([[4,1],[2,3]]).values
- Norm:               norm([3,4])
- Derivative (symbolic): derivative('x^3 + 2*x', 'x')

Rules:
1. Output ONLY valid JSON — no markdown.
2. If the problem asks to "find k such that...", "for which values of...", or "solve for..." a parameter, the expression should solve the equation and return that parameter value if straightforward arithmetic allows it. Otherwise set isComputable=false.
3. Set isComputable=false if the answer is a proof, a general condition, or requires symbolic solving beyond basic algebra.
4. The expression must be self-contained and evaluate without variables.

Problem: ${args.problemStatement}
Topic: ${args.topicName}

Return JSON:
{
  "isComputable": boolean,
  "expression": "mathjs expression string, or empty string if not computable",
  "description": "one line: what is being computed"
}`;

    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${OPENAI_API_KEY}` },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: "You extract math computations as mathjs expressions. Return only valid JSON." },
            { role: "user", content: extractPrompt },
          ],
          response_format: { type: "json_object" },
        }),
      });

      const data = await response.json();
      if (data.error) {
        console.error("CAS extraction API error:", data.error);
        return { isComputable: false, groundTruth: null, expression: null };
      }

      const extracted = JSON.parse(data.choices[0].message.content);
      if (!extracted.isComputable || !extracted.expression) {
        return { isComputable: false, groundTruth: null, expression: null };
      }

      // Evaluate with mathjs — fully deterministic
      const { create, all } = await import("mathjs");
      const math = create(all);

      const result = math.evaluate(extracted.expression);
      const groundTruth = formatResult(result, math);

      console.log(`[CAS] Topic: ${args.topicName} | Expr: ${extracted.expression} | Result: ${groundTruth}`);

      return {
        isComputable: true,
        groundTruth,
        expression: extracted.expression,
        description: extracted.description ?? "",
      };
    } catch (err: any) {
      console.error("[CAS] computeGroundTruth failed:", err?.message ?? err);
      return { isComputable: false, groundTruth: null, expression: null };
    }
  },
});

/**
 * CAS: Check if the student's answer is numerically equivalent to the verified ground truth.
 * Returns null if either value cannot be parsed (falls back to AI grading).
 */
export const checkAnswerEquivalence = internalAction({
  args: {
    studentAnswer: v.string(),
    groundTruth: v.string(),
    expression: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      const { create, all } = await import("mathjs");
      const math = create(all);

      const cleaned = toMathjsExpr(args.studentAnswer);
      if (!cleaned) return { isEquivalent: null, casChecked: false };

      const studentResult = math.evaluate(cleaned);
      const groundResult = math.evaluate(args.expression);

      const isEquivalent = areNumericallyEqual(studentResult, groundResult, math);
      console.log(`[CAS] Equivalence check: "${cleaned}" vs ground truth → ${isEquivalent}`);

      return { isEquivalent, casChecked: true };
    } catch (err: any) {
      // Student answer may contain prose or complex LaTeX we can't parse — that's fine
      console.log("[CAS] checkAnswerEquivalence could not parse student answer:", err?.message);
      return { isEquivalent: null, casChecked: false };
    }
  },
});
