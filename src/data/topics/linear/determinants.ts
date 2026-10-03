import { buildExercisePedagogyInstance } from "@/data/pedagogy";
import { paren } from "../format";

export const determinantLogic = {
  generate: () => {
    const type = Math.floor(Math.random() * 3);

    if (type === 0) {
      // Original: find k such that det ≠ 0
      const a1 = Math.floor(Math.random() * 8) + 1; // 1–8
      return {
        title: "Determinants with Variables",
        statement: `Find the values of $k$ for which the determinant is non-zero:
$$ \\begin{bmatrix} ${a1} & 4 & 3 \\\\ -3 & 0 & -5 \\\\ k & 4 & 3 \\end{bmatrix} $$`,
        prompt: "Find the values of $k$ for which the determinant is non-zero:",
        solution: `$k \\neq ${a1}$`,
        answerFormat: {
          placeholder: "Example: k != 3",
          instruction: "Give the excluded value as a parameter condition. You may use !=, not equal, or LaTeX \\neq.",
          alternatives: ["k != 3", "k not equal 3", "k \\neq 3"],
          fields: [{ key: "k", label: "k", operator: "!=", placeholder: String(a1) }],
        },
        explanation: `Expanding along the second row (which contains a zero):
$$ = -(-3) \\begin{vmatrix} 4 & 3 \\\\ 4 & 3 \\end{vmatrix} + 0 - (-5) \\begin{vmatrix} ${a1} & 4 \\\\ k & 4 \\end{vmatrix} $$
The first minor has identical rows, so its determinant is $0$:
$$ = 5(4 \\cdot ${a1} - 4k) = 5(${4 * a1} - 4k) = ${20 * a1} - 20k $$
For the determinant to be non-zero: $${20 * a1} - 20k \\neq 0$, i.e. $k \\neq ${a1}$.`,
        hint: "Expand along the row with a zero to simplify. Notice the first and third rows look similar.",
        reasoningSteps: `Step 1 — Choose the expansion row: Select the row containing a zero to minimise work (the second row here has a zero entry).
Step 2 — Cofactor expansion: For each non-zero entry in the chosen row, multiply it by its signed 2×2 minor. Skip entries equal to zero.
Step 3 — Compute each 2×2 minor: Use ad − bc for the relevant sub-matrix.
Step 4 — Simplify: Collect all terms and express the result as a linear expression in k.
Step 5 — Set up the non-zero condition: det ≠ 0 ⟺ the linear expression ≠ 0 ⟺ k ≠ [value].`,
        guide: {
          title: "Singular Matrices",
          content: `
- Singular Matrix: determinant equals zero.
- Non-singular: determinant is non-zero (matrix is invertible).
- Expanding along a row with zeros reduces the calculation.`,
        },
        pedagogy: buildExercisePedagogyInstance(
          "determinants",
          "DET-NONZERO-3X3",
          {
            "cofactor-expansion": {
              determinantExpression: `${20 * a1} - 20k`,
              excludedValue: String(a1),
            },
            "row-comparison": { equalRowsWhen: `k = ${a1}` },
          },
        ),
      };
    }

    if (type === 1) {
      // Compute the 3×3 determinant of a fully specified matrix
      const m = () => Math.floor(Math.random() * 5) - 2; // –2 to 2
      const a = [m(), m(), m(), m(), m(), m(), m(), m(), m()];
      // det by cofactor expansion along row 0
      const det =
        a[0] * (a[4] * a[8] - a[5] * a[7]) -
        a[1] * (a[3] * a[8] - a[5] * a[6]) +
        a[2] * (a[3] * a[7] - a[4] * a[6]);
      const minor1 = a[4] * a[8] - a[5] * a[7];
      const minor2 = a[3] * a[8] - a[5] * a[6];
      const minor3 = a[3] * a[7] - a[4] * a[6];
      return {
        title: "Determinants — Computation",
        statement: `Compute the determinant:
$$ \\begin{vmatrix} ${a[0]} & ${a[1]} & ${a[2]} \\\\ ${a[3]} & ${a[4]} & ${a[5]} \\\\ ${a[6]} & ${a[7]} & ${a[8]} \\end{vmatrix} $$`,
        prompt: "Find $\\det(A)$:",
        solution: `$\\det(A) = ${det}$`,
        answerFormat: {
          placeholder: "Example: det(A) = 12",
          instruction: "Give the determinant value. You may write det(A) = 12 or just the number if your reasoning makes it clear.",
          alternatives: ["det(A) = 12", "12"],
          fields: [{ key: "determinant", label: "det(A)", placeholder: "12" }],
        },
        explanation: `Expanding along the first row:
$$ \\det(A) = ${paren(a[0])} \\begin{vmatrix} ${a[4]} & ${a[5]} \\\\ ${a[7]} & ${a[8]} \\end{vmatrix} - ${paren(a[1])} \\begin{vmatrix} ${a[3]} & ${a[5]} \\\\ ${a[6]} & ${a[8]} \\end{vmatrix} + ${paren(a[2])} \\begin{vmatrix} ${a[3]} & ${a[4]} \\\\ ${a[6]} & ${a[7]} \\end{vmatrix} $$
$$ = ${paren(a[0])}(${a[4] * a[8]} - ${paren(a[5] * a[7])}) - ${paren(a[1])}(${a[3] * a[8]} - ${paren(a[5] * a[6])}) + ${paren(a[2])}(${a[3] * a[7]} - ${paren(a[4] * a[6])}) $$
$$ = ${a[0] * minor1} - ${paren(a[1] * minor2)} + ${paren(a[2] * minor3)} = ${det} $$`,
        hint: "Use cofactor expansion along the first row: $\\det(A) = a_{11}C_{11} + a_{12}C_{12} + a_{13}C_{13}$.",
        reasoningSteps: `Step 1 — Choose a row for cofactor expansion: Row 1 (or any row with convenient entries).
Step 2 — Compute the three 2×2 minors: Delete row 1 and the corresponding column for each entry; evaluate each minor as ad − bc.
Step 3 — Apply the cofactor signs: Pattern for row 1 is +, −, + (i.e. (−1)^(1+j) for j = 1, 2, 3).
Step 4 — Multiply each entry by its signed cofactor: a₁₁·C₁₁ − a₁₂·C₁₂ + a₁₃·C₁₃.
Step 5 — Sum the three products and state det(A) = [result].`,
        guide: {
          title: "3×3 Determinant",
          content: `Cofactor expansion along row 1:
$$ \\det(A) = a_{11}(a_{22}a_{33} - a_{23}a_{32}) - a_{12}(a_{21}a_{33} - a_{23}a_{31}) + a_{13}(a_{21}a_{32} - a_{22}a_{31}) $$`,
        },
        pedagogy: buildExercisePedagogyInstance(
          "determinants",
          "DET-COMPUTE-3X3",
          {
            "cofactor-expansion": {
              firstMinor: String(minor1),
              secondMinor: String(minor2),
              thirdMinor: String(minor3),
              finalDeterminant: String(det),
            },
            "sarrus-rule": { finalDeterminant: String(det) },
            "row-reduction": { finalDeterminant: String(det) },
          },
        ),
      };
    }

    // type === 2: 2×2 determinant with a variable
    const p = Math.floor(Math.random() * 5) + 2; // 2–6
    const q = Math.floor(Math.random() * 4) + 1; // 1–4
    const r = Math.floor(Math.random() * 3) + 1; // 1–3
    // Matrix: [[p, q], [r, k]], det = pk - qr. det = 0 → k = qr/p (only integer if divisible)
    const prod = q * r;
    const singular = prod % p === 0 ? prod / p : null;
    return {
      title: "Determinants with Variables",
      statement: `Find the value of $k$ for which the matrix is singular:
$$ A = \\begin{bmatrix} ${p} & ${q} \\\\ ${r} & k \\end{bmatrix} $$`,
      prompt: "Find $k$ such that $\\det(A) = 0$:",
      solution: singular !== null
        ? `$k = ${singular}$`
        : `$k = \\dfrac{${prod}}{${p}}$`,
      answerFormat: {
        placeholder: "Example: k = 3/2",
        instruction: "Give the value of k that makes the determinant zero. Fractions, decimals, and simplified LaTeX fractions are accepted.",
        alternatives: ["k = 3/2", "3/2", "k = \\frac{3}{2}"],
        fields: [{ key: "k", label: "k", placeholder: "3/2" }],
      },
      explanation: `A matrix is singular when its determinant equals zero.
$$ \\det(A) = ${p}k - ${q} \\cdot ${r} = ${p}k - ${prod} = 0 $$
$$ k = \\frac{${prod}}{${p}}${singular !== null ? ` = ${singular}` : ""} $$`,
      hint: "Set the determinant equal to zero and solve for $k$. For a 2×2 matrix: $\\det = ad - bc$.",
      reasoningSteps: `Step 1 — Write the 2×2 determinant formula: det(A) = ad − bc where a, b, c, d are the matrix entries.
Step 2 — Substitute the known entries: leave k as a symbol, substitute all other values.
Step 3 — Set det(A) = 0 (condition for a singular matrix): solve the resulting linear equation for k.
Step 4 — State k = [value] and verify by substitution.`,
      guide: {
        title: "Singular Matrices",
        content: `
- $\\det \\begin{bmatrix} a & b \\\\ c & d \\end{bmatrix} = ad - bc$
- Singular ↔ $\\det = 0$ ↔ rows/columns are linearly dependent.`,
      },
      pedagogy: buildExercisePedagogyInstance(
        "determinants",
        "DET-SINGULAR-2X2",
        {
          "two-by-two-formula": {
            determinantExpression: `${p}k - ${prod}`,
            parameterValue: singular !== null ? String(singular) : `${prod}/${p}`,
          },
        },
      ),
    };
  },
};
