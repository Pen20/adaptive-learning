export const innerProductLogic = {
  generate: () => {
    // Randomly choose an exercise type
    const type = Math.floor(Math.random() * 2);
    
    if (type === 0) {
      // Type 0: Expand an inner product expression using axioms
      const k1 = Math.floor(Math.random() * 5) + 2; // 2 to 6
      const k2 = Math.floor(Math.random() * 5) + 2; // 2 to 6
      
      const statement = `Let $V$ be a real inner product space. Expand the expression using the axioms of the inner product:
$$ \\langle ${k1}u - ${k2}v, w \\rangle $$`;
      
      const prompt = "Final Answer: Enter the expanded expression.";
      const solution = `$${k1}\\langle u, w \\rangle - ${k2}\\langle v, w \\rangle$`;
      const explanation = `Using the Additivity Axiom:
$$ \\langle ${k1}u - ${k2}v, w \\rangle = \\langle ${k1}u, w \\rangle + \\langle -${k2}v, w \\rangle $$

Using the Homogeneity Axiom:
$$ \\langle ${k1}u, w \\rangle = ${k1}\\langle u, w \\rangle $$
$$ \\langle -${k2}v, w \\rangle = -${k2}\\langle v, w \\rangle $$

Combining these results, we get:
$$ ${k1}\\langle u, w \\rangle - ${k2}\\langle v, w \\rangle $$`;

      return {
        title: "Expanding Inner Products",
        statement,
        prompt,
        solution,
        explanation,
        hint: "Use the additivity axiom to split the sum and the homogeneity axiom to pull out the constants.",
        guide: innerProductGuide
      };
    } else {
      // Type 1: Symmetry and Homogeneity combination
      const k = Math.floor(Math.random() * 9) + 2; // 2 to 10
      
      const statement = `Let $V$ be a real inner product space. If $\\langle u, v \\rangle = ${k}$, find the value of:
$$ \\langle 2v, 3u \\rangle $$`;
      
      const prompt = "Final Answer: Enter the numerical value.";
      const solution = `$${6 * k}$`;
      const explanation = `1. Use the Homogeneity Axiom on the first slot:
   $$ \\langle 2v, 3u \\rangle = 2\\langle v, 3u \\rangle $$
2. Use the Symmetry Axiom to swap $v$ and $3u$:
   $$ 2\\langle v, 3u \\rangle = 2\\langle 3u, v \\rangle $$
3. Use the Homogeneity Axiom on the new first slot:
   $$ 2\\langle 3u, v \\rangle = 2 \\cdot 3\\langle u, v \\rangle = 6\\langle u, v \\rangle $$
4. Substitute the given value $\\langle u, v \\rangle = ${k}$:
   $$ 6(${k}) = ${6 * k} $$`;

      return {
        title: "Axiom Properties",
        statement,
        prompt,
        solution,
        explanation,
        hint: "Remember that for a real inner product space, the homogeneity axiom applies to both slots due to symmetry.",
        guide: innerProductGuide
      };
    }
  }
};

const innerProductGuide = {
  title: "Definition of Inner Product",
  content: `
An inner product on a real vector space $V$ is a function that associates a real number $\\langle u, v \\rangle$ with each pair of vectors $u, v \\in V$ satisfying the following axioms for all $u, v, w \\in V$ and scalar $k$:

1. Symmetry Axiom:
    $$ \\langle u, v \\rangle = \\langle v, u \\rangle $$
2. Additivity Axiom:
    $$ \\langle u + v, w \\rangle = \\langle u, w \\rangle + \\langle v, w \\rangle $$
3. Homogeneity Axiom:
    $$ \\langle ku, v \\rangle = k\\langle u, v \\rangle $$
4. Positivity Axiom:
    $$ \\langle v, v \\rangle \\ge 0 \\text{ and } \\langle v, v \\rangle = 0 \\iff v = 0 $$

A real vector space with an inner product is called a real inner product space.
  `
};
