export const limitsLogic = {
  guide: {
    title: "Limits Cheatsheet",
    content: `
- Direct Substitution: If $f(a)$ is defined, $\\lim_{x \\to a} f(x) = f(a)$.
- Factoring: If you get $0/0$, try factoring terms: $x^2 - a^2 = (x-a)(x+a)$.
- Conjugates: For roots $\\sqrt{x} - a$, multiply by $\\frac{\\sqrt{x}+a}{\\sqrt{x}+a}$.
- Infinity: $\\lim_{x \\to \\infty} \\frac{1}{x} = 0$.
    `
  },
  generate: () => {
    let a = Math.floor(Math.random() * 10) - 5; // Limit point -5 to 4
    if (a === 0) a = 1; // Ensure a is non-zero for clearer structure
    
    const b = Math.floor(Math.random() * 8) + 2;  // Coefficient 2 to 9
    const c = Math.floor(Math.random() * 10) + 1; // Constant

    // Format (x - a) to avoid "x - -5"
    const term = a < 0 ? `x + ${Math.abs(a)}` : `x - ${a}`;

    const types = [
      {
        statement: `$$ \\lim_{x \\to ${a}} \\frac{x^2 - ${a * a}}{${term}} $$`,
        solution: `${2 * a}`,
        hint: "This is a 0/0 indeterminate form. Try factoring the numerator as a difference of squares.",
      },
      {
        statement: `$$ \\lim_{x \\to ${a}} \\frac{(${b}x + ${c})(${term})}{${term}} $$`,
        solution: `${b * a + c}`,
        hint: "Notice that common factors can be cancelled from the numerator and denominator.",
      }
    ];

    return types[Math.floor(Math.random() * types.length)];
  }
};
