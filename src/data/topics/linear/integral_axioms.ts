export const integralAxiomsLogic = {
  generate: () => {
    // Choose which axiom to test
    const axiomType = Math.floor(Math.random() * 4);
    
    let statement = "";
    let solution = "";
    let explanation = "";
    let title = "";
    let hint = "";

    const integralDef = "$$\\langle f, g \\rangle = \\int_{a}^{b} f(x)g(x) \\, dx$$";

    if (axiomType === 0) {
      title = "Symmetry Axiom";
      statement = `Let $V = C[a, b]$ with the inner product defined by:
${integralDef}
Show that the Symmetry Axiom holds: $\\langle f, g \\rangle = \\langle g, f \\rangle$.`;
      solution = "Reasoning: Use the commutativity of real number multiplication under the integral.";
      explanation = `1. Start with the definition of $\\langle f, g \\rangle$:
   $$ \\langle f, g \\rangle = \\int_{a}^{b} f(x)g(x) \\, dx $$
2. Since $f(x)$ and $g(x)$ are real numbers for each $x$, their product commutes:
   $$ f(x)g(x) = g(x)f(x) $$
3. Substitute this back into the integral:
   $$ \\int_{a}^{b} f(x)g(x) \\, dx = \\int_{a}^{b} g(x)f(x) \\, dx $$
4. Recognize the right side as the definition of $\\langle g, f \\rangle$:
   $$ \\int_{a}^{b} g(x)f(x) \\, dx = \\langle g, f \\rangle $$
Thus, $\\langle f, g \\rangle = \\langle g, f \\rangle$.`;
      hint = "Recall that multiplication of real functions is commutative, meaning $f(x)g(x) = g(x)f(x)$.";
    } else if (axiomType === 1) {
      title = "Additivity Axiom";
      statement = `Let $V = C[a, b]$ with the inner product defined by:
${integralDef}
Show that the Additivity Axiom holds: $\\langle f + g, h \\rangle = \\langle f, h \\rangle + \\langle g, h \\rangle$.`;
      solution = "Reasoning: Use the distributive property and the linearity of the definite integral.";
      explanation = `1. Start with the left side:
   $$ \\langle f + g, h \\rangle = \\int_{a}^{b} (f(x) + g(x))h(x) \\, dx $$
2. Use the distributive property of real numbers:
   $$ (f(x) + g(x))h(x) = f(x)h(x) + g(x)h(x) $$
3. Apply the linearity property of integrals (the integral of a sum is the sum of the integrals):
   $$ \\int_{a}^{b} (f(x)h(x) + g(x)h(x)) \\, dx = \\int_{a}^{b} f(x)h(x) \\, dx + \\int_{a}^{b} g(x)h(x) \\, dx $$
4. Recognize the terms as $\\langle f, h \\rangle$ and $\\langle g, h \\rangle$:
   $$ \\langle f, h \\rangle + \\langle g, h \\rangle $$
Thus, $\\langle f + g, h \\rangle = \\langle f, h \\rangle + \\langle g, h \\rangle$.`;
      hint = "Distribute the function $h(x)$ over the sum $(f(x) + g(x))$ and then use the property that $\\int (u+v) = \\int u + \\int v$.";
    } else if (axiomType === 2) {
      title = "Homogeneity Axiom";
      statement = `Let $V = C[a, b]$ with the inner product defined by:
${integralDef}
Show that the Homogeneity Axiom holds for any scalar $k$: $\\langle kf, g \\rangle = k\\langle f, g \\rangle$.`;
      solution = "Reasoning: Use the constant multiple rule for integrals.";
      explanation = `1. Write out the definition for $\\langle kf, g \\rangle$:
   $$ \\langle kf, g \\rangle = \\int_{a}^{b} (kf(x))g(x) \\, dx $$
2. Use the associativity of multiplication:
   $$ (kf(x))g(x) = k(f(x)g(x)) $$
3. Pull the constant $k$ out of the integral (Linearity of integration):
   $$ \\int_{a}^{b} k(f(x)g(x)) \\, dx = k \\int_{a}^{b} f(x)g(x) \\, dx $$
4. The remaining integral is exactly $\\langle f, g \\rangle$:
   $$ k\\langle f, g \\rangle $$
Thus, $\\langle kf, g \\rangle = k\\langle f, g \\rangle$.`;
      hint = "Constants can be moved outside the integral sign in definite integration.";
    } else {
      title = "Positivity Axiom";
      statement = `Let $V = C[a, b]$ with the inner product defined by:
${integralDef}
Show that the Positivity Axiom holds: $\\langle f, f \\rangle \\ge 0$, and $\\langle f, f \\rangle = 0 \\iff f = 0$.`;
      solution = "Reasoning: Use the fact that the square of a real-valued function is non-negative and the property of integrals for non-negative continuous functions.";
      explanation = `1. Evaluate the inner product of $f$ with itself:
   $$ \\langle f, f \\rangle = \\int_{a}^{b} f(x)f(x) \\, dx = \\int_{a}^{b} [f(x)]^2 \\, dx $$
2. Since $[f(x)]^2 \\ge 0$ for all $x$, the area under the curve (the integral) must be non-negative:
   $$ \\int_{a}^{b} [f(x)]^2 \\, dx \\ge 0 $$
3. For the second part, if $f(x) = 0$ (the zero function), then:
   $$ \\int_{a}^{b} 0^2 \\, dx = 0 $$
4. If $\\int_{a}^{b} [f(x)]^2 \\, dx = 0$, since $[f(x)]^2$ is non-negative and continuous, the function $f(x)$ must be zero for all $x \\in [a, b]$. If there were any point where $f(x) \\ne 0$, then $[f(x)]^2 > 0$ in some interval, making the integral strictly positive.
Thus, the Positivity Axiom holds.`;
      hint = "Remember that $[f(x)]^2$ is always non-negative. What can you say about the integral of a non-negative continuous function being zero?";
    }

    return {
      title,
      statement,
      prompt: "Reasoning: Provide a brief logical explanation of the proof.",
      solution: "Proof confirmed. See detailed solution for steps.",
      explanation,
      hint,
      guide: integralAxiomsGuide
    };
  }
};

const integralAxiomsGuide = {
  title: "Inner Product Axioms (Integral)",
  content: `
To prove that a function is an inner product, you must verify it satisfies these 4 axioms for all vectors $u, v, w$ and scalar $k$:

1. Symmetry: $\\langle u, v \\rangle = \\langle v, u \\rangle$
2. Additivity: $\\langle u + v, w \\rangle = \\langle u, w \\rangle + \\langle v, w \\rangle$
3. Homogeneity: $\\langle ku, v \\rangle = k\\langle u, v \\rangle$
4. Positivity: $\\langle v, v \\rangle \\ge 0$ and $\\langle v, v \\rangle = 0 \\iff v = 0$

For the Integral Inner Product, these coincide with fundamental properties of integration (commutativity, linearity, and non-negativity of squared integrals).
`
};
