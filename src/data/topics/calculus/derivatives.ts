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
        explanation: `We apply the Chain Rule.
Let $u = ${b}x$, so $f(x) = ${a} \\cos(u)$.
The derivative of $\\cos(u)$ is $-\\sin(u) \\cdot u'$.
Here, $u' = \\frac{d}{dx}(${b}x) = ${b}$.
So,
$$ f'(x) = ${a} (-\\sin(${b}x)) \\cdot ${b} $$
$$ f'(x) = -${a * b} \\sin(${b}x) $$`,
        hint: "Apply the Chain Rule: the derivative of cos(u) is -sin(u) * u'.",
      },
      {
        title: "Logarithmic Derivative",
        statement: `Find the derivative of the function $$g(x) = \\ln(${a}x^2 + ${b}) $$`,
        prompt: "Find g'(x):",
        solution: `\\frac{${2 * a}x}{${a}x^2 + ${b}}`,
        explanation: `We use the chain rule for natural logarithms: $\\frac{d}{dx} \\ln(u) = \\frac{1}{u} \\cdot u'$.
Let $u = ${a}x^2 + ${b}$.
Then $u' = \\frac{d}{dx}(${a}x^2 + ${b}) = ${2 * a}x$.
Thus,
$$ g'(x) = \\frac{1}{${a}x^2 + ${b}} \\cdot (${2 * a}x) $$
$$ g'(x) = \\frac{${2 * a}x}{${a}x^2 + ${b}} $$`,
        hint: "Use the rule: [ln(u)]' = u'/u.",
      }
    ];

    return types[Math.floor(Math.random() * types.length)];
  }
};
