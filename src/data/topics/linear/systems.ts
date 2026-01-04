export const systemsLogic = {
  generate: () => {
    // Generate a system:
    // a1 x + b1 y = c1
    // a2 x + k y = c2
    // No solution if a1/a2 = b1/k != c1/c2
    
    // Let's essentially simplify:
    // 2x + 3y = 7
    // 4x + ky = 8
    // Ratio is 2. So 4/2 = 2. Then k must be 2 * 3 = 6.
    // And constants 8/7 != 2, so consistent.

    const ratio = Math.floor(Math.random() * 3) + 2; // 2, 3, or 4
    const a1 = Math.floor(Math.random() * 5) + 1;
    const b1 = Math.floor(Math.random() * 5) + 1;
    const c1 = Math.floor(Math.random() * 5) + 1;

    const a2 = a1 * ratio;
    const k_ans = b1 * ratio;
    
    // Make sure constants are NOT in the same ratio for "No Solution"
    // c2 should NOT be c1 * ratio.
    let c2 = c1 * ratio + (Math.floor(Math.random() * 5) + 1);

    return {
      title: "Linear Systems (No Solution)",
      statement: `Find the value of $k$ such that the following system has no solution:
$$
\\begin{cases} 
${a1}x + ${b1}y = ${c1} \\\\
${a2}x + ky = ${c2}
\\end{cases}
$$`,
      prompt: "k =",
      solution: `${k_ans}`,
      hint: "For a system to have no solution, the lines must be parallel (same slope) but have different intercepts. Compare the ratios of the coefficients of $x$ and $y$.",
      guide: {
        title: "Conditions for No Solution",
        content: `
- **Parallel Lines**: Slopes must be equal ($m_1 = m_2$).
- **Coefficients**: $\\frac{a_1}{a_2} = \\frac{b_1}{b_2} \\neq \\frac{c_1}{c_2}$.
        `
      }
    };
  }
};
