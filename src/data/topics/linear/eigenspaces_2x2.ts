export const eigenspaces2x2Logic = {
  generate: () => {
    // We want matrices with integer eigenvalues.
    // L^2 - Trace*L + Det = (L - L1)(L - L2) = L^2 - (L1+L2)L + L1*L2
    
    // Randomize types: 0 (distinct), 1 (repeated diagonalizable), 2 (repeated non-diagonalizable)
    const type = Math.floor(Math.random() * 3);
    
    let a, b, c, d, L1, L2;
    
    if (type === 0) {
      // Distinct integer roots
      L1 = Math.floor(Math.random() * 10) - 4; // -4 to 5
      do {
        L2 = Math.floor(Math.random() * 10) - 4;
      } while (L1 === L2);
      
      // Construct A such that trace = L1+L2 and det = L1*L2
      a = L1 + (Math.floor(Math.random() * 3) + 1);
      d = (L1 + L2) - a;
      const targetBC = a * d - L1 * L2;
      
      if (targetBC === 0) {
        b = Math.floor(Math.random() * 3) + 1;
        c = 0;
      } else {
        const absBC = Math.abs(targetBC);
        let factors = [];
        for (let i = 1; i <= Math.sqrt(absBC); i++) {
          if (absBC % i === 0) {
            factors.push(i);
            factors.push(absBC / i);
          }
        }
        b = factors[Math.floor(Math.random() * factors.length)];
        c = targetBC / b;
      }
    } else if (type === 1) {
      // Repeated diagonalizable (Scalar matrix)
      L1 = L2 = Math.floor(Math.random() * 6) + 1;
      a = d = L1;
      b = c = 0;
    } else {
      // Repeated non-diagonalizable (Jordan block like)
      L1 = L2 = Math.floor(Math.random() * 6) + 1;
      a = d = L1;
      b = Math.floor(Math.random() * 4) + 1;
      c = 0;
    }

    const matrixStr = `A = \\begin{bmatrix} ${a} & ${b} \\\\ ${c} & ${d} \\end{bmatrix}`;
    const statement = `Find the characteristic equation, the eigenvalues, and bases for the eigenspaces of the following $2 \\times 2$ matrix:
$$ ${matrixStr} $$`;

    const charEq = `\\lambda^2 - ${a + d}\\lambda + ${a * d - b * c} = 0`;
    const factoredCharEq = L1 === L2 ? `(\\lambda - ${L1})^2 = 0` : `(\\lambda - ${L1})(\\lambda - ${L2}) = 0`;
    
    const formatVector = (x: number, y: number) => `\\begin{bmatrix} ${x} \\\\ ${y} \\end{bmatrix}`;
    
    const getBasis = (L: number) => {
      const mA = a - L;
      const mB = b;
      const mC = c;
      const mD = d - L;
      
      if (mA === 0 && mB === 0 && mC === 0 && mD === 0) {
        return [`${formatVector(1, 0)}, ${formatVector(0, 1)}`];
      }
      
      if (mA !== 0 || mB !== 0) {
        const gcd = (p: number, q: number): number => (!q ? p : gcd(q, p % q));
        const div = Math.abs(gcd(mA, mB));
        const vx = -mB / div;
        const vy = mA / div;
        if (vx < 0 || (vx === 0 && vy < 0)) return [formatVector(-vx, -vy)];
        return [formatVector(vx, vy)];
      } else {
        const gcd = (p: number, q: number): number => (!q ? p : gcd(q, p % q));
        const div = Math.abs(gcd(mC, mD));
        const vx = -mD / div;
        const vy = mC / div;
        if (vx < 0 || (vx === 0 && vy < 0)) return [formatVector(-vx, -vy)];
        return [formatVector(vx, vy)];
      }
    };

    const basis1 = getBasis(L1);
    const basis2 = L1 !== L2 ? getBasis(L2) : [];

    let solution;
    if (L1 === L2) {
      solution = `Equation: $\\lambda^2 - ${a+d}\\lambda + ${a*d-b*c} = 0$, Eigenvalue: $\\lambda = ${L1}$, Basis: $\\{ ${basis1.join(", ")} \\}$`;
    } else {
      const sortedL = [L1, L2].sort((x, y) => x - y);
      const bA = (sortedL[0] === L1 ? basis1 : basis2) || [];
      const bB = (sortedL[0] === L1 ? basis2 : basis1) || [];
      solution = `Equation: $\\lambda^2 - ${a+d}\\lambda + ${a*d-b*c} = 0$, Eigenvalues: $\\lambda = ${sortedL[0]}, ${sortedL[1]}$, Bases: $\\lambda = ${sortedL[0]}: \\{ ${bA.join(", ")} \\}, \\lambda = ${sortedL[1]}: \\{ ${bB.join(", ")} \\}$`;
    }

    const explanation = `To find the eigenvalues and eigenspaces of $A$:

1. Find the Characteristic Equation:
   Solve $\\det(\\lambda I - A) = 0$:
   $$ \\det \\begin{bmatrix} \\lambda - ${a} & -${b} \\\\ -${c} & \\lambda - ${d} \\end{bmatrix} = (\\lambda - ${a})(\\lambda - ${d}) - (-${b})(-${c}) = 0 $$
   $$ ${charEq} $$

2. Find the Eigenvalues:
   Factoring the equation:
   $$ ${factoredCharEq} $$
   ${L1 === L2 ? `The eigenvalue is $\\lambda = ${L1}$ (multiplicity 2).` : `The eigenvalues are $\\lambda_1 = ${L1}$ and $\\lambda_2 = ${L2}$.`}

3. Find Bases for Eigenspaces:
   For each $\\lambda$, solve the homogeneous system $(A - \\lambda I)\\mathbf{x} = \\mathbf{0}$:

   Case $\\lambda = ${L1}$:
   The system is:
   $$ \\begin{bmatrix} ${a - L1} & ${b} \\\\ ${c} & ${d - L1} \\end{bmatrix} \\begin{bmatrix} x_1 \\\\ x_2 \\end{bmatrix} = \\begin{bmatrix} 0 \\\\ 0 \\end{bmatrix} $$
   This simplifies to the equation: $ ${a - L1 === 0 && b === 0 ? "0 = 0" : `${a-L1}x_1 + ${b}x_2 = 0`} $
   A basis for this eigenspace is: $\\{ ${basis1.join(", ")} \\}$.

   ${L1 !== L2 ? `
   Case $\\lambda = ${L2}$:
   The system is:
   $$ \\begin{bmatrix} ${a - L2} & ${b} \\\\ ${c} & ${d - L2} \\end{bmatrix} \\begin{bmatrix} x_1 \\\\ x_2 \\end{bmatrix} = \\begin{bmatrix} 0 \\\\ 0 \\end{bmatrix} $$
   This simplifies to: $ ${a - L2 === 0 && b === 0 ? "0 = 0" : `${a-L2}x_1 + ${b}x_2 = 0`} $
   A basis for this eigenspace is: $\\{ ${basis2!.join(", ")} \\}$.` : ""}

Final Summary:
- Characteristic Equation: $ ${charEq} $
- Eigenvalues: ${L1 === L2 ? `$\\lambda = ${L1}$` : `$\\lambda = ${L1}, ${L2}$`}
- Bases: ${solution.split("Bases: ")[1] || solution.split("Basis: ")[1]}`;

    return {
      title: "Bases for Eigenspaces (2x2)",
      statement,
      prompt: "Final Answer: Provide the characteristic equation, the eigenvalues, and the bases.",
      solution,
      explanation,
      hint: "First find the roots of the characteristic polynomial. Then, for each root, find the non-trivial solutions to $(A - \\lambda I)\\mathbf{x} = \\mathbf{0}$.",
      guide: eigenspaces2x2Guide
    };
  }
};

const eigenspaces2x2Guide = {
  title: "Eigenspaces of 2x2 Matrices",
  content: `
An eigenspace corresponding to an eigenvalue $\\lambda$ is the set of all eigenvectors associated with $\\lambda$, together with the zero vector. It is the null space of the matrix $(A - \\lambda I)$.

Procedure:
1. Characteristic Equation: Solve $\\det(A - \\lambda I) = 0$ to find eigenvalues.
2. Homogeneous System: For each eigenvalue $\\lambda$, set up the system:
   $$ (A - \\lambda I)\\mathbf{x} = \\mathbf{0} $$
3. Solve for x: Use row reduction or substitution to find the general solution.
4. Basis: Express the general solution as a linear combination of vectors; these vectors form the basis for the eigenspace.

Key Facts:
- The dimension of an eigenspace (geometric multiplicity) is always at least 1 and at most the algebraic multiplicity of the eigenvalue.
- If a $2 \\times 2$ matrix has two distinct eigenvalues, each eigenspace has dimension 1.
- If it has a repeated eigenvalue, the eigenspace could have dimension 1 or 2.
`
};
