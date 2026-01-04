export const eigenvalueLogic = {
  generate: () => {
    const val = Math.floor(Math.random() * 4) + 1;
    // Generates a symmetric matrix with known eigenvalues
    return {
      title: "Eigenvalues & Vectors",
      statement: ` Find the eigenvalues of $$ A = \\begin{pmatrix} ${val + 1} & 1 \\\\ 1 & ${val + 1} \\end{pmatrix} $$`,
      prompt: "Find the eigenvalues $\\lambda$:",
      solution: `\\lambda_1 = ${val}, \\lambda_2 = ${val + 2}`,
      hint: "Solve the characteristic equation $\\det(A - \\lambda I) = 0$.",
       guide: {
        title: "Eigenvalues Guide",
        content: `
- **Characteristic Equation**: $\\det(A - \\lambda I) = 0$
- **Trace**: Sum of diagonal elements = Sum of eigenvalues.
- **Determinant**: Product of eigenvalues.
        `
      }
    };
  }
};
