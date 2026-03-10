export const gramSchmidtLogic = {
    generate: () => {
      // Generate a symmetric block matrix: [[a, b, 0], [b, a, 0], [0, 0, c]]
      const a = Math.floor(Math.random() * 4) + 2; // 2 to 5
      const b = Math.floor(Math.random() * 2) + 1; // 1 to 2, ensures non-zero, simple
      const c = Math.floor(Math.random() * 5) + 1; // 1 to 5
  
      const lambda1 = a + b;
      const lambda2 = a - b;
      const lambda3 = c;
  
      // Sort eigenvalues for consistent display
      const eigenvalues = [lambda1, lambda2, lambda3].sort((x, y) => x - y);
  
      const matrixLatex = `\\begin{pmatrix} ${a} & ${b} & 0 \\\\ ${b} & ${a} & 0 \\\\ 0 & 0 & ${c} \\end{pmatrix}`;
  
      return {
        title: "Basis & Gram-Schmidt",
        statement: `Let
  $$ A = ${matrixLatex}. $$
  
  (a) Find the eigenvalues of $A$.
  (b) Find a basis of eigenvectors for each eigenvalue.
  (c) Using the eigenvectors, apply the Gram-Schmidt process to construct an orthonormal basis of $\\mathbb{R}^3$.`,
        prompt: "Final Answer (Part c): Enter the resulting orthonormal basis set.",
        solution: `Eigenvalues: $\\lambda = ${eigenvalues.join(", ")}$
  
  Orthonormal Basis:
  $$ \\left\\{ \\frac{1}{\\sqrt{2}}\\begin{pmatrix}1\\\\1\\\\0\\end{pmatrix}, \\frac{1}{\\sqrt{2}}\\begin{pmatrix}1\\\\-1\\\\0\\end{pmatrix}, \\begin{pmatrix}0\\\\0\\\\1\\end{pmatrix} \\right\\} $$`,
        explanation: `Part (a): Eigenvalues
  The matrix is block diagonal. The bottom-right entry $${c}$ is an eigenvalue.
  For the top-left 2x2 block, we have the special form $\\begin{pmatrix} a & b \\\\ b & a \\end{pmatrix}$ where $a=${a}$ and $b=${b}$.
  The eigenvalues for this pattern are always $a \\pm b$.
  Substituting our values: $${a} \\pm ${b}$, so the eigenvalues are $\\lambda = ${lambda1}$ and $\\lambda = ${lambda2}$.
  Including the third eigenvalue, we have $\\lambda = ${lambda1}, ${lambda2}, ${lambda3}$.

  Part (b): Eigenvectors
  - For $\\lambda = ${lambda1}$:
    $$ (A - (${a+b})I)v = 0 \\implies v_1 = \\begin{pmatrix} 1 \\\\ 1 \\\\ 0 \\end{pmatrix} $$
  - For $\\lambda = ${lambda2}$:
    $$ (A - (${a-b})I)v = 0 \\implies v_2 = \\begin{pmatrix} 1 \\\\ -1 \\\\ 0 \\end{pmatrix} $$
  - For $\\lambda = ${lambda3}$:
    $$ v_3 = \\begin{pmatrix} 0 \\\\ 0 \\\\ 1 \\end{pmatrix} $$

  Part (c): Orthonormal Basis
  Since $A$ is symmetric, eigenvectors corresponding to distinct eigenvalues are already orthogonal.
  Check: $v_1 \\cdot v_2 = 1(1) + 1(-1) = 0$. Both are orthogonal to $v_3$.

  We only need to normalize them:
  $$ u_1 = \\frac{v_1}{\\|v_1\\|} = \\frac{1}{\\sqrt{2}} \\begin{pmatrix} 1 \\\\ 1 \\\\ 0 \\end{pmatrix} $$
  $$ u_2 = \\frac{v_2}{\\|v_2\\|} = \\frac{1}{\\sqrt{2}} \\begin{pmatrix} 1 \\\\ -1 \\\\ 0 \\end{pmatrix} $$
  $$ u_3 = \\frac{v_3}{\\|v_3\\|} = \\begin{pmatrix} 0 \\\\ 0 \\\\ 1 \\end{pmatrix} $$

  Thus, the orthonormal basis is $\\{ u_1, u_2, u_3 \\}$.`,
        hint: "For a symmetric matrix, eigenvectors from distinct eigenvalues are orthogonal. You just need to normalize distinct eigenvectors.",
        guide: {
          title: "Spectral Theorem & Gram-Schmidt",
          content: `
- Symmetric Matrices: Always have real eigenvalues and orthogonal eigenvectors for distinct eigenvalues.
- Gram-Schmidt: Converts any basis $\\{v_1, \\dots, v_n\\}$ into an orthonormal basis $\\{u_1, \\dots, u_n\\}$.
- Normalization: $u_i = \\frac{v_i}{\\|v_i\\|}$.
          `
        }
      };
    }
  };
