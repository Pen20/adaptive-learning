import { coeff } from "../format";

export const piecewiseLogic = {
  guide: {
    title: "Continuity at a Point",
    content: `
A function \\(f\\) is **continuous** at \\(x = c\\) if all three conditions hold:
1. \\(f(c)\\) is defined.
2. \\(\\lim_{x \\to c} f(x)\\) exists (left limit = right limit).
3. \\(\\lim_{x \\to c} f(x) = f(c)\\).

If any condition fails, the function is **discontinuous** at \\(c\\).
    `,
  },
  generate: () => {
    const x1 = Math.floor(Math.random() * 5) + 2;   // boundary: 2–6
    const m  = Math.floor(Math.random() * 3) + 1;   // slope of first piece: 1–3
    const b  = Math.floor(Math.random() * 4) + 1;   // intercept of first piece: 1–4

    const isContinuous = Math.random() > 0.5;
    const jump = isContinuous ? 0 : Math.floor(Math.random() * 3) + 1;

    const valLeft  = m * x1 + b;
    const valRight = valLeft + jump;
    const q = valRight - x1;

    const qDisplay = q >= 0 ? `+ ${q}` : `- ${Math.abs(q)}`;

    return {
      title: "Piecewise Continuity",
      statement: ` Determine if the function is continuous or discontinuous at $x = ${x1}$
$$f(x) = \\begin{cases} ${coeff(m, "x")} + ${b}, & x < ${x1} \\\\ x ${qDisplay}, & x \\ge ${x1} \\end{cases} $$`,
      prompt:
        "Is the function continuous or discontinuous at the given point?",
      x1,
      solution: isContinuous ? "continuous" : "discontinuous",
      answerFormat: {
        placeholder: "continuous or discontinuous",
        instruction:
          "State whether the function is **continuous** or **discontinuous** at the given point. Show your work by computing the left-hand limit and the right-hand value.",
        alternatives: [
          isContinuous ? "continuous" : "discontinuous",
          isContinuous ? "Continuous" : "Discontinuous",
        ],
        fields: [
          {
            key: "verdict",
            label: "Continuity",
            placeholder: isContinuous ? "continuous" : "discontinuous",
          },
        ],
      },
      explanation: `To check continuity at \\(x = ${x1}\\), compare the left-hand limit with the right-hand value.

**Step 1 — Left-hand limit** (\\(x < ${x1}\\) piece):
$$ \\lim_{x \\to ${x1}^-} f(x) = ${m}(${x1}) + ${b} = ${valLeft} $$

**Step 2 — Right-hand value** (\\(x \\ge ${x1}\\) piece):
$$ f(${x1}) = ${x1} ${qDisplay} = ${valRight} $$

**Conclusion:**
Since \\(${valLeft} ${isContinuous ? "=" : "\\neq"} ${valRight}\\), the function is **${isContinuous ? "continuous" : "discontinuous"}** at \\(x = ${x1}\\).`,
      hint: `Evaluate each piece at \\(x = ${x1}\\). If the left-hand limit equals the right-hand value, the function is continuous; otherwise it has a jump discontinuity.`,
      reasoningSteps: `Step 1 — Identify the boundary point x₁ where the two pieces meet.
Step 2 — Compute the left-hand limit: substitute x₁ into the left piece (mx + b) to get lim_{x→x₁⁻} f(x).
Step 3 — Compute the right-hand value: substitute x₁ into the right piece (x + q) to get f(x₁).
Step 4 — Compare: if left limit = right-hand value, the function is continuous at x₁; otherwise it is discontinuous (there is a jump equal to the difference).
Step 5 — State the conclusion with the computed values as evidence.`,
    };
  },
};
