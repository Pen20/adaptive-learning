export const eigenvalueLogic = {
  generate: () => {
    const val = Math.floor(Math.random() * 4) + 1;
    // Generates a symmetric matrix with known eigenvalues
    return {
      title: "Eigenvalues & Vectors",
      statement: ` Find the eigenvalues of $$ A = \\begin{pmatrix} ${val + 1} & 1 \\\\ 1 & ${val + 1} \\end{pmatrix} $$`,
      prompt: "Find the eigenvalues $\\lambda$:",
      solution: `$\\lambda_1 = ${val}, \\lambda_2 = ${val + 2}$`,
      explanation: `To find the eigenvalues, we solve the characteristic equation $\\det(A - \\lambda I) = 0$:
$$ \\det \\begin{pmatrix} ${val + 1} - \\lambda & 1 \\\\ 1 & ${val + 1} - \\lambda \\end{pmatrix} = 0 $$
$$ (${val + 1} - \\lambda)^2 - 1(1) = 0 $$
$$ (${val + 1} - \\lambda)^2 = 1 $$
Taking the square root of both sides:
$$ ${val + 1} - \\lambda = \\pm 1 $$
Case 1:
$$ ${val + 1} - \\lambda = 1 \\implies \\lambda = ${val} $$
Case 2:
$$ ${val + 1} - \\lambda = -1 \\implies \\lambda = ${val + 2} $$
Therefore, the eigenvalues are $\\lambda_1 = ${val}$ and $\\lambda_2 = ${val + 2}$.`,
      hint: "Solve the characteristic equation $\\det(A - \\lambda I) = 0$.",
       guide: {
        title: "Eigenvalues Guide",
        content: `
- Characteristic Equation: $\\det(A - \\lambda I) = 0$
- Trace: Sum of diagonal elements = Sum of eigenvalues.
- Determinant: Product of eigenvalues.
        `
      }
    };
  }
};
