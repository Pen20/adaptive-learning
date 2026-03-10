export const linearEquationLogic = {
  generate: () => {
    const a = Math.floor(Math.random() * 8) + 2;
    const x = Math.floor(Math.random() * 10) + 1;
    const b = Math.floor(Math.random() * 10) + 1;
    const result = a * x + b;

    return {
      title: "Linear Equations",
      statement: `Solve for $x$: $$ ${a}x + ${b} = ${result} $$`,
      prompt: "x =",
      solution: `$${x}$`,
      explanation: `We start with the equation:
$$ ${a}x + ${b} = ${result} $$
Subtract ${b} from both sides:
$$ ${a}x = ${result} - ${b} $$
$$ ${a}x = ${result - b} $$
Divide both sides by ${a}:
$$ x = \\frac{${result - b}}{${a}} $$
$$ x = ${x} $$`,
      hint: "First, subtract the constant from both sides, then divide by the coefficient of $x$.",
      guide: {
        title: "Solving Linear Equations",
        content: `
- Isolate x: Perform inverse operations to get x by itself.
- Order: Subtract/Add constants first, then Multiply/Divide coefficients.
        `
      }
    };
  }
};
