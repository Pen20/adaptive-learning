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
      explanation: `To check continuity at $x = ${x1}$, we must verify if the limit from the left equals the value (and right limit) at $x = ${x1}$.
1. Left Limit ($x < ${x1}$):
$$ \\lim_{x \\to ${x1}^-} f(x) = ${m}(${x1}) + ${b} = ${valLeft} $$

2. Right Limit / Function Value ($x \\ge ${x1}$):
$$ f(${x1}) = ${x1} + ${valRight - x1} = ${valRight} $$

Conclusion:
Since $${valLeft} ${isContinuous ? "=" : "\\neq"} ${valRight}$, the function is ${isContinuous ? "continuous" : "discontinuous"} at $x = ${x1}$.`,
      hint: "Check if the limit from the left equals the value from the right at the break point.",
    };
  }
};
