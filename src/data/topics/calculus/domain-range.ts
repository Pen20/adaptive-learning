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
  return d === 1 ? String(n) : `\\frac{${n}}{${d}}`;
}

export const domainRangeLogic = {
  guide: {
    title: "Domain & Range Quick Reference",
    content: `
- **Polynomials**: Domain = \\((-\\infty, \\infty)\\).
- **Square roots**: \\(\\sqrt{u}\\) requires \\(u \\ge 0\\) — solve for \\(x\\) to find the domain lower bound.
- **Rational functions**: Denominator \\(\\ne 0\\) — exclude values that make it zero from the domain.
- **Absolute value**: \\(|u| \\ge 0\\) always — minimum of \\(a + |u|\\) is \\(a\\).
- **Range**: the set of all possible output values; determined by the function's minimum, maximum, or excluded outputs.
    `,
  },
  generate: () => {
    const type = Math.floor(Math.random() * 3);

    // ── Type 0: Absolute value  f(x) = a + |x² - b| ──────────────────────
    if (type === 0) {
      const a = Math.floor(Math.random() * 5) + 1;  // 1–5
      const b = Math.floor(Math.random() * 9) + 1;  // 1–9

      return {
        title: "Domain and Range — Absolute Value",
        statement: `Determine the domain and range of the function $$ f(x) = ${a} + |x^2 - ${b}| $$`,
        prompt: "State the domain and range using interval notation:",
        solution: `Domain: \\((-\\infty, \\infty)\\),  Range: \\([${a}, \\infty)\\)`,
        answerFormat: {
          placeholder: "Domain: (-∞,∞), Range: [a, ∞)",
          instruction:
            "Give both the domain and range in interval notation. The domain is all real numbers; identify the minimum value of the function for the range.",
          alternatives: [
            `Domain: (-\\infty, \\infty), Range: [${a}, \\infty)`,
            `(-\\infty, \\infty) and [${a}, \\infty)`,
            `R and [${a}, \\infty)`,
          ],
          fields: [
            {
              key: "domain",
              label: "Domain",
              placeholder: "(-\\infty, \\infty)",
            },
            {
              key: "range",
              label: "Range",
              placeholder: `[${a}, \\infty)`,
            },
          ],
        },
        explanation: `**Domain:**
The expression inside the absolute value, \\(x^2 - ${b}\\), is a polynomial defined for all \\(x \\in \\mathbb{R}\\). The absolute value and the addition of \\(${a}\\) do not restrict the domain.
$$ \\text{Domain} = (-\\infty, \\infty) $$

**Range:**
Since \\(|x^2 - ${b}| \\ge 0\\) for all \\(x\\), the minimum value of \\(f(x)\\) occurs when the absolute value equals zero:
$$ f_{\\min} = ${a} + 0 = ${a} $$
As \\(|x^2 - ${b}|\\) can grow without bound, the range is:
$$ \\text{Range} = [${a}, \\infty) $$`,
        hint: `The absolute value \\(|u|\\) is always \\(\\ge 0\\). The smallest possible value of \\(f(x)\\) is therefore \\(${a}\\).`,
        reasoningSteps: `Step 1 — Domain: the expression inside the absolute value is a polynomial, defined for all real x. No restrictions. Domain = (−∞, ∞).
Step 2 — Range minimum: |x²−b| ≥ 0 always, so f(x) = a + |x²−b| ≥ a. The minimum a is achieved when x²= b (i.e. when the absolute value equals zero).
Step 3 — Range upper bound: as |x²−b| grows without bound, f(x) grows without bound.
Step 4 — State the range: [a, ∞).`,
      };
    }

    // ── Type 1: Square root  f(x) = sqrt(ax - b) ─────────────────────────
    if (type === 1) {
      // Choose a, b so that b/a is a clean fraction or integer
      const a = Math.floor(Math.random() * 3) + 1;  // 1–3
      const bMult = Math.floor(Math.random() * 4) + 1;  // 1–4
      const b = a * bMult;  // ensures b/a = bMult (integer)
      const lowerBound = bMult;  // b/a as integer
      const lowerLatex = String(lowerBound);

      return {
        title: "Domain and Range — Square Root",
        statement: `Determine the domain and range of the function $$ f(x) = \\sqrt{${a}x - ${b}} $$`,
        prompt: "State the domain and range using interval notation:",
        solution: `Domain: \\([${lowerLatex}, \\infty)\\),  Range: \\([0, \\infty)\\)`,
        answerFormat: {
          placeholder: "Domain: [N, ∞), Range: [0, ∞)",
          instruction:
            "The radicand must be non-negative. Solve \\(${a}x - ${b} \\ge 0\\) to find the domain lower bound.",
          alternatives: [
            `Domain: [${lowerLatex}, \\infty), Range: [0, \\infty)`,
            `[${lowerLatex}, \\infty) and [0, \\infty)`,
            `x \\ge ${lowerLatex} and f(x) \\ge 0`,
          ],
          fields: [
            {
              key: "domain",
              label: "Domain",
              placeholder: `[${lowerLatex}, \\infty)`,
            },
            {
              key: "range",
              label: "Range",
              placeholder: "[0, \\infty)",
            },
          ],
        },
        explanation: `**Domain:**
The square root \\(\\sqrt{u}\\) is defined only when \\(u \\ge 0\\). Solve:
$$ ${a}x - ${b} \\ge 0 \\implies x \\ge \\frac{${b}}{${a}} = ${lowerLatex} $$
$$ \\text{Domain} = [${lowerLatex}, \\infty) $$

**Range:**
When \\(x = ${lowerLatex}\\), \\(f(${lowerLatex}) = \\sqrt{0} = 0\\). As \\(x\\) increases, \\(${a}x - ${b}\\) grows without bound, so \\(\\sqrt{${a}x - ${b}}\\) grows without bound.
$$ \\text{Range} = [0, \\infty) $$`,
        hint: `Require \\(${a}x - ${b} \\ge 0\\). Solve for \\(x\\) to get the minimum value allowed in the domain.`,
        reasoningSteps: `Step 1 — Domain restriction: the radicand must be non-negative. Set ax − b ≥ 0 and solve for x: x ≥ b/a.
Step 2 — State the domain: [b/a, ∞).
Step 3 — Range: √(ax−b) ≥ 0 for all x in the domain, with minimum value 0 at x = b/a.
Step 4 — As x → ∞, the radicand → ∞, so the range grows without bound.
Step 5 — State the range: [0, ∞).`,
      };
    }

    // ── Type 2: Rational  f(x) = c / (x - a) ─────────────────────────────
    const a = Math.floor(Math.random() * 6) + 1;   // excluded x-value: 1–6
    const c = Math.floor(Math.random() * 5) + 1;   // numerator: 1–5
    const aSign = a > 0 ? `- ${a}` : `+ ${Math.abs(a)}`;

    return {
      title: "Domain and Range — Rational Function",
      statement: `Determine the domain and range of the function $$ f(x) = \\frac{${c}}{x - ${a}} $$`,
      prompt: "State the domain and range using set or interval notation:",
      solution: `Domain: \\(\\mathbb{R} \\setminus \\{${a}\\}\\),  Range: \\(\\mathbb{R} \\setminus \\{0\\}\\)`,
      answerFormat: {
        placeholder: "Domain: R\\{a}, Range: R\\{0}",
        instruction:
          "Identify which value of \\(x\\) makes the denominator zero (excluded from domain). Explain why \\(f(x)\\) can never equal zero (excluded from range).",
        alternatives: [
          `Domain: \\mathbb{R} \\setminus \\{${a}\\}, Range: \\mathbb{R} \\setminus \\{0\\}`,
          `(-\\infty, ${a}) \\cup (${a}, \\infty) and (-\\infty, 0) \\cup (0, \\infty)`,
          `x \\ne ${a} and f(x) \\ne 0`,
          `all reals except ${a} and all reals except 0`,
        ],
        fields: [
          {
            key: "domain",
            label: "Domain",
            placeholder: `\\mathbb{R} \\setminus \\{${a}\\}`,
          },
          {
            key: "range",
            label: "Range",
            placeholder: "\\mathbb{R} \\setminus \\{0\\}",
          },
        ],
      },
      explanation: `**Domain:**
The denominator \\(x - ${a} = 0\\) when \\(x = ${a}\\). Division by zero is undefined, so we exclude \\(x = ${a}\\):
$$ \\text{Domain} = \\mathbb{R} \\setminus \\{${a}\\} = (-\\infty, ${a}) \\cup (${a}, \\infty) $$

**Range:**
Can \\(f(x) = 0\\)? Suppose \\(\\frac{${c}}{x - ${a}} = 0\\). Then \\(${c} = 0\\), which is impossible since \\(${c} \\ne 0\\). So \\(f(x)\\) never equals \\(0\\).

For any target value \\(y \\ne 0\\), set \\(\\frac{${c}}{x - ${a}} = y\\) and solve: \\(x = \\frac{${c}}{y} + ${a}\\), which always has a solution.
$$ \\text{Range} = \\mathbb{R} \\setminus \\{0\\} = (-\\infty, 0) \\cup (0, \\infty) $$`,
      hint: `Find the value of \\(x\\) that makes the denominator zero — that is excluded from the domain. Then ask: can \\(\\frac{${c}}{x - ${a}}\\) ever equal zero?`,
      reasoningSteps: `Step 1 — Domain restriction: the denominator (x − a) cannot be zero. Set x − a = 0: excluded value is x = a.
Step 2 — State the domain: ℝ∖{a} (all reals except a), equivalently (−∞, a) ∪ (a, ∞).
Step 3 — Range restriction: ask "can f(x) = 0?" — set c/(x−a) = 0. This requires c = 0, which is impossible since c ≠ 0. So f(x) never equals 0.
Step 4 — Show every other value y ≠ 0 is achieved: solve c/(x−a) = y → x = c/y + a, which always has a solution.
Step 5 — State the range: ℝ∖{0}.`,
    };
  },
};
