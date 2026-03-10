export const integralInnerProductLogic = {
  generate: () => {
    // Type: Integral Inner Product on C[0, 1]
    const a = Math.floor(Math.random() * 4) + 1; // 1 to 4
    const b = Math.floor(Math.random() * 3);     // 0 to 2
    const c = Math.floor(Math.random() * 3) + 1; // 1 to 3
    const d = Math.floor(Math.random() * 3) + 1; // 1 to 3
    
    const f_str = b === 0 ? `${a}x` : `${a}x + ${b}`;
    const g_str = `${c}x + ${d}`;
    
    const statement = `Let $V = C[0, 1]$ be the vector space of continuous functions on $[0, 1]$ with the inner product defined by:
$$ \\langle f, g \\rangle = \\int_{0}^{1} f(x)g(x) \\, dx $$
Calculate $\\langle f, g \\rangle$ for the functions $f(x) = ${f_str}$ and $g(x) = ${g_str}$.`;

    const prompt = "Final Answer: Enter the exact numerical value (as a fraction or decimal).";
    
    // Calculation: (ax+b)(cx+d) = acx^2 + (ad+bc)x + bd
    // Integral from 0 to 1: ac/3 + (ad+bc)/2 + bd
    const numerator = (a * c * 2) + (a * d + b * c) * 3 + (b * d * 6);
    const commonDenominator = 6;
    
    const gcd = (x: number, y: number): number => (!y ? x : gcd(y, x % y));
    const commonDivisor = gcd(numerator, commonDenominator);
    
    const finalNum = numerator / commonDivisor;
    const finalDen = commonDenominator / commonDivisor;
    
    const solution = finalDen === 1 ? `$${finalNum}$` : `$${finalNum}/${finalDen}$`;
    
    const explanation = `1. Set up the integral for the inner product:
   $$ \\langle f, g \\rangle = \\int_{0}^{1} (${f_str})(${g_str}) \\, dx $$
2. Expand the integrand:
   $$ (${f_str})(${g_str}) = ${a*c}x^2 + ${a*d + b*c}x + ${b*d} $$
3. Integrate term by term:
   $$ \\int_{0}^{1} (${a*c}x^2 + ${a*d + b*c}x + ${b*d}) \\, dx = \\left[ \\frac{${a*c}}{3}x^3 + \\frac{${a*d + b*c}}{2}x^2 + ${b*d}x \\right]_0^1 $$
4. Evaluate at the limits:
   $$ \\left( \\frac{${a*c}}{3} + \\frac{${a*d + b*c}}{2} + ${b*d} \\right) - (0) = ${solution.replace(/\$/g, '')} $$`;

    return {
      title: "Integral Inner Product",
      statement,
      prompt,
      solution,
      explanation,
      hint: "Multiply the two functions first, then use the fundamental theorem of calculus to evaluate the integral from 0 to 1.",
      guide: integralInnerProductGuide
    };
  }
};

const integralInnerProductGuide = {
  title: "Integral Inner Product",
  content: `
The integral inner product on the space $C[a, b]$ of continuous functions is defined by:
$$ \\langle f, g \\rangle = \\int_{a}^{b} f(x)g(x) \\, dx $$

This formula satisfies all four inner product axioms:
1. Symmetry: $\\int_a^b fg = \\int_a^b gf$
2. Additivity: $\\int_a^b (f+g)h = \\int_a^b fh + \\int_a^b gh$
3. Homogeneity: $\\int_a^b (kf)g = k \\int_a^b fg$
4. Positivity: $\\int_a^b f^2 \\ge 0$, and $\\int_a^b f^2 = 0$ if and only if $f=0$.
`
};
