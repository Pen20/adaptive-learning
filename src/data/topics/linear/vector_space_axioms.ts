export const vectorSpaceAxiomsLogic = {
    generate: () => {
        const scenarios = [
            {
                id: 3,
                title: "Standard Operations on $\\mathbb{R}$",
                statement: "Let $V$ be the set of all real numbers with the standard operations of addition and multiplication. Is $V$ a vector space?",
                isVectorSpace: true,
                failedAxiom: null,
                explanation: "The set of real numbers $\\mathbb{R}$ with standard operations satisfies all 10 vector space axioms. It is the most fundamental example of a vector space.",
                hint: "Check if standard addition and scalar multiplication for real numbers follow the closure and distributive laws."
            },
            {
                id: 4,
                title: "Pairs in $\\mathbb{R}^2$ of form $(x, 0)$",
                statement: "Let $V$ be the set of all pairs of real numbers of the form $(x, 0)$ with the standard operations on $\\mathbb{R}^2$. Is $V$ a vector space?",
                isVectorSpace: true,
                failedAxiom: null,
                explanation: "This set is closed under addition: $(x_1, 0) + (x_2, 0) = (x_1+x_2, 0)$, and scalar multiplication: $k(x, 0) = (kx, 0)$. It contains the zero vector $(0, 0)$ and satisfies all other axioms inherited from $\\mathbb{R}^2$.",
                hint: "Determine if adding two vectors of this form or multiplying by a scalar results in another vector of the form $(x, 0)$."
            },
            {
                id: 5,
                title: "Pairs in $\\mathbb{R}^2$ with $x \\ge 0$",
                statement: "Let $V$ be the set of all pairs of real numbers of the form $(x, y)$, where $x \\ge 0$, with the standard operations on $\\mathbb{R}^2$. Is $V$ a vector space?",
                isVectorSpace: false,
                failedAxiom: "Scalar Multiplication Closure / Existence of Additive Inverses",
                explanation: "If you take a vector like $\\mathbf{v} = (1, 0)$ where $1 \\ge 0$, and multiply it by the scalar $k = -1$, you get $k\\mathbf{v} = (-1, 0)$. Since $-1 < 0$, the result is not in $V$. Thus, closure under scalar multiplication fails. Alternatively, the additive inverse $-\\mathbf{v} = (-1, 0)$ is not in $V$.",
                hint: "Try multiplying a vector where $x > 0$ by a negative scalar. Does the result remain in the set?"
            },
            {
                id: 7,
                title: "Non-standard Scalar Multiplication on $\\mathbb{R}^3$",
                statement: "Let $V$ be the set of all triples of real numbers with standard vector addition, but with scalar multiplication defined by: $k(x, y, z) = (k^2x, k^2y, k^2z)$. Is $V$ a vector space?",
                isVectorSpace: false,
                failedAxiom: "Scalar Distributive Axiom",
                explanation: "The axiom $(k+m)\\mathbf{v} = k\\mathbf{v} + m\\mathbf{v}$ fails. For example, let $k=1, m=1$ and $\\mathbf{v}=(1, 1, 1)$. Then $(1+1)\\mathbf{v} = 2\\mathbf{v} = (2^2, 2^2, 2^2) = (4, 4, 4)$. However, $k\\mathbf{v} + m\\mathbf{v} = (1^2, 1^2, 1^2) + (1^2, 1^2, 1^2) = (1, 1, 1) + (1, 1, 1) = (2, 2, 2)$. Since $(4, 4, 4) \\ne (2, 2, 2)$, the axiom is not satisfied.",
                hint: "Test the axiom $(k+m)\\mathbf{v} = k\\mathbf{v} + m\\mathbf{v}$ using specific numbers like $k=1, m=1$."
            },
            {
                id: 8,
                title: "Invertible $2 \\times 2$ Matrices",
                statement: "Let $V$ be the set of all $2 \\times 2$ invertible matrices with standard matrix addition and scalar multiplication. Is $V$ a vector space?",
                isVectorSpace: false,
                failedAxiom: "Closure under Addition",
                explanation: "The set is not closed under addition. For example, let $A = I = \\begin{bmatrix} 1 & 0 \\\\ 0 & 1 \\end{bmatrix}$ and $B = -I = \\begin{bmatrix} -1 & 0 \\\\ 0 & -1 \\end{bmatrix}$. Both are invertible ($\\det(A)=1 \\ne 0, \\det(B)=1 \\ne 0$). However, $A+B = \\mathbf{0}$ (the zero matrix), which is NOT invertible ($\\det(\\mathbf{0}) = 0$). Thus, the set is not closed under addition.",
                hint: "Find two invertible matrices whose sum results in a non-invertible matrix, like the zero matrix."
            }
        ];

        const selected = scenarios[Math.floor(Math.random() * scenarios.length)];

        return {
            title: "Vector Space Axioms",
            statement: `**Scenario:** ${selected.title}\n\n${selected.statement}`,
            prompt: "Determine if it is a vector space. If not, briefly explain which axiom fails.",
            solution: selected.isVectorSpace ? "Yes, it is a vector space." : `No, it is not a vector space. ${selected.failedAxiom}`,
            explanation: selected.explanation,
            hint: selected.hint,
            guide: vectorSpaceGuide
        };
    },
    guide: {
        title: "Vector Space Axioms",
        content: `A set $V$ together with addition and scalar multiplication is a **vector space** if it satisfies the following 10 axioms for all $\\mathbf{u}, \\mathbf{v}, \\mathbf{w} \\in V$ and scalars $k, m$:

1. **Closure under Addition**: $\\mathbf{u} + \\mathbf{v} \\in V$.
2. **Commutativity of Addition**: $\\mathbf{u} + \\mathbf{v} = \\mathbf{v} + \\mathbf{u}$.
3. **Associativity of Addition**: $(\\mathbf{u} + \\mathbf{v}) + \\mathbf{w} = \\mathbf{u} + (\\mathbf{v} + \\mathbf{w})$.
4. **Existence of Zero Vector**: $\\mathbf{0} \\in V$ such that $\\mathbf{u} + \\mathbf{0} = \\mathbf{u}$.
5. **Existence of Additive Inverses**: For each $\\mathbf{u} \\in V$, there exists $-\\mathbf{u} \\in V$ such that $\\mathbf{u} + (-\\mathbf{u}) = \\mathbf{0}$.
6. **Closure under Scalar Multiplication**: $k\\mathbf{u} \\in V$.
7. **Distributive Law (Scalar over Vector Sum)**: $k(\\mathbf{u} + \\mathbf{v}) = k\\mathbf{u} + k\\mathbf{v}$.
8. **Distributive Law (Vector over Scalar Sum)**: $(k + m)\\mathbf{u} = k\\mathbf{u} + m\\mathbf{u}$.
9. **Associativity of Scalar Multiplication**: $k(m\\mathbf{u}) = (km)\\mathbf{u}$.
10. **Unitary Law**: $1\\mathbf{u} = \\mathbf{u}$.`
    }
};

const vectorSpaceGuide = {
    title: "Testing Vector Spaces",
    content: `To show a set is NOT a vector space, you only need to find **one** axiom that fails. 

Common failure points:
- **No Zero Vector**: If $\\mathbf{0}$ is not in the set.
- **Not Closed**: If adding two elements or multiplying by a scalar takes you outside the set (e.g., $x \\ge 0$ becoming negative).
- **Redefined Operations**: If scalar multiplication or addition follows a "weird" rule that breaks linearity (like squaring the scalar).`
};
