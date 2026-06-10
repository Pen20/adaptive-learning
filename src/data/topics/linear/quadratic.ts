function formatQuadraticExpression(b: number, c: number) {
  const terms = ["x^2"];

  if (b !== 0) {
    const coefficient = Math.abs(b) === 1 ? "" : Math.abs(b).toString();
    terms.push(`${b > 0 ? "+" : "-"} ${coefficient}x`);
  }

  if (c !== 0) {
    terms.push(`${c > 0 ? "+" : "-"} ${Math.abs(c)}`);
  }

  return terms.join(" ");
}

export const quadraticLogic = {
  generate: () => {
    // Generate two integer roots to ensure a solvable, "clean" quadratic
    const r1 = Math.floor(Math.random() * 10) - 5;
    const r2 = Math.floor(Math.random() * 10) - 5;

    // (x - r1)(x - r2) = x^2 - (r1+r2)x + (r1*r2)
    const b = -(r1 + r2);
    const c = r1 * r2;

    const expression = formatQuadraticExpression(b, c);

    return {
      title: "Quadratic Equations",
      statement: `Solve for $x$: \n $$${expression} = 0$$`,
      prompt: "Find the values of x:",
      solution: `$x_1 = ${r1}, x_2 = ${r2}$`,
      answerFormat: {
        placeholder: "$x \\in \\{-2, 3\\}$",
        instruction:
          "Give both roots as a set using LaTeX notation. Order does not matter.",
        alternatives: [
          "$x \in {-2, 3}$",
          "x in {-2, 3}",
          "{-2, 3}",
          "x = -2, 3",
          "x = -2 and x = 3",
        ],
        fields: [
          { key: "x1", label: "x_1", placeholder: "-2" },
          { key: "x2", label: "x_2", placeholder: "3" },
        ],
      },
      explanation: `We are given:
$$ ${expression} = 0 $$
We look for two numbers that multiply to $c = ${c}$ and add up to $b = ${b}$.
The numbers are $${-r1}$ and $${-r2}$.
$$ (x - (${r1}))(x - (${r2})) = 0 $$
So the solutions are:
$$ x = ${r1} \\text{ or } x = ${r2} $$`,
      hint: "Try factoring into $(x - r_1)(x - r_2) = 0$ or use the quadratic formula: $x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$.",
      reasoningSteps: `Step 1 — Write the equation in standard form: x² + bx + c = 0 (identify the coefficients).
Step 2 — Choose a method: factoring (find two integers r and s with r + s = −b and r · s = c) or the quadratic formula x = (−b ± √(b²−4ac)) / 2.
Step 3 — Factor the polynomial (if factoring): (x − r₁)(x − r₂) = 0.
Step 4 — Apply the Zero Product Property: each factor set to zero gives one root.
Step 5 — State both roots: x₁ = r₁ and x₂ = r₂.`,
      guide: {
        title: "Quadratic Guide",
        content: `
- Factoring: Find two numbers that multiply to $c$ and add up to $b$.
- Quadratic Formula: $x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$
        `,
      },
    };
  },
};
