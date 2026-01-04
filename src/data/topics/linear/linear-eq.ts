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
      solution: `${x}`,
      hint: "First, subtract the constant from both sides, then divide by the coefficient of $x$.",
      guide: {
        title: "Solving Linear Equations",
        content: `
- **Isolate x**: Perform inverse operations to get x by itself.
- **Order**: Subtract/Add constants first, then Multiply/Divide coefficients.
        `
      }
    };
  }
};
