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
