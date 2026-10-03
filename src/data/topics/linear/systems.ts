import { coeff } from "../format";

export const systemsLogic = {
  generate: () => {
    // Generate a system:
    // a1 x + b1 y = c1
    // a2 x + k y = c2
    // No solution if a1/a2 = b1/k != c1/c2
    
    const ratio = Math.floor(Math.random() * 3) + 2; // 2, 3, or 4
    const a1 = Math.floor(Math.random() * 5) + 1;
    const b1 = Math.floor(Math.random() * 5) + 1;
    const c1 = Math.floor(Math.random() * 5) + 1;

    const a2 = a1 * ratio;
    const k_ans = b1 * ratio;
    
    // Make sure constants are NOT in the same ratio for "No Solution"
    const c2 = c1 * ratio + (Math.floor(Math.random() * 5) + 1);

    return {
      title: "Linear Systems (No Solution)",
      statement: `Find the value of $k$ such that the following system has no solution:
$$
\\begin{cases} 
${coeff(a1, "x")} + ${coeff(b1, "y")} = ${c1} \\\\
${coeff(a2, "x")} + ky = ${c2}
\\end{cases}
$$`,
      prompt: "k =",
      solution: `$${k_ans}$`,
      explanation: `For a system of linear equations to have no solution, the lines must be parallel. This means their slopes are equal, or equivalently, the ratio of the coefficients of $x$ and $y$ must be the same:
$$ \\frac{a_1}{a_2} = \\frac{b_1}{b_2} $$
Substituting the values from the system:
$$ \\frac{${a1}}{${a2}} = \\frac{${b1}}{k} $$
We can simplify the left side:
$$ \\frac{1}{${ratio}} = \\frac{${b1}}{k} $$
Cross-multiplying to solve for $k$:
$$ 1 \\cdot k = ${b1} \\cdot ${ratio} $$
$$ k = ${k_ans} $$
(Note: We also verified that the constants do not have the same ratio, ensuring the lines are distinct and parallel, not identical.)`,
      hint: "For a system to have no solution, the lines must be parallel (same slope) but have different intercepts. Compare the ratios of the coefficients of $x$ and $y$.",
      reasoningSteps: `Step 1 — Recall the no-solution condition: The two lines must be parallel but not identical. Parallel lines have equal slope-ratios: a₁/a₂ = b₁/b₂, but different constant ratios: b₁/b₂ ≠ c₁/c₂.
Step 2 — Set up the coefficient ratio equation: a₁/a₂ = b₁/k.
Step 3 — Substitute the known values: simplify the left-side ratio and cross-multiply to isolate k.
Step 4 — Verify the no-solution condition: confirm that c₁/c₂ ≠ b₁/k (the constants must NOT be in the same ratio, otherwise the lines would be identical with infinitely many solutions).
Step 5 — State k = [answer].`,
      guide: {
        title: "Conditions for No Solution",
        content: `
- Parallel Lines: Slopes must be equal ($m_1 = m_2$).
- Coefficients: $\\frac{a_1}{a_2} = \\frac{b_1}{b_2} \\neq \\frac{c_1}{c_2}$.
        `
      }
    };
  }
};
