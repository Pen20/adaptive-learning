export const domainRangeLogic = {
  generate: () => {
    const a = Math.floor(Math.random() * 5) + 1; 
    const b = Math.floor(Math.random() * 9) + 1; 

    return {
      statement: `Determine the domain and range of the function $$ f(x) = ${a} + |x^2 - ${b}| $$`,
      domainSolution: `(-\\infty, \\infty)`,
      rangeSolution: `[${a}, \\infty)`,
      hint: "Recall that the absolute value |u| is always greater than or equal to 0.",
      solution: `Domain: (-\\infty, \\infty), Range: [${a}, \\infty)` // Added a unified solution string for the UI to consume easily
    };
  }
};
