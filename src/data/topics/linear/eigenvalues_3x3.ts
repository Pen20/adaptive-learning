import { signedTerm } from "../format";

export const eigenvalues3x3Logic = {
  generate: () => {
    // Generate roots: r1 (integer), r2,3 = p +/- sqrt(q)
    // Characteristic poly: (L - r1)(L^2 - 2pL + p^2 - q) = L^3 - (r1+2p)L^2 + (2pr1 + p^2-q)L - r1(p^2-q) = 0
    
    // Randomize roots to keep numbers manageable
    let r1 = Math.floor(Math.random() * 6) + 1; // 1 to 6
    const p = Math.floor(Math.random() * 4) + 1;  // 1 to 4
    const qList = [2, 3, 5, 6, 4]; // Some non-squares + one square for variety
    const q = qList[Math.floor(Math.random() * qList.length)];

    // When q is a perfect square the three roots are integers, and r1 may
    // coincide with p ± sqrt(q). A repeated root would be listed once in the
    // solution while the CAS ground truth lists it with multiplicity, so a
    // student answering correctly would be marked wrong. Keep r1 distinct.
    if (Number.isInteger(Math.sqrt(q))) {
      const root = Math.sqrt(q);
      while (r1 === p + root || r1 === p - root) r1 = (r1 % 6) + 1;
    }
    
    const c2 = -(r1 + 2 * p);
    const c1 = (2 * p * r1) + (p * p - q);
    const c0 = -r1 * (p * p - q);
    
    // Matrix A in companion form:
    // [ 0  1  0 ]
    // [ 0  0  1 ]
    // [ -c0 -c1 -c2 ]
    const a31 = -c0;
    const a32 = -c1;
    const a33 = -c2;

    const matrixStr = `A = \\begin{bmatrix} 0 & 1 & 0 \\\\ 0 & 0 & 1 \\\\ ${a31} & ${a32} & ${a33} \\end{bmatrix}`;

    const statement = `Find the eigenvalues of the following $3 \\times 3$ matrix:
$$ ${matrixStr} $$`;

    const charPolyStr = `\\det(\\lambda I - A) = \\lambda^3 ${signedTerm(c2, "\\lambda^2")} ${signedTerm(c1, "\\lambda")} ${signedTerm(c0)} = 0`;

    // Solution formatting
    const isSquare = Math.sqrt(q) % 1 === 0;
    let solution;
    if (isSquare) {
      const r2 = p + Math.sqrt(q);
      const r3 = p - Math.sqrt(q);
      const roots = Array.from(new Set([r1, r2, r3])).sort((a, b) => a - b);
      solution = `$${roots
        .map((root, index) => `\\lambda_${index + 1} = ${root}`)
        .join(", ")}$`;
    } else {
      solution = `$\\lambda_1 = ${r1}, \\lambda_2 = ${p} + \\sqrt{${q}}, \\lambda_3 = ${p} - \\sqrt{${q}}$`;
    }

    const explanation = `To find the eigenvalues, we solve the characteristic equation $\\det(\\lambda I - A) = 0$:

1. Find the Characteristic Polynomial:
   The determinant of $\\lambda I - A$ for this companion matrix is:
   $$ ${charPolyStr} $$

2. Find an Integer Root:
   Using the Rational Root Theorem, we check divisors of the constant term $c_0 = ${c0}$.
   By substitution, we find that $\\lambda = ${r1}$ is a root:
   $$ (${r1})^3 ${signedTerm(c2)}(${r1})^2 ${signedTerm(c1)}(${r1}) ${signedTerm(c0)} = 0 $$
   Thus, $(\\lambda - ${r1})$ is a factor.

3. Polynomial Division:
   Divide the cubic polynomial by $(\\lambda - ${r1})$ to find the quadratic factor:
   $$ (\\lambda - ${r1})(\\lambda^2 - ${2*p}\\lambda ${signedTerm(p*p - q)}) = 0 $$

4. Solve the Quadratic Factor:
   Set the quadratic factor to zero: $\\lambda^2 - ${2*p}\\lambda ${signedTerm(p*p - q)} = 0$.
   Using the quadratic formula:
   $$ \\lambda = \\frac{-(-${2*p}) \\pm \\sqrt{(-${2*p})^2 - 4(1)(${p*p - q})}}{2(1)} = \\frac{${2*p} \\pm \\sqrt{${4*q}}}{2} = ${p} \\pm ${isSquare ? Math.sqrt(q) : `\\sqrt{${q}}`} $$

5. Final Eigenvalues:
   The eigenvalues are $ ${solution.replace(/\$/g, "")} $.`;

    return {
      title: "Eigenvalues of a 3x3 Matrix",
      statement,
      prompt: "Final Answer: List the eigenvalues separated by commas (e.g., 4, 2 + sqrt(3), 2 - sqrt(3)).",
      solution,
      answerFormat: {
        placeholder: "$\\lambda \\in \\{5, 2 + \\sqrt{3}, 2 - \\sqrt{3}\\}$",
        instruction: "Give all eigenvalues as a set. Set notation and +/- notation are accepted; order does not matter.",
        alternatives: [
          "{5, 2 + sqrt(3), 2 - sqrt(3)}",
          "lambda in {5, 2 +/- sqrt(3)}",
          "5, 2 + sqrt(3), 2 - sqrt(3)",
        ],
        fields: [
          { key: "lambda1", label: "lambda_1", placeholder: "5" },
          { key: "lambda2", label: "lambda_2", placeholder: "2 + sqrt(3)" },
          { key: "lambda3", label: "lambda_3", placeholder: "2 - sqrt(3)" },
        ],
      },
      explanation,
      hint: "For a companion matrix, the characteristic polynomial coefficients are simply the negated entries of the last row. Try to find one integer root first.",
      reasoningSteps: `Step 1 — Recognise the companion matrix: The last row directly encodes the characteristic polynomial coefficients (negated). No full 3×3 cofactor expansion is needed — read off the cubic λ³ + c₂λ² + c₁λ + c₀ = 0 immediately.
Step 2 — Write the characteristic polynomial: Substitute the last-row entries to get the explicit cubic.
Step 3 — Apply the Rational Root Theorem: Integer roots must divide the constant term c₀. Test these divisors by direct substitution to identify λ = r₁.
Step 4 — Divide out (λ − r₁): Use synthetic division to reduce the cubic to a quadratic factor (λ − r₁)(λ² − 2pλ + (p²−q)) = 0.
Step 5 — Solve the quadratic factor: Apply the quadratic formula to get λ₂ = p + √q and λ₃ = p − √q.
Step 6 — State all three eigenvalues.`,
      guide: eigenvalues3x3Guide
    };
  }
};

const eigenvalues3x3Guide = {
  title: "Eigenvalues of 3x3 Matrices",
  content: `
Finding eigenvalues of a $3 \\times 3$ matrix involves solving a cubic characteristic equation:
$$ \\det(\\lambda I - A) = 0 $$

General Steps:
1. Set up the determinant: Subtract $\\lambda$ from the diagonal and calculate the determinant.
2. Rational Root Theorem: If the coefficients are integers, any integer root must divide the constant term. Test these divisors to find one root, $\\lambda_1$.
3. Factoring: Use synthetic or long division to divide the cubic by $(\\lambda - \\lambda_1)$.
4. Quadratic Formula: Solve the resulting quadratic equation to find the remaining two eigenvalues ($\\lambda_2, \\lambda_3$).

Special Cases:
- Triangular Matrices: The eigenvalues are simply the diagonal entries.
- Companion Matrices: These have a specific form where the last row contains the coefficients of the characteristic polynomial.
`
};
