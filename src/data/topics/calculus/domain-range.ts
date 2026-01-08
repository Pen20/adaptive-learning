export const domainRangeLogic = {
  generate: () => {
    const a = Math.floor(Math.random() * 5) + 1; 
    const b = Math.floor(Math.random() * 9) + 1; 

    return {
      statement: `Determine the domain and range of the function $$ f(x) = ${a} + |x^2 - ${b}| $$`,
      domainSolution: `(-\\infty, \\infty)`,
      rangeSolution: `[${a}, \\infty)`,
      solution: `Domain: (-\\infty, \\infty), Range: [${a}, \\infty)`,
      explanation: `Domain:
The function involves a polynomial inside an absolute value. Polynomials are defined for all real numbers, and the absolute value function is also defined for all real numbers.
Thus, the domain is $(-\\infty, \\infty)$.

Range:
The term $|x^2 - ${b}|$ is an absolute value, so it is always non-negative:
$$ |x^2 - ${b}| \\ge 0 $$
The smallest possible value is 0 (which occurs when $x^2 = ${b}$).
Since $f(x) = ${a} + |x^2 - ${b}|$, the minimum value of $f(x)$ is:
$$ f_{min} = ${a} + 0 = ${a} $$
As $|x^2 - ${b}|$ can grow infinitely large, the range is $[${a}, \\infty)$.`,
      hint: "Recall that the absolute value |u| is always greater than or equal to 0.",
    };
  }
};
