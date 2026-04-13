import { internalAction } from "./_generated/server";
import { v } from "convex/values";
import nerdamer from "nerdamer";
import "nerdamer/Algebra.js";
import "nerdamer/Calculus.js";
import "nerdamer/Solve.js";

/**
 * Strips common LaTeX wrappers and converts LaTeX notation to mathjs-compatible syntax.
 * This allows us to evaluate student answers and problem expressions numerically.
 */
function toNerdamerExpr(raw: string): string {
  // If it's a relational statement (inequalities) other than standard '=', defer to AI
  if (/\\neq|<|>|\\leq|\\geq|\\approx/.test(raw)) {
      throw new Error("Relational inequalities deferred to AI grader");
  }

  return raw
    .replace(/\\\(|\\\)|\\\[|\\\]/g, "")   // remove \( \) \[ \]
    .replace(/\$\$|\$/g, "")               // remove $ $$
    .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, "($1)/($2)")
    .replace(/\\sqrt\[([^\]]+)\]\{([^}]+)\}/g, "($2)^(1/$1)") 
    .replace(/\\sqrt\{([^}]+)\}/g, "sqrt($1)")
    .replace(/\\sqrt/g, "sqrt")
    .replace(/\\cdot/g, "*")
    .replace(/\\times/g, "*")
    .replace(/\\left|\\right/g, "")
    .replace(/\\begin\{[^}]+\}|\\end\{[^}]+\}/g, "")
    .replace(/\\pi/g, "pi")
    .replace(/\\infty/g, "infinity")
    .replace(/\\[a-zA-Z]+/g, "")           // strip remaining LaTeX commands
    .replace(/\s+/g, " ")
    .trim();
}

function formatResult(result: any): string {
  if (result === null || result === undefined) return "";
  if (typeof result === "string") return result;
  if (typeof result.text === "function") return result.text();
  if (typeof result.toString === "function") return result.toString();
  return String(result);
}

/**
 * Symbolically compare two expressions using nerdamer.
 */
function areSymbolicallyEqual(studentExpr: string, truthExpr: string): boolean {
  try {
    // Check strict numeric match first for simple values
    if (!isNaN(Number(studentExpr)) && !isNaN(Number(truthExpr))) {
       return Math.abs(Number(studentExpr) - Number(truthExpr)) < 1e-8;
    }
    
    // Evaluate algebraic equivalence
    return nerdamer(studentExpr).eq(truthExpr);
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
            { role: "system", content: "You extract math computations as nerdamer symbolic expressions. Return only valid JSON." },
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

      // Evaluate with nerdamer — fully deterministic symbolic CAS
      let result;
      try {
         result = nerdamer(extracted.expression);
      } catch (e) {
         console.warn("[CAS] Nerdamer extraction failed to parse:", extracted.expression, e);
         return { isComputable: false, groundTruth: null, expression: null };
      }
      
      const groundTruth = formatResult(result);

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
      const cleaned = toNerdamerExpr(args.studentAnswer);
      if (!cleaned) return { isEquivalent: null, casChecked: false };

      // Optional: Check if LLM expression computation succeeded initially (it should if casResult exists)
      const isEquivalent = areSymbolicallyEqual(cleaned, args.groundTruth);
      
      console.log(`[CAS] Equivalence check: "${cleaned}" vs truth "${args.groundTruth}" → ${isEquivalent}`);

      return { isEquivalent, casChecked: true };
    } catch (err: any) {
      // Student answer may contain prose or complex LaTeX we can't parse — that's fine
      console.log("[CAS] checkAnswerEquivalence could not parse student answer:", err?.message);
      return { isEquivalent: null, casChecked: false };
    }
  },
});
