// Task bank for "prove the integral inner product satisfies the axioms".
//
// Every item is a proof, so the variety has to come from the statement rather
// than from random coefficients: six axiom tasks (each axiom, plus the two
// second-slot variants that need the symmetry axiom as an intermediate step)
// are combined with four intervals, giving 24 distinct exercises instead of the
// four the topic used to repeat.

type Interval = { lo: string; hi: string; label: string };

const INTERVALS: Interval[] = [
  { lo: "a", hi: "b", label: "C[a, b]" },
  { lo: "0", hi: "1", label: "C[0, 1]" },
  { lo: "-1", hi: "1", label: "C[-1, 1]" },
  { lo: "0", hi: "2", label: "C[0, 2]" },
];

type AxiomTask = {
  id: string;
  title: string;
  /** How the task is named inside the sentence "Show that ... holds". */
  phrase: string;
  claim: string;
  solution: string;
  explanation: (integral: (integrand: string) => string) => string;
  hint: string;
};

const TASKS: AxiomTask[] = [
  {
    id: "symmetry",
    title: "Symmetry Axiom",
    phrase: "the Symmetry Axiom",
    claim: "\\langle f, g \\rangle = \\langle g, f \\rangle",
    solution:
      "Reasoning: Use the commutativity of real number multiplication under the integral.",
    explanation: (int) => `1. Start with the definition of $\\langle f, g \\rangle$:
   $$ \\langle f, g \\rangle = ${int("f(x)g(x)")} $$
2. Since $f(x)$ and $g(x)$ are real numbers for each $x$, their product commutes:
   $$ f(x)g(x) = g(x)f(x) $$
3. Substitute this back into the integral:
   $$ ${int("f(x)g(x)")} = ${int("g(x)f(x)")} $$
4. Recognize the right side as the definition of $\\langle g, f \\rangle$.
Thus, $\\langle f, g \\rangle = \\langle g, f \\rangle$.`,
    hint: "Recall that multiplication of real functions is commutative, meaning $f(x)g(x) = g(x)f(x)$.",
  },
  {
    id: "additivity",
    title: "Additivity Axiom",
    phrase: "the Additivity Axiom",
    claim:
      "\\langle f + g, h \\rangle = \\langle f, h \\rangle + \\langle g, h \\rangle",
    solution:
      "Reasoning: Use the distributive property and the linearity of the definite integral.",
    explanation: (int) => `1. Start with the left side:
   $$ \\langle f + g, h \\rangle = ${int("(f(x) + g(x))h(x)")} $$
2. Use the distributive property of real numbers:
   $$ (f(x) + g(x))h(x) = f(x)h(x) + g(x)h(x) $$
3. Apply the linearity property of integrals (the integral of a sum is the sum of the integrals):
   $$ ${int("(f(x)h(x) + g(x)h(x))")} = ${int("f(x)h(x)")} + ${int("g(x)h(x)")} $$
4. Recognize the terms as $\\langle f, h \\rangle$ and $\\langle g, h \\rangle$.
Thus, $\\langle f + g, h \\rangle = \\langle f, h \\rangle + \\langle g, h \\rangle$.`,
    hint: "Distribute $h(x)$ over the sum $(f(x) + g(x))$ and then use the property that $\\int (u+v) = \\int u + \\int v$.",
  },
  {
    id: "homogeneity",
    title: "Homogeneity Axiom",
    phrase: "the Homogeneity Axiom",
    claim: "\\langle kf, g \\rangle = k\\langle f, g \\rangle",
    solution: "Reasoning: Use the constant multiple rule for integrals.",
    explanation: (int) => `1. Write out the definition for $\\langle kf, g \\rangle$:
   $$ \\langle kf, g \\rangle = ${int("(kf(x))g(x)")} $$
2. Use the associativity of multiplication:
   $$ (kf(x))g(x) = k(f(x)g(x)) $$
3. Pull the constant $k$ out of the integral (linearity of integration):
   $$ ${int("k(f(x)g(x))")} = k ${int("f(x)g(x)")} $$
4. The remaining integral is exactly $\\langle f, g \\rangle$.
Thus, $\\langle kf, g \\rangle = k\\langle f, g \\rangle$.`,
    hint: "Constants can be moved outside the integral sign in definite integration.",
  },
  {
    id: "positivity",
    title: "Positivity Axiom",
    phrase: "the Positivity Axiom",
    claim:
      "\\langle f, f \\rangle \\ge 0, \\text{ and } \\langle f, f \\rangle = 0 \\iff f = 0",
    solution:
      "Reasoning: The square of a real-valued function is non-negative, and a non-negative continuous function with zero integral is identically zero.",
    explanation: (int) => `1. Evaluate the inner product of $f$ with itself:
   $$ \\langle f, f \\rangle = ${int("f(x)f(x)")} = ${int("[f(x)]^2")} $$
2. Since $[f(x)]^2 \\ge 0$ for all $x$, the integral of a non-negative function is non-negative:
   $$ ${int("[f(x)]^2")} \\ge 0 $$
3. If $f$ is the zero function then the integrand is $0$, so the integral is $0$.
4. Conversely, suppose the integral is $0$. If $f(x_0) \\ne 0$ at some point, continuity gives an interval around $x_0$ on which $[f(x)]^2 > 0$, forcing the integral to be strictly positive — a contradiction. Hence $f = 0$ everywhere.
Thus, the Positivity Axiom holds.`,
    hint: "Remember that $[f(x)]^2$ is always non-negative. What can you say about a non-negative continuous function whose integral is zero?",
  },
  {
    id: "additivity-second-slot",
    title: "Additivity in the Second Slot",
    phrase: "additivity in the second slot",
    claim:
      "\\langle f, g + h \\rangle = \\langle f, g \\rangle + \\langle f, h \\rangle",
    solution:
      "Reasoning: Apply symmetry to move the sum into the first slot, use additivity there, then apply symmetry again.",
    explanation: (int) => `Additivity is stated for the *first* slot, so use the Symmetry Axiom to get there.

1. Apply symmetry:
   $$ \\langle f, g + h \\rangle = \\langle g + h, f \\rangle $$
2. Apply the Additivity Axiom in the first slot:
   $$ \\langle g + h, f \\rangle = \\langle g, f \\rangle + \\langle h, f \\rangle $$
3. Apply symmetry to each term:
   $$ \\langle g, f \\rangle + \\langle h, f \\rangle = \\langle f, g \\rangle + \\langle f, h \\rangle $$
Directly from the definition this is the same computation:
   $$ \\langle f, g+h \\rangle = ${int("f(x)(g(x) + h(x))")} = ${int("f(x)g(x)")} + ${int("f(x)h(x)")} $$
Thus, $\\langle f, g + h \\rangle = \\langle f, g \\rangle + \\langle f, h \\rangle$.`,
    hint: "The additivity axiom is stated for the first slot. Use symmetry to swap the slots, apply additivity, then swap back.",
  },
  {
    id: "homogeneity-second-slot",
    title: "Homogeneity in the Second Slot",
    phrase: "homogeneity in the second slot",
    claim: "\\langle f, kg \\rangle = k\\langle f, g \\rangle",
    solution:
      "Reasoning: Apply symmetry to move the scalar into the first slot, use homogeneity there, then apply symmetry again.",
    explanation: (int) => `1. Apply the Symmetry Axiom:
   $$ \\langle f, kg \\rangle = \\langle kg, f \\rangle $$
2. Apply the Homogeneity Axiom in the first slot:
   $$ \\langle kg, f \\rangle = k\\langle g, f \\rangle $$
3. Apply symmetry once more:
   $$ k\\langle g, f \\rangle = k\\langle f, g \\rangle $$
Equivalently, straight from the definition:
   $$ \\langle f, kg \\rangle = ${int("f(x)(kg(x))")} = k ${int("f(x)g(x)")} $$
Thus, $\\langle f, kg \\rangle = k\\langle f, g \\rangle$.`,
    hint: "Homogeneity is stated for the first slot; symmetry lets you move the scalar there and back.",
  },
];

export const integralAxiomsLogic = {
  generate: () => {
    const interval = INTERVALS[Math.floor(Math.random() * INTERVALS.length)];
    const task = TASKS[Math.floor(Math.random() * TASKS.length)];

    const integral = (integrand: string) =>
      `\\int_{${interval.lo}}^{${interval.hi}} ${integrand} \\, dx`;
    const integralDef = `$$\\langle f, g \\rangle = ${integral("f(x)g(x)")}$$`;

    return {
      title: task.title,
      statement: `Let $V = ${interval.label}$ with the inner product defined by:
${integralDef}
Show that ${task.phrase} holds: $${task.claim}$.`,
      prompt: "Reasoning: Provide a brief logical explanation of the proof.",
      solution: task.solution,
      explanation: task.explanation(integral),
      hint: task.hint,
      reasoningSteps: `Step 1 — State the axiom to be proved: write the axiom identity in terms of the integral definition on $${interval.label}$.
Step 2 — Start from the left-hand side of the identity: substitute the definition of the inner product for the expression on the left.
Step 3 — Apply the relevant algebraic or integration property: commutativity of multiplication (Symmetry), distributivity plus linearity of the integral (Additivity), the constant multiple rule (Homogeneity), non-negativity of squares (Positivity), or the Symmetry Axiom first when the property is asked in the second slot.
Step 4 — Show that the result equals the right-hand side of the axiom identity.
Step 5 — Conclude: state which axiom was verified and why the argument is valid.`,
      guide: integralAxiomsGuide,
    };
  },
};

const integralAxiomsGuide = {
  title: "Inner Product Axioms (Integral)",
  content: `
To prove that a function is an inner product, you must verify it satisfies these 4 axioms for all vectors $u, v, w$ and scalar $k$:

1. Symmetry: $\\langle u, v \\rangle = \\langle v, u \\rangle$
2. Additivity: $\\langle u + v, w \\rangle = \\langle u, w \\rangle + \\langle v, w \\rangle$
3. Homogeneity: $\\langle ku, v \\rangle = k\\langle u, v \\rangle$
4. Positivity: $\\langle v, v \\rangle \\ge 0$ and $\\langle v, v \\rangle = 0 \\iff v = 0$

Additivity and homogeneity are stated for the **first** slot. The corresponding
properties in the second slot follow by applying the Symmetry Axiom first.

For the Integral Inner Product, these coincide with fundamental properties of integration (commutativity, linearity, and non-negativity of squared integrals).
`,
};
