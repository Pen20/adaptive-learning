export const equationsLogic = {
  generate: () => {
    // Generate coefficients for ax^2 + bx + c = 0
    // We try to pick values that result in clean integer solutions where possible
    const r1 = Math.floor(Math.random() * 10) - 5; // root 1
    const r2 = Math.floor(Math.random() * 10) - 5; // root 2
    
    // (x - r1)(x - r2) = x^2 - (r1+r2)x + (r1*r2)
    const a = 1;
    const b = -(r1 + r2);
    const c = r1 * r2;

    const bString = b >= 0 ? `+ ${b}` : `- ${Math.abs(b)}`;
    const cString = c >= 0 ? `+ ${c}` : `- ${Math.abs(c)}`;

    return {
      title: "Quadratic Equations",
      statement: `Solve for: $$ ${a}x^2 ${bString}x ${cString} = 0 $$`,
      prompt: "Find the values of x:",
      solution: `x = ${r1}, x = ${r2}`,
      hint: "Use the quadratic formula or try factoring the expression into $(x - r_1)(x - r_2) = 0$.",
      guide: {
        title: "Quadratic Formula Guide",
        content: `
- **Standard Form**: $ax^2 + bx + c = 0$
- **Quadratic Formula**: $x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$
- **Discriminant**: $D = b^2 - 4ac$. If $D > 0$, 2 real roots. If $D = 0$, 1 real root.
        `
      }
    };
  }
};
