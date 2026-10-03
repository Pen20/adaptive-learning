const vectorSpaceGuide = {
  title: "Testing Vector Spaces",
  content: `To show a set is NOT a vector space, you only need to find **one** axiom that fails.

Common failure points:
- **No Zero Vector**: If $\\mathbf{0}$ is not in the set.
- **Not Closed under Addition**: Adding two elements gives something outside the set.
- **Not Closed under Scalar Multiplication**: Multiplying by a scalar exits the set.
- **Redefined Operations**: A "weird" scalar multiplication rule that breaks linearity.`,
};

const scenarios = [
  {
    title: "Standard Operations on $\\mathbb{R}$",
    statement: "Let $V$ be the set of all real numbers with the standard operations of addition and multiplication. Is $V$ a vector space?",
    isVectorSpace: true,
    failedAxiom: null,
    explanation: "The set $\\mathbb{R}$ with standard operations satisfies all 10 vector space axioms. It is the most fundamental example of a vector space.",
    hint: "Check if standard addition and scalar multiplication for real numbers satisfy closure and the distributive laws.",
  },
  {
    title: "Pairs of Form $(x, 0)$ in $\\mathbb{R}^2$",
    statement: "Let $V$ be the set of all pairs of the form $(x, 0)$ with the standard operations on $\\mathbb{R}^2$. Is $V$ a vector space?",
    isVectorSpace: true,
    failedAxiom: null,
    explanation: "Closed under addition: $(x_1, 0) + (x_2, 0) = (x_1+x_2, 0) \\in V$. Closed under scalar multiplication: $k(x, 0) = (kx, 0) \\in V$. The zero vector $(0,0)$ is in $V$. All other axioms are inherited from $\\mathbb{R}^2$.",
    hint: "Check closure: is the sum of two elements still in the set? Is a scalar multiple still in the set?",
  },
  {
    title: "Pairs with $x \\ge 0$ in $\\mathbb{R}^2$",
    statement: "Let $V$ be the set of all $(x, y)$ where $x \\ge 0$, with the standard operations on $\\mathbb{R}^2$. Is $V$ a vector space?",
    isVectorSpace: false,
    failedAxiom: "Closure under Scalar Multiplication",
    explanation: "Take $\\mathbf{v} = (1, 0) \\in V$. Multiply by $k = -1$: $k\\mathbf{v} = (-1, 0)$. Since $-1 < 0$, the result is not in $V$. Closure under scalar multiplication fails.",
    hint: "Try multiplying a vector where $x > 0$ by a negative scalar.",
  },
  {
    title: "Non-standard Scalar Multiplication on $\\mathbb{R}^3$",
    statement: "Let $V = \\mathbb{R}^3$ with standard addition, but scalar multiplication defined by $k(x, y, z) = (k^2x, k^2y, k^2z)$. Is $V$ a vector space?",
    isVectorSpace: false,
    failedAxiom: "Distributive Law $(k+m)\\mathbf{v} = k\\mathbf{v} + m\\mathbf{v}$",
    explanation: "Let $k=1, m=1, \\mathbf{v}=(1,1,1)$. Then $(1+1)\\mathbf{v} = 2\\mathbf{v} = (4,4,4)$. But $1\\mathbf{v} + 1\\mathbf{v} = (1,1,1)+(1,1,1) = (2,2,2)$. Since $(4,4,4) \\neq (2,2,2)$, the axiom fails.",
    hint: "Test the axiom $(k+m)\\mathbf{v} = k\\mathbf{v} + m\\mathbf{v}$ with $k=1, m=1$.",
  },
  {
    title: "Invertible $2 \\times 2$ Matrices",
    statement: "Let $V$ be the set of all invertible $2 \\times 2$ matrices with standard matrix addition and scalar multiplication. Is $V$ a vector space?",
    isVectorSpace: false,
    failedAxiom: "Closure under Addition",
    explanation: "Let $A = I$ and $B = -I$. Both are invertible. However, $A + B = \\mathbf{0}$, which has determinant $0$ and is NOT invertible. Therefore $V$ is not closed under addition.",
    hint: "Find two invertible matrices whose sum is the zero matrix (which is not invertible).",
  },
  {
    title: "Polynomials of Degree $\\le 2$",
    statement: "Let $V = P_2$ be the set of all polynomials of degree at most 2 with standard addition and scalar multiplication. Is $V$ a vector space?",
    isVectorSpace: true,
    failedAxiom: null,
    explanation: "The sum of two degree-$\\le 2$ polynomials has degree $\\le 2$. A scalar multiple of a degree-$\\le 2$ polynomial has degree $\\le 2$. The zero polynomial is in $V$. All 10 axioms are satisfied.",
    hint: "Check whether adding or scaling a polynomial of degree $\\le 2$ can produce a polynomial of degree greater than 2.",
  },
  {
    title: "Functions Satisfying $f(0) = 0$",
    statement: "Let $V$ be the set of all real-valued functions $f$ on $\\mathbb{R}$ with $f(0) = 0$, under standard function addition and scalar multiplication. Is $V$ a vector space?",
    isVectorSpace: true,
    failedAxiom: null,
    explanation: "If $f(0) = 0$ and $g(0) = 0$, then $(f+g)(0) = 0$ and $(kf)(0) = k\\cdot 0 = 0$. The zero function satisfies $0(0) = 0$. All 10 axioms hold.",
    hint: "Show that the sum and scalar multiple of functions in the set still satisfy $f(0) = 0$.",
  },
  {
    title: "$n \\times n$ Matrices with $\\det(A) = 1$",
    statement: "Let $V$ be the set of all $n \\times n$ matrices with $\\det(A) = 1$, under standard matrix addition and scalar multiplication. Is $V$ a vector space?",
    isVectorSpace: false,
    failedAxiom: "Closure under Addition",
    explanation: "Take $n=2$, $A = I$ (det $= 1$) and $B = I$ (det $= 1$). Then $A + B = 2I$, and $\\det(2I) = 4 \\neq 1$. Also, $\\det(\\mathbf{0}) = 0 \\neq 1$, so the zero matrix is not in $V$.",
    hint: "Check whether the zero matrix is in the set. Alternatively, add two matrices with det $= 1$ and check the result.",
  },
  {
    title: "All $2 \\times 2$ Matrices",
    statement: "Let $V = M_{2 \\times 2}$ be the set of all $2 \\times 2$ real matrices with standard matrix addition and scalar multiplication. Is $V$ a vector space?",
    isVectorSpace: true,
    failedAxiom: null,
    explanation: "Matrix addition is entrywise, so it is commutative and associative, the zero matrix is the additive identity, and $-A$ is the additive inverse of $A$. Scalar multiplication distributes entrywise. All 10 axioms hold — $M_{2 \\times 2}$ is essentially $\\mathbb{R}^4$ written in a square array.",
    hint: "Every operation is performed entry by entry. Which familiar vector space has the same four coordinates?",
  },
  {
    title: "Symmetric $2 \\times 2$ Matrices",
    statement: "Let $V$ be the set of all symmetric $2 \\times 2$ matrices ($A^T = A$) with standard matrix addition and scalar multiplication. Is $V$ a vector space?",
    isVectorSpace: true,
    failedAxiom: null,
    explanation: "If $A^T = A$ and $B^T = B$, then $(A+B)^T = A^T + B^T = A + B$ and $(kA)^T = kA^T = kA$, so $V$ is closed under both operations. The zero matrix is symmetric, and the remaining axioms are inherited from $M_{2 \\times 2}$.",
    hint: "Use the transpose rules $(A+B)^T = A^T + B^T$ and $(kA)^T = kA^T$ to test closure.",
  },
  {
    title: "Upper-Triangular $2 \\times 2$ Matrices",
    statement: "Let $V$ be the set of all upper-triangular $2 \\times 2$ matrices (entry $a_{21} = 0$) with standard operations. Is $V$ a vector space?",
    isVectorSpace: true,
    failedAxiom: null,
    explanation: "Adding two matrices whose $(2,1)$ entry is $0$ gives a matrix whose $(2,1)$ entry is $0$, and scaling preserves that zero. The zero matrix is upper-triangular, so $V$ is a subspace of $M_{2 \\times 2}$.",
    hint: "The defining condition is a single linear equation on one entry: $a_{21} = 0$. Is that preserved by addition and scaling?",
  },
  {
    title: "Polynomials of Degree Exactly 2",
    statement: "Let $V$ be the set of all polynomials of degree **exactly** 2 with standard addition and scalar multiplication. Is $V$ a vector space?",
    isVectorSpace: false,
    failedAxiom: "Closure under Addition",
    explanation: "Take $p(x) = x^2 + x$ and $q(x) = -x^2 + 1$, both of degree exactly 2. Their sum is $p + q = x + 1$, which has degree 1 and is therefore not in $V$. (The zero polynomial is not in $V$ either, so the zero-vector axiom fails as well.)",
    hint: "Try adding two degree-2 polynomials whose leading terms cancel.",
  },
  {
    title: "Polynomials in $P_2$ with $p(0) = 0$",
    statement: "Let $V$ be the set of all polynomials $p \\in P_2$ satisfying $p(0) = 0$, with standard operations. Is $V$ a vector space?",
    isVectorSpace: true,
    failedAxiom: null,
    explanation: "If $p(0) = 0$ and $q(0) = 0$ then $(p+q)(0) = 0 + 0 = 0$ and $(kp)(0) = k \\cdot 0 = 0$, so $V$ is closed. The zero polynomial satisfies the condition, and the other axioms are inherited from $P_2$.",
    hint: "Evaluate the sum and the scalar multiple at $x = 0$ and check whether the defining condition survives.",
  },
  {
    title: "Polynomials in $P_2$ with $p(0) = 1$",
    statement: "Let $V$ be the set of all polynomials $p \\in P_2$ satisfying $p(0) = 1$, with standard operations. Is $V$ a vector space?",
    isVectorSpace: false,
    failedAxiom: "Zero Vector",
    explanation: "The zero polynomial has $p(0) = 0 \\ne 1$, so $\\mathbf{0} \\notin V$. Closure fails too: if $p(0) = q(0) = 1$ then $(p+q)(0) = 2 \\ne 1$.",
    hint: "A defining condition of the form \"equals a non-zero constant\" should make you check the zero vector first.",
  },
  {
    title: "Pairs with $x + y = 0$",
    statement: "Let $V$ be the set of all $(x, y) \\in \\mathbb{R}^2$ with $x + y = 0$, under the standard operations. Is $V$ a vector space?",
    isVectorSpace: true,
    failedAxiom: null,
    explanation: "If $x_1 + y_1 = 0$ and $x_2 + y_2 = 0$ then $(x_1+x_2) + (y_1+y_2) = 0$, and $kx + ky = k(x+y) = 0$. The zero vector satisfies the equation. $V$ is the line $y = -x$ through the origin — a subspace of $\\mathbb{R}^2$.",
    hint: "The condition is a homogeneous linear equation. Add two solutions and scale one, then re-check the equation.",
  },
  {
    title: "Pairs with $x + y = 1$",
    statement: "Let $V$ be the set of all $(x, y) \\in \\mathbb{R}^2$ with $x + y = 1$, under the standard operations. Is $V$ a vector space?",
    isVectorSpace: false,
    failedAxiom: "Zero Vector",
    explanation: "$(0,0)$ gives $0 + 0 = 0 \\ne 1$, so the zero vector is not in $V$. Closure fails as well: $(1,0)$ and $(0,1)$ are both in $V$, but their sum $(1,1)$ satisfies $x + y = 2$.",
    hint: "This line does not pass through the origin. Which axiom does that break immediately?",
  },
  {
    title: "Points on the Parabola $y = x^2$",
    statement: "Let $V$ be the set of all $(x, y) \\in \\mathbb{R}^2$ with $y = x^2$, under the standard operations. Is $V$ a vector space?",
    isVectorSpace: false,
    failedAxiom: "Closure under Addition",
    explanation: "Take $(1, 1)$ and $(2, 4)$, both in $V$. Their sum is $(3, 5)$, but $3^2 = 9 \\ne 5$, so the sum is not in $V$. (Scalar multiplication fails too: $2(1,1) = (2,2)$ and $2^2 = 4 \\ne 2$.)",
    hint: "The condition is not linear. Add two points of the parabola and test whether the result is still on it.",
  },
  {
    title: "Solutions of a Homogeneous System",
    statement: "Let $A$ be a fixed $3 \\times 3$ matrix and let $V = \\{\\mathbf{x} \\in \\mathbb{R}^3 : A\\mathbf{x} = \\mathbf{0}\\}$, with the standard operations. Is $V$ a vector space?",
    isVectorSpace: true,
    failedAxiom: null,
    explanation: "If $A\\mathbf{u} = \\mathbf{0}$ and $A\\mathbf{v} = \\mathbf{0}$ then $A(\\mathbf{u}+\\mathbf{v}) = A\\mathbf{u} + A\\mathbf{v} = \\mathbf{0}$ and $A(k\\mathbf{u}) = kA\\mathbf{u} = \\mathbf{0}$. Also $A\\mathbf{0} = \\mathbf{0}$. This set is the null space of $A$, always a subspace of $\\mathbb{R}^3$.",
    hint: "Use the linearity of the matrix product: what is $A(\\mathbf{u} + \\mathbf{v})$?",
  },
  {
    title: "Solutions of a Non-Homogeneous System",
    statement: "Let $A$ be a fixed $3 \\times 3$ matrix, $\\mathbf{b} \\ne \\mathbf{0}$, and let $V = \\{\\mathbf{x} \\in \\mathbb{R}^3 : A\\mathbf{x} = \\mathbf{b}\\}$, with the standard operations. Is $V$ a vector space?",
    isVectorSpace: false,
    failedAxiom: "Zero Vector",
    explanation: "$A\\mathbf{0} = \\mathbf{0} \\ne \\mathbf{b}$, so $\\mathbf{0} \\notin V$. Closure fails too: if $A\\mathbf{u} = A\\mathbf{v} = \\mathbf{b}$ then $A(\\mathbf{u}+\\mathbf{v}) = 2\\mathbf{b} \\ne \\mathbf{b}$.",
    hint: "Test the zero vector first: does it solve $A\\mathbf{x} = \\mathbf{b}$ when $\\mathbf{b} \\ne \\mathbf{0}$?",
  },
  {
    title: "Continuous Functions on $[0, 1]$",
    statement: "Let $V = C[0, 1]$ be the set of all continuous real-valued functions on $[0, 1]$, with pointwise addition and scalar multiplication. Is $V$ a vector space?",
    isVectorSpace: true,
    failedAxiom: null,
    explanation: "The sum of two continuous functions is continuous and a scalar multiple of a continuous function is continuous, so $V$ is closed. The zero function is continuous and acts as the additive identity, and $-f$ is the additive inverse of $f$. All 10 axioms hold.",
    hint: "Recall the algebra of continuous functions: what can you say about $f + g$ and $kf$ when $f$ and $g$ are continuous?",
  },
  {
    title: "Functions with $f(1) = 2$",
    statement: "Let $V$ be the set of all real-valued functions on $\\mathbb{R}$ with $f(1) = 2$, under pointwise operations. Is $V$ a vector space?",
    isVectorSpace: false,
    failedAxiom: "Zero Vector",
    explanation: "The zero function has $f(1) = 0 \\ne 2$, so it is not in $V$. Closure also fails: if $f(1) = g(1) = 2$ then $(f+g)(1) = 4 \\ne 2$.",
    hint: "Evaluate the zero function at $x = 1$ and compare with the defining condition.",
  },
  {
    title: "Integer Vectors in $\\mathbb{R}^2$",
    statement: "Let $V = \\mathbb{Z}^2$ be the set of all pairs of integers, with standard addition and multiplication by **real** scalars. Is $V$ a vector space over $\\mathbb{R}$?",
    isVectorSpace: false,
    failedAxiom: "Closure under Scalar Multiplication",
    explanation: "Take $\\mathbf{v} = (1, 1) \\in V$ and the real scalar $k = \\tfrac{1}{2}$. Then $k\\mathbf{v} = (\\tfrac{1}{2}, \\tfrac{1}{2})$, which is not a pair of integers. Closure under scalar multiplication fails.",
    hint: "The scalars are all real numbers, not just integers. Try a fractional scalar.",
  },
  {
    title: "Non-standard Addition on $\\mathbb{R}^2$",
    statement: "Let $V = \\mathbb{R}^2$ with standard scalar multiplication but addition defined by $(x_1, y_1) \\oplus (x_2, y_2) = (x_1 + x_2, 0)$. Is $V$ a vector space?",
    isVectorSpace: false,
    failedAxiom: "Existence of a Zero Vector ($\\mathbf{u} + \\mathbf{0} = \\mathbf{u}$)",
    explanation: "For any candidate zero $(z_1, z_2)$ we get $(x, y) \\oplus (z_1, z_2) = (x + z_1, 0)$, whose second coordinate is always $0$. So no element can satisfy $\\mathbf{u} \\oplus \\mathbf{0} = \\mathbf{u}$ when $y \\ne 0$, and the zero-vector axiom fails.",
    hint: "Try to find a vector $\\mathbf{0}$ with $\\mathbf{u} \\oplus \\mathbf{0} = \\mathbf{u}$ for every $\\mathbf{u}$. What happens to the second coordinate?",
  },
  {
    title: "Non-standard Scalar Multiplication $k(x, y) = (kx, 0)$",
    statement: "Let $V = \\mathbb{R}^2$ with standard addition but scalar multiplication defined by $k(x, y) = (kx, 0)$. Is $V$ a vector space?",
    isVectorSpace: false,
    failedAxiom: "Unit Scalar Law $1\\mathbf{v} = \\mathbf{v}$",
    explanation: "Take $\\mathbf{v} = (1, 5)$. Then $1\\mathbf{v} = (1, 0) \\ne (1, 5) = \\mathbf{v}$, so the axiom $1\\mathbf{v} = \\mathbf{v}$ fails.",
    hint: "Test the easiest axiom for a redefined scalar multiplication: multiply a vector by the scalar $1$.",
  },
];

export const vectorSpaceAxiomsLogic = {
  generate: () => {
    const selected = scenarios[Math.floor(Math.random() * scenarios.length)];
    return {
      title: "Vector Space Axioms",
      statement: `**Scenario:** ${selected.title}\n\n${selected.statement}`,
      prompt: "Determine if it is a vector space. If not, briefly explain which axiom fails.",
      solution: selected.isVectorSpace
        ? "Yes, it is a vector space."
        : `No, it is not a vector space. Failed axiom: ${selected.failedAxiom}`,
      explanation: selected.explanation,
      hint: selected.hint,
      guide: vectorSpaceGuide,
      reasoningSteps: selected.isVectorSpace
        ? `Step 1 — Identify the set and its operations: state what V is and what addition and scalar multiplication mean.
Step 2 — Check closure under addition: take two arbitrary elements of V, add them, and verify the result is still in V.
Step 3 — Check closure under scalar multiplication: multiply an arbitrary element by an arbitrary scalar and verify the result is still in V.
Step 4 — Verify the zero vector exists in V.
Step 5 — Conclude: all 10 axioms are satisfied (inherited from the ambient space or verified directly), so V is a vector space.`
        : `Step 1 — Identify the set and its operations: state what V is and what addition and scalar multiplication mean.
Step 2 — Identify the axiom to test: target the axiom named in the problem (closure under addition, closure under scalar multiplication, zero vector, or a distributive law).
Step 3 — Construct a specific counterexample: choose concrete vectors or scalars that expose the failure.
Step 4 — Show the axiom fails: compute the result explicitly and show it lies outside V (or violates the axiom identity).
Step 5 — Conclude: V is NOT a vector space because [named axiom] fails at the counterexample.`,
    };
  },
  guide: {
    title: "Vector Space Axioms",
    content: `A set $V$ is a **vector space** if it satisfies the following 10 axioms:

1. **Closure under Addition**: $\\mathbf{u} + \\mathbf{v} \\in V$.
2. **Commutativity**: $\\mathbf{u} + \\mathbf{v} = \\mathbf{v} + \\mathbf{u}$.
3. **Associativity of Addition**: $(\\mathbf{u} + \\mathbf{v}) + \\mathbf{w} = \\mathbf{u} + (\\mathbf{v} + \\mathbf{w})$.
4. **Zero Vector**: $\\mathbf{0} \\in V$ with $\\mathbf{u} + \\mathbf{0} = \\mathbf{u}$.
5. **Additive Inverses**: $-\\mathbf{u} \\in V$ with $\\mathbf{u} + (-\\mathbf{u}) = \\mathbf{0}$.
6. **Closure under Scalar Multiplication**: $k\\mathbf{u} \\in V$.
7. **Distributive (scalar over vector sum)**: $k(\\mathbf{u} + \\mathbf{v}) = k\\mathbf{u} + k\\mathbf{v}$.
8. **Distributive (vector over scalar sum)**: $(k + m)\\mathbf{u} = k\\mathbf{u} + m\\mathbf{u}$.
9. **Associativity of Scalar Multiplication**: $k(m\\mathbf{u}) = (km)\\mathbf{u}$.
10. **Unitary Law**: $1\\mathbf{u} = \\mathbf{u}$.`,
  },
};
