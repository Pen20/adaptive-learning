export const determinantLogic = {
  generate: () => {
    const a1 = Math.floor(Math.random() * 5) + 1;
    // We don't strictly need b1 and c1 for the solution in this specific matrix setup,
    // but we can generate them if we wanted to vary the matrix more.
    // The matrix provided is:
    // [ a1  4  3 ]
    // [ -3  0 -5 ]
    // [ k   4  3 ]
    //
    // Determinant calculation:
    // = a1(0 - (-20)) - 4(-9 - (-5k)) + 3(-12 - 0)
    // = 20a1 - 4(-9 + 5k) - 36
    // = 20a1 + 36 - 20k - 36
    // = 20a1 - 20k
    //
    // For det != 0:
    // 20a1 - 20k != 0
    // 20a1 != 20k
    // k != a1

    return {
      title: "Determinants with Variables",
      statement: `$$ \\text{Find the values of k for which the determinant is non-zero: } \\begin{bmatrix} ${a1} & 4 & 3 \\\\ -3 & 0 & -5 \\\\ k & 4 & 3 \\end{bmatrix} $$`,
      prompt: "Find the values of k for which the determinant is non-zero:",
      solution: `$k \\neq ${a1}$`,
      explanation: `To find the values of $k$ where the determinant is non-zero, we must first calculate the determinant of the matrix:
$$ \\det(A) = \\begin{vmatrix} ${a1} & 4 & 3 \\\\ -3 & 0 & -5 \\\\ k & 4 & 3 \\end{vmatrix} $$
We can expand along the second row (since it has a zero):
$$ = -(-3) \\begin{vmatrix} 4 & 3 \\\\ 4 & 3 \\end{vmatrix} + 0 - (-5) \\begin{vmatrix} ${a1} & 4 \\\\ k & 4 \\end{vmatrix} $$
Notice the first minor has identical rows (4, 3 and 4, 3), so its determinant is 0:
$$ = 3(0) + 5(4(${a1}) - 4k) $$
$$ = 20${a1} - 20k $$
For the determinant to be non-zero:
$$ 20${a1} - 20k \\neq 0 $$
$$ 20${a1} \\neq 20k $$
$$ k \\neq ${a1} $$`,
      hint: "Expand the determinant along a row or column. The matrix is non-singular (determinant is non-zero) when the determinant value is not equal to zero. Notice the first and third rows are very similar.",
      guide: {
        title: "Singular Matrices",
        content: `
- Singular Matrix: A square matrix with determinant equal to zero.
- Non-singular: Determinant is non-zero.
- Linear Independence: If rows/columns are linearly dependent, determinant is zero.
        `
      }
    };
  }
};
