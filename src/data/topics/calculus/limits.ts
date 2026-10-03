import { coeff, paren } from "../format";

function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) {
    const t = b;
    b = a % b;
    a = t;
  }
  return a || 1;
}

function reduceFraction(num: number, den: number): string {
  const g = gcd(num, den);
  const n = num / g;
  const d = den / g;
  return d === 1 ? String(n) : `${n}/${d}`;
}

export const limitsLogic = {
  guide: {
    title: "Limits Cheatsheet",
    content: `
- **Direct Substitution**: If \\(f(a)\\) is defined at \\(a\\), then \\(\\lim_{x \\to a} f(x) = f(a)\\).
- **Factoring (0/0 form)**: Factor and cancel common terms. E.g. \\(x^2 - a^2 = (x-a)(x+a)\\).
- **Cancellation**: Cancel matching factors in numerator and denominator before substituting.
- **Limits at Infinity**: Divide by the highest power of \\(x\\); lower-order terms vanish. \\(\\lim_{x \\to \\infty} \\frac{ax^n + \\ldots}{bx^n + \\ldots} = \\frac{a}{b}\\).
    `,
  },
  generate: () => {
    let a = Math.floor(Math.random() * 10) - 5;
    if (a === 0) a = 1;

    const b = Math.floor(Math.random() * 8) + 2;   // 2–9
    const c = Math.floor(Math.random() * 10) + 1;  // 1–10
    const p = Math.floor(Math.random() * 5) + 1;   // 1–5
    const q = Math.floor(Math.random() * 4) + 1;   // 1–4

    // (x - a) displayed as "x - a" or "x + |a|"
    const term = a < 0 ? `x + ${Math.abs(a)}` : `x - ${a}`;
    // (x + a) displayed as "x + a" or "x - |a|"
    const termPlus = a < 0 ? `x - ${Math.abs(a)}` : `x + ${a}`;

    const type = Math.floor(Math.random() * 4);

    // ── Type 0: Factoring (difference of squares) ──────────────────────────
    if (type === 0) {
      const answer = 2 * a;
      return {
        title: "Limits — Factoring",
        statement: `Compute the limit: $$ \\lim_{x \\to ${a}} \\frac{x^2 - ${a * a}}{${term}} $$`,
        prompt: "Find the value of the limit:",
        solution: `$${answer}$`,
        answerFormat: {
          placeholder: "Example: 6",
          instruction:
            "Give the exact numerical value of the limit. This is a 0/0 form — factor first.",
          alternatives: [String(answer), `\\(${answer}\\)`, `$ ${answer} $`],
          fields: [
            { key: "value", label: "Limit value", placeholder: String(answer) },
          ],
        },
        explanation: `Direct substitution gives \\(\\frac{${paren(a)}^2 - ${a * a}}{${paren(a)} - ${paren(a)}} = \\frac{0}{0}\\), an indeterminate form.

Factor the numerator using the difference of squares:
$$ x^2 - ${a * a} = (${term})(${termPlus}) $$

Cancel the common factor \\((${term})\\):
$$ \\lim_{x \\to ${a}} \\frac{(${term})(${termPlus})}{${term}} = \\lim_{x \\to ${a}} (${termPlus}) $$

Apply direct substitution:
$$ ${paren(a)} + ${paren(a)} = ${answer} $$`,
        hint: "You have a \\(0/0\\) indeterminate form. Factor the numerator as a difference of squares: \\(x^2 - a^2 = (x-a)(x+a)\\).",
        reasoningSteps: `Step 1 — Attempt direct substitution: confirm that x = a gives the 0/0 indeterminate form in the numerator and denominator.
Step 2 — Factor the numerator using the difference-of-squares identity: x² − a² = (x − a)(x + a).
Step 3 — Cancel the common factor (x − a) from numerator and denominator (valid for x ≠ a).
Step 4 — Apply direct substitution to the simplified expression: (x + a) at x = a gives 2a.
Step 5 — State the limit = 2a.`,
      };
    }

    // ── Type 1: Cancellation ────────────────────────────────────────────────
    if (type === 1) {
      const answer = b * a + c;
      return {
        title: "Limits — Cancellation",
        statement: `Compute the limit: $$ \\lim_{x \\to ${a}} \\frac{(${b}x + ${c})(${term})}{${term}} $$`,
        prompt: "Find the value of the limit:",
        solution: `$${answer}$`,
        answerFormat: {
          placeholder: "Example: 15",
          instruction: "Give the exact numerical value of the limit.",
          alternatives: [String(answer), `\\(${answer}\\)`],
          fields: [
            { key: "value", label: "Limit value", placeholder: String(answer) },
          ],
        },
        explanation: `Direct substitution gives \\(0/0\\) because \\((${term}) = 0\\) at \\(x = ${a}\\).

Cancel the common factor \\((${term})\\) from numerator and denominator:
$$ \\lim_{x \\to ${a}} \\frac{(${b}x + ${c}) \\cdot (${term})}{${term}} = \\lim_{x \\to ${a}} (${b}x + ${c}) $$

Apply direct substitution:
$$ ${b}(${a}) + ${c} = ${b * a} + ${c} = ${answer} $$`,
        hint: `The factor \\((${term})\\) appears in both numerator and denominator — cancel it before substituting.`,
        reasoningSteps: `Step 1 — Attempt direct substitution: confirm that x = a makes the denominator (x − a) = 0, giving a 0/0 form.
Step 2 — Recognise that (x − a) is a factor of the numerator by inspection (it appears explicitly).
Step 3 — Cancel the common factor (x − a) from numerator and denominator.
Step 4 — Apply direct substitution to the remaining linear expression bx + c at x = a.
Step 5 — State the limit = ba + c.`,
      };
    }

    // ── Type 2: Direct substitution (polynomial) ────────────────────────────
    if (type === 2) {
      const answer = b * a * a + c;
      return {
        title: "Limits — Direct Substitution",
        statement: `Compute the limit: $$ \\lim_{x \\to ${a}} (${b}x^2 + ${c}) $$`,
        prompt: "Find the value of the limit:",
        solution: `$${answer}$`,
        answerFormat: {
          placeholder: "Example: 23",
          instruction:
            "Polynomials are continuous everywhere — substitute directly and give the numerical result.",
          alternatives: [String(answer), `\\(${answer}\\)`],
          fields: [
            { key: "value", label: "Limit value", placeholder: String(answer) },
          ],
        },
        explanation: `The function \\(f(x) = ${b}x^2 + ${c}\\) is a polynomial, which is continuous for all real numbers.

By the **Direct Substitution Property**:
$$ \\lim_{x \\to ${a}} (${b}x^2 + ${c}) = ${b}(${a})^2 + ${c} = ${b * a * a} + ${c} = ${answer} $$`,
        hint: `Polynomials are continuous everywhere. Substitute \\(x = ${a}\\) directly into the expression.`,
        reasoningSteps: `Step 1 — Recognise the function type: a polynomial bx² + c is continuous for all real x, so no indeterminate form arises.
Step 2 — Apply the Direct Substitution Property: substitute x = a directly into the expression.
Step 3 — Evaluate: b·a² + c.
Step 4 — State the limit = [result].`,
      };
    }

    // ── Type 3: Limit at infinity ───────────────────────────────────────────
    const numerCoeff = p + q;
    const denomCoeff = q;
    const answerStr = reduceFraction(numerCoeff, denomCoeff);
    const decimalVal = numerCoeff / denomCoeff;

    return {
      title: "Limits at Infinity",
      statement: `Compute the limit: $$ \\lim_{x \\to \\infty} \\frac{${coeff(numerCoeff, "x")} + ${c}}{${coeff(denomCoeff, "x")} + ${b}} $$`,
      prompt: "Find the value of the limit:",
      solution: `$${answerStr}$`,
      answerFormat: {
        placeholder: "Example: 5/2",
        instruction:
          "Give the exact value as a fraction or integer. Focus on the leading-coefficient ratio.",
        alternatives: [
          answerStr,
          String(decimalVal),
          `\\(${answerStr}\\)`,
          `\\(\\frac{${numerCoeff}}{${denomCoeff}}\\)`,
        ],
        fields: [
          { key: "value", label: "Limit value", placeholder: answerStr },
        ],
      },
      explanation: `As \\(x \\to \\infty\\), constant terms become negligible relative to linear terms.

**Technique — divide numerator and denominator by \\(x\\):**
$$ \\lim_{x \\to \\infty} \\frac{${coeff(numerCoeff, "x")} + ${c}}{${coeff(denomCoeff, "x")} + ${b}} = \\lim_{x \\to \\infty} \\frac{${numerCoeff} + \\dfrac{${c}}{x}}{${denomCoeff} + \\dfrac{${b}}{x}} $$

Since \\(\\dfrac{1}{x} \\to 0\\) as \\(x \\to \\infty\\):
$$ = \\frac{${numerCoeff} + 0}{${denomCoeff} + 0} = \\frac{${numerCoeff}}{${denomCoeff}} = ${answerStr} $$`,
      hint: "Divide numerator and denominator by \\(x\\). The constant terms \\(\\dfrac{c}{x}\\) and \\(\\dfrac{b}{x}\\) vanish at infinity.",
      reasoningSteps: `Step 1 — Recognise the form: both numerator and denominator are linear in x, so this is a ∞/∞ situation — divide by x.
Step 2 — Divide numerator and denominator by x: (px + q)/x = p + q/x and (rx + s)/x = r + s/x.
Step 3 — Take the limit as x → ∞: the terms q/x and s/x both approach 0.
Step 4 — The limit equals the ratio of leading coefficients: p/r.
Step 5 — Reduce the fraction and state the limit.`,
    };
  },
};
