import { describe, expect, test } from "bun:test";
import {
  parseLinearEquationGroundTruth,
  parseLinearSystemGroundTruth,
} from "./linearAlgebraCasUtils";
import { checkEquivalenceDirect, computeDirectGroundTruth } from "./cas";
import { topicRegistry } from "../src/data/topics";

const system = (rows: string) => `Find the value of $k$ such that the following system has no solution:
$$
\\begin{cases}
${rows}
\\end{cases}
$$`;

describe("parseLinearEquationGroundTruth", () => {
  test("solves ax + b = c", () => {
    expect(
      parseLinearEquationGroundTruth("Solve for $x$: $$ 5x + 3 = 43 $$")?.groundTruth,
    ).toBe("8");
    expect(
      parseLinearEquationGroundTruth("Solve for $x$: $$ 2x + 9 = 11 $$")?.groundTruth,
    ).toBe("1");
  });

  test("handles a negative constant and a missing constant", () => {
    expect(
      parseLinearEquationGroundTruth("Solve for $x$: $$ 4x - 6 = 10 $$")?.groundTruth,
    ).toBe("4");
    expect(
      parseLinearEquationGroundTruth("Solve for $x$: $$ 3x = 12 $$")?.groundTruth,
    ).toBe("4");
  });

  test("returns a reduced fraction when the division is not exact", () => {
    expect(
      parseLinearEquationGroundTruth("Solve for $x$: $$ 4x + 1 = 8 $$")?.groundTruth,
    ).toBe("7/4");
  });

  test("refuses quadratics and unparseable statements", () => {
    expect(parseLinearEquationGroundTruth("Solve for $x$: $$x^2 + 3x = 0$$")).toBeNull();
    expect(parseLinearEquationGroundTruth("Find the derivative of $f$.")).toBeNull();
  });
});

describe("parseLinearSystemGroundTruth", () => {
  test("computes k from the parallel-line condition", () => {
    // a1/a2 = b1/k → k = b1·a2/a1 = 3·6/2 = 9
    expect(
      parseLinearSystemGroundTruth(system("2x + 3y = 4 \\\\\n6x + ky = 18"))?.groundTruth,
    ).toBe("9");
  });

  test("reads an implicit coefficient of 1", () => {
    // k = 1·3/1 = 3
    expect(
      parseLinearSystemGroundTruth(system("x + y = 1 \\\\\n3x + ky = 6"))?.groundTruth,
    ).toBe("3");
  });

  test("returns a fraction when k is not an integer", () => {
    // k = 3·3/2 = 9/2
    expect(
      parseLinearSystemGroundTruth(system("2x + 3y = 4 \\\\\n3x + ky = 11"))?.groundTruth,
    ).toBe("9/2");
  });

  test("refuses systems whose constants are also proportional", () => {
    // 2x+3y=4 and 6x+ky=12: the constants share the ratio, so the lines would
    // coincide (infinitely many solutions) rather than be inconsistent.
    expect(parseLinearSystemGroundTruth(system("2x + 3y = 4 \\\\\n6x + ky = 12"))).toBeNull();
  });

  test("refuses statements that are not asking for the no-solution parameter", () => {
    const solveIt = `Solve the system:
$$
\\begin{cases}
2x + 3y = 4 \\\\
6x + ky = 18
\\end{cases}
$$`;
    expect(parseLinearSystemGroundTruth(solveIt)).toBeNull();
    expect(parseLinearSystemGroundTruth("Find the determinant.")).toBeNull();
  });
});

describe("linear topics end to end", () => {
  for (const topicId of ["linear_equations", "linear_systems", "equations", "systems"]) {
    test(`"${topicId}" is graded deterministically and accepts its own solution`, () => {
      for (let i = 0; i < 120; i++) {
        const problem = topicRegistry[topicId].generate();
        const direct = computeDirectGroundTruth(problem.statement, topicId);
        expect(
          direct?.groundTruth
            ? "gradable"
            : `NOT gradable: ${problem.statement.replace(/\s+/g, " ")}`,
        ).toBe("gradable");
        const verdict = checkEquivalenceDirect(problem.solution, direct!.groundTruth);
        expect(
          verdict.isEquivalent === true
            ? "accepted"
            : `solution "${problem.solution}" not accepted against "${direct!.groundTruth}"`,
        ).toBe("accepted");
      }
    });
  }

  test("a wrong parameter value is rejected without the AI", () => {
    for (let i = 0; i < 40; i++) {
      const problem = topicRegistry.linear_systems.generate();
      const direct = computeDirectGroundTruth(problem.statement, "linear_systems")!;
      const wrong = String(Number(direct.groundTruth) + 1);
      expect(checkEquivalenceDirect(wrong, direct.groundTruth).isEquivalent).toBe(false);
    }
  });

  test("a wrong root is rejected without the AI", () => {
    for (let i = 0; i < 40; i++) {
      const problem = topicRegistry.linear_equations.generate();
      const direct = computeDirectGroundTruth(problem.statement, "linear_equations")!;
      const wrong = `x = ${Number(direct.groundTruth) + 2}`;
      expect(checkEquivalenceDirect(wrong, direct.groundTruth).isEquivalent).toBe(false);
    }
  });
});
