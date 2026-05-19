export const quadraticLogic = {
  generate: () => {
    // Generate two integer roots to ensure a solvable, "clean" quadratic
    const r1 = Math.floor(Math.random() * 10) - 5;
    const r2 = Math.floor(Math.random() * 10) - 5;

    // (x - r1)(x - r2) = x^2 - (r1+r2)x + (r1*r2)
    const b = -(r1 + r2);
    const c = r1 * r2;

    const bAbs = Math.abs(b);
    const cAbs = Math.abs(c);

    const bSign = b >= 0 ? "+" : "-";
    const cSign = c >= 0 ? "+" : "-";

    // Format b term: handle 1x or 0x case if needed
    let bTerm = "";
    if (bAbs === 0)
      bTerm = ""; // No x term
    else if (bAbs === 1) bTerm = `${bSign} x`;
    else bTerm = `${bSign} ${bAbs}x`;

    const cTerm = `${cSign} ${cAbs}`;

    return {
      title: "Quadratic Equations",
      statement: `Solve for $x$: \n $$x^2 ${bTerm} ${cTerm} = 0$$`,
      prompt: "Find the values of x:",
      solution: `$x_1 = ${r1}, x_2 = ${r2}$`,
      answerFormat: {
        placeholder: "$x \\in \\{-2, 3\\}$",
        instruction:
          "Give both roots as a set using LaTeX notation. Order does not matter.",
        alternatives: [
          "$x \in {-2, 3}$",
          "x in {-2, 3}",
          "{-2, 3}",
          "x = -2, 3",
          "x = -2 and x = 3",
        ],
        fields: [
          { key: "x1", label: "x_1", placeholder: "-2" },
          { key: "x2", label: "x_2", placeholder: "3" },
        ],
      },
      explanation: `We are given:
$$ x^2 ${bTerm} ${cTerm} = 0 $$
We look for two numbers that multiply to $c = ${c}$ and add up to $b = ${b}$.
The numbers are $${-r1}$ and $${-r2}$.
$$ (x - (${r1}))(x - (${r2})) = 0 $$
So the solutions are:
$$ x = ${r1} \\text{ or } x = ${r2} $$`,
      hint: "Try factoring into $(x - r_1)(x - r_2) = 0$ or use the quadratic formula: $x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$.",
      guide: {
        title: "Quadratic Guide",
        content: `
- Factoring: Find two numbers that multiply to $c$ and add up to $b$.
- Quadratic Formula: $x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$
        `,
      },
    };
  },
};
