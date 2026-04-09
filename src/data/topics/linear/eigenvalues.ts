export const eigenvalueLogic = {
  generate: () => {
    const type = Math.floor(Math.random() * 3);

    if (type === 0) {
      // Diagonal matrix — eigenvalues read directly from diagonal
      const a = Math.floor(Math.random() * 6) + 1; // 1–6
      const b = a + Math.floor(Math.random() * 4) + 1; // always distinct
      return {
        title: "Eigenvalues & Vectors",
        statement: `Find the eigenvalues of $$ A = \\begin{pmatrix} ${a} & 0 \\\\ 0 & ${b} \\end{pmatrix} $$`,
        prompt: "Find all eigenvalues $\\lambda$:",
        solution: `$\\lambda_1 = ${a},\\ \\lambda_2 = ${b}$`,
        explanation: `For a diagonal matrix, the eigenvalues are simply the diagonal entries.
We can verify by solving $\\det(A - \\lambda I) = 0$:
$$ \\det \\begin{pmatrix} ${a} - \\lambda & 0 \\\\ 0 & ${b} - \\lambda \\end{pmatrix} = (${a} - \\lambda)(${b} - \\lambda) = 0 $$
Therefore $\\lambda_1 = ${a}$ and $\\lambda_2 = ${b}$.`,
        hint: "For a diagonal matrix, the eigenvalues are the entries on the main diagonal.",
        guide: {
          title: "Eigenvalues Guide",
          content: `
- Characteristic Equation: $\\det(A - \\lambda I) = 0$
- Diagonal matrices: eigenvalues are the diagonal entries.
- Trace: Sum of diagonal elements = Sum of eigenvalues.
- Determinant: Product of eigenvalues.`,
        },
      };
    }

    if (type === 1) {
      // Upper triangular matrix — eigenvalues are diagonal entries
      const a = Math.floor(Math.random() * 5) + 1; // 1–5
      const b = a + Math.floor(Math.random() * 3) + 1;
      const c = Math.floor(Math.random() * 4) + 1; // off-diagonal, non-zero
      return {
        title: "Eigenvalues & Vectors",
        statement: `Find the eigenvalues of $$ A = \\begin{pmatrix} ${a} & ${c} \\\\ 0 & ${b} \\end{pmatrix} $$`,
        prompt: "Find all eigenvalues $\\lambda$:",
        solution: `$\\lambda_1 = ${a},\\ \\lambda_2 = ${b}$`,
        explanation: `For a triangular matrix, the eigenvalues are the diagonal entries.
Verify via $\\det(A - \\lambda I) = 0$:
$$ \\det \\begin{pmatrix} ${a} - \\lambda & ${c} \\\\ 0 & ${b} - \\lambda \\end{pmatrix} = (${a} - \\lambda)(${b} - \\lambda) = 0 $$
Therefore $\\lambda_1 = ${a}$ and $\\lambda_2 = ${b}$.`,
        hint: "For a triangular matrix, the eigenvalues are the diagonal entries.",
        guide: {
          title: "Eigenvalues Guide",
          content: `
- Characteristic Equation: $\\det(A - \\lambda I) = 0$
- Triangular matrices: eigenvalues are the diagonal entries.
- Trace: Sum of diagonal elements = Sum of eigenvalues.`,
        },
      };
    }

    // type === 2: Symmetric matrix [[n+1, 1], [1, n+1]]
    const val = Math.floor(Math.random() * 7) + 1; // 1–7
    return {
      title: "Eigenvalues & Vectors",
      statement: `Find the eigenvalues of $$ A = \\begin{pmatrix} ${val + 1} & 1 \\\\ 1 & ${val + 1} \\end{pmatrix} $$`,
      prompt: "Find all eigenvalues $\\lambda$:",
      solution: `$\\lambda_1 = ${val},\\ \\lambda_2 = ${val + 2}$`,
      explanation: `Solve $\\det(A - \\lambda I) = 0$:
$$ \\det \\begin{pmatrix} ${val + 1} - \\lambda & 1 \\\\ 1 & ${val + 1} - \\lambda \\end{pmatrix} = (${val + 1} - \\lambda)^2 - 1 = 0 $$
$$ (${val + 1} - \\lambda)^2 = 1 \\implies ${val + 1} - \\lambda = \\pm 1 $$
Case 1: $\\lambda = ${val}$. Case 2: $\\lambda = ${val + 2}$.`,
      hint: "Solve the characteristic equation $\\det(A - \\lambda I) = 0$.",
      guide: {
        title: "Eigenvalues Guide",
        content: `
- Characteristic Equation: $\\det(A - \\lambda I) = 0$
- Trace: Sum of diagonal elements = Sum of eigenvalues.
- Determinant: Product of eigenvalues.`,
      },
    };
  },
};
