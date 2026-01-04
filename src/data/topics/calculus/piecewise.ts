export const piecewiseLogic = {
  generate: () => {
    const x1 = Math.floor(Math.random() * 5) + 2;
    const m = Math.floor(Math.random() * 3) + 1;
    const b = Math.floor(Math.random() * 4) + 1;
    
    const isContinuous = Math.random() > 0.5;
    const jump = isContinuous ? 0 : Math.floor(Math.random() * 3) + 1;
    
    const valLeft = m * x1 + b;
    const valRight = valLeft + jump;

    return {
      statement: ` Determine if the function is continuous or discontinuous at $x = ${x1}$ \n$$f(x) = \\begin{cases} ${m}x + ${b}, & x < ${x1} \\\\ x + ${valRight - x1}, & x \\ge ${x1} \\end{cases} $$`,
      x1,
      solution: isContinuous ? "continuous" : "discontinuous",
      hint: "Check if the limit from the left equals the value from the right at the break point.",
    };
  }
};
