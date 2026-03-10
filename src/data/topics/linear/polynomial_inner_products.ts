export const polynomialInnerProductLogic = {
  generate: () => {
    // Standard Inner Product on P2: p(x) = a0 + a1x + a2x^2, q(x) = b0 + b1x + b2x^2
    // <p, q> = a0b0 + a1b1 + a2b2
    
    const a0 = Math.floor(Math.random() * 15) - 7;
    const a1 = Math.floor(Math.random() * 15) - 7;
    const a2 = Math.floor(Math.random() * 10) - 4;
    
    const b0 = Math.floor(Math.random() * 15) - 7;
    const b1 = Math.floor(Math.random() * 15) - 7;
    const b2 = Math.floor(Math.random() * 10) - 4;

    const formatPoly = (c0: number, c1: number, c2: number) => {
      let parts = [];
      if (c0 !== 0) parts.push(`${c0}`);
      if (c1 !== 0) {
        const sign = c1 > 0 && parts.length > 0 ? "+" : "";
        const coeff = Math.abs(c1) === 1 ? "" : Math.abs(c1);
        parts.push(`${sign}${c1 < 0 ? "-" : ""}${coeff}x`);
      }
      if (c2 !== 0) {
        const sign = c2 > 0 && parts.length > 0 ? "+" : "";
        const coeff = Math.abs(c2) === 1 ? "" : Math.abs(c2);
        parts.push(`${sign}${c2 < 0 ? "-" : ""}${coeff}x^2`);
      }
      return parts.length === 0 ? "0" : parts.join(" ");
    };

    const p_str = formatPoly(a0, a1, a2);
    const q_str = formatPoly(b0, b1, b2);

    const result = (a0 * b0) + (a1 * b1) + (a2 * b2);

    const statement = `In the vector space $P_2$ of polynomials of degree at most 2, find the standard inner product of the given polynomials:
$$ p = ${p_str} $$
$$ q = ${q_str} $$`;

    const explanation = `The standard inner product on $P_n$ for polynomials $p(x) = a_0 + a_1x + \\dots + a_nx^n$ and $q(x) = b_0 + b_1x + \\dots + b_nx^n$ is defined as the sum of the products of their corresponding coefficients:
$$ \\langle p, q \\rangle = a_0b_0 + a_1b_1 + \\dots + a_nb_n $$

For these specific polynomials:
1. Identify the coefficients:
   - For $p = ${p_str}$: $a_0 = ${a0}, a_1 = ${a1}, a_2 = ${a2}$
   - For $q = ${q_str}$: $b_0 = ${b0}, b_1 = ${b1}, b_2 = ${b2}$

2. Calculate the product of corresponding coefficients:
   - $a_0b_0 = (${a0})(${b0}) = ${a0 * b0}$
   - $a_1b_1 = (${a1})(${b1}) = ${a1 * b1}$
   - $a_2b_2 = (${a2})(${b2}) = ${a2 * b2}$

3. Sum the products:
   $$ \\langle p, q \\rangle = (${a0 * b0}) + (${a1 * b1}) + (${a2 * b2}) = ${result} $$`;

    return {
      title: "Polynomial Inner Product",
      statement,
      prompt: "Final Answer: Enter the numerical value of the inner product.",
      solution: `$${result}$`,
      explanation,
      hint: "The standard inner product of two polynomials is the dot product of their coefficient vectors $(a_0, a_1, a_2)$ and $(b_0, b_1, b_2)$.",
      guide: polynomialInnerProductGuide
    };
  }
};

const polynomialInnerProductGuide = {
  title: "Inner Products on Polynomial Spaces",
  content: `
The space $P_n$ consists of all polynomials of degree $\\le n$. 

Standard Inner Product on $P_n$:
If $p(x) = a_0 + a_1x + \\dots + a_nx^n$ and $q(x) = b_0 + b_1x + \\dots + b_nx^n$, then:
$$ \\langle p, q \\rangle = a_0b_0 + a_1b_1 + \\dots + a_nb_n $$

This is essentially the same as the dot product in $\\mathbb{R}^{n+1}$ using the coefficient vectors.

Other Inner Products:
Inner products on $P_n$ can also be defined via evaluation at specific points or via integration, for example:
$$ \\langle p, q \\rangle = \\int_{a}^{b} p(x)q(x) \\, dx $$
`
};
