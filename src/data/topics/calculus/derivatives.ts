export const derivativesLogic = {
  generate: () => {
    const a = Math.floor(Math.random() * 5) + 2; 
    const b = Math.floor(Math.random() * 4) + 2; 
    
    const types = [
      {
        title: "Trigonometric Derivative",
        statement: `Find the derivative of the function $$ f(x) = ${a} \\cos(${b}x) $$`,
        prompt: "Find f'(x):",
        solution: `-${a * b} \\sin(${b}x)`,
        hint: "Apply the Chain Rule: the derivative of cos(u) is -sin(u) * u'.",
      },
      {
        title: "Logarithmic Derivative",
        statement: `Find the derivative of the function $$g(x) = \\ln(${a}x^2 + ${b}) $$`,
        prompt: "Find g'(x):",
        solution: `\\frac{${2 * a}x}{${a}x^2 + ${b}}`,
        hint: "Use the rule: [ln(u)]' = u'/u.",
      }
    ];

    return types[Math.floor(Math.random() * types.length)];
  }
};
