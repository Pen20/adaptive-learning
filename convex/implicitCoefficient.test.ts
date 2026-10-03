import { describe, expect, test } from "bun:test";
import {
  coefficientValue,
  parseDomainRangeGroundTruth,
  parseLimitGroundTruth,
  parsePiecewiseGroundTruth,
} from "./calculusCasUtils";
import { parseLinearEquationGroundTruth } from "./linearAlgebraCasUtils";
import { computeDirectGroundTruth } from "./cas";
import { topicRegistry } from "../src/data/topics";

// REGRESSION — a leading coefficient of 1 is not printed.
//
// The generators used to interpolate raw coefficients, so students saw "1x + 7"
// and "1y". src/data/topics/format.ts now prints "x + 7", which silently broke
// every CAS parser that required a digit before the x: piecewise_continuity fell
// from full deterministic grading to 143/200, limits to 189/200 and domain_range
// to 179/200, with the remainder falling through to the AI grader unnoticed.
//
// These tests pin the *values* the parsers produce for implicit-coefficient
// statements, so neither half of that pair can regress on its own.

describe("coefficientValue", () => {
  test("reads an omitted coefficient as 1 and a bare minus as -1", () => {
    expect(coefficientValue("")).toBe(1);
    expect(coefficientValue("+")).toBe(1);
    expect(coefficientValue("-")).toBe(-1);
    expect(coefficientValue("4")).toBe(4);
    expect(coefficientValue("-4")).toBe(-4);
    expect(Number.isNaN(coefficientValue(undefined))).toBe(true);
  });
});

describe("limits at infinity with an implicit denominator coefficient", () => {
  test("computes the leading-coefficient ratio when the denominator reads 'x + 8'", () => {
    const result = parseLimitGroundTruth(
      "Compute the limit: $$ \\lim_{x \\to \\infty} \\frac{4x + 3}{x + 8} $$",
    );
    expect(result?.groundTruth).toBe("4");
  });

  test("still reduces an explicit ratio", () => {
    const result = parseLimitGroundTruth(
      "Compute the limit: $$ \\lim_{x \\to \\infty} \\frac{6x + 1}{4x + 8} $$",
    );
    expect(result?.groundTruth).toBe("3/2");
  });

  test("an implicit numerator coefficient is read as 1, not 0", () => {
    const result = parseLimitGroundTruth(
      "Compute the limit: $$ \\lim_{x \\to \\infty} \\frac{x + 3}{2x + 8} $$",
    );
    expect(result?.groundTruth).toBe("1/2");
  });
});

describe("piecewise continuity with an implicit slope", () => {
  const statement = (left: string, boundary: number, right: string) =>
    ` Determine if the function is continuous or discontinuous at $x = ${boundary}$
$$f(x) = \\begin{cases} ${left}, & x < ${boundary} \\\\ ${right}, & x \\ge ${boundary} \\end{cases} $$`;

  test("'x + 4' is read as slope 1, giving the continuous verdict", () => {
    const result = parsePiecewiseGroundTruth(statement("x + 4", 2, "x + 4"));
    expect(result?.groundTruth).toBe("continuous");
    expect(result?.expression).toBe("leftLimit=6, rightValue=6");
  });

  test("'x + 1' against 'x + 2' is discontinuous, not silently ungradable", () => {
    const result = parsePiecewiseGroundTruth(statement("x + 1", 3, "x + 2"));
    expect(result?.groundTruth).toBe("discontinuous");
    expect(result?.expression).toBe("leftLimit=4, rightValue=5");
  });

  test("an explicit slope still parses", () => {
    const result = parsePiecewiseGroundTruth(statement("3x + 1", 2, "x + 5"));
    expect(result?.groundTruth).toBe("continuous");
    expect(result?.expression).toBe("leftLimit=7, rightValue=7");
  });
});

describe("square-root domain with an implicit radicand coefficient", () => {
  test("'\\sqrt{x - 3}' gives the domain [3, inf)", () => {
    const result = parseDomainRangeGroundTruth(
      "Determine the domain and range of the function $$ f(x) = \\sqrt{x - 3} $$",
    );
    expect(result?.groundTruth).toBe("Domain: [3, inf), Range: [0, inf)");
  });

  test("an explicit coefficient still divides through", () => {
    const result = parseDomainRangeGroundTruth(
      "Determine the domain and range of the function $$ f(x) = \\sqrt{2x - 4} $$",
    );
    expect(result?.groundTruth).toBe("Domain: [2, inf), Range: [0, inf)");
  });
});

describe("linear equations with an implicit coefficient", () => {
  test("'x + 3 = 10' solves to 7", () => {
    expect(
      parseLinearEquationGroundTruth("Solve for $x$: $$ x + 3 = 10 $$")?.groundTruth,
    ).toBe("7");
  });

  test("an explicit coefficient still divides through", () => {
    expect(
      parseLinearEquationGroundTruth("Solve for $x$: $$ 5x + 3 = 43 $$")?.groundTruth,
    ).toBe("8");
  });
});

// The unit tests above pin the parsers. This one pins the pairing: whatever the
// generators print must remain parseable, which is the invariant that actually
// broke.
describe("generators and parsers stay in step", () => {
  const cases: [string, RegExp][] = [
    ["limits", /\\lim_\{x \\to \\infty\}/],
    ["piecewise_continuity", /\\begin\{cases\}/],
    ["domain_range", /\\sqrt/],
    ["linear_equations", /Solve for/],
    ["linear_systems", /\\begin\{cases\}/],
  ];

  for (const [topicId, shape] of cases) {
    test(`every "${topicId}" problem of the implicit-coefficient shape is still gradable`, () => {
      let matched = 0;
      for (let i = 0; i < 400; i++) {
        const problem = topicRegistry[topicId].generate();
        if (!shape.test(problem.statement)) continue;
        // Only the variants where a coefficient can equal 1 are of interest,
        // but every problem of the shape must be gradable regardless.
        matched++;
        const direct = computeDirectGroundTruth(problem.statement, topicId);
        expect(
          direct?.groundTruth
            ? "gradable"
            : `NOT gradable: ${problem.statement.replace(/\s+/g, " ")}`,
        ).toBe("gradable");
      }
      expect(matched).toBeGreaterThan(0);
    });
  }

  test("a statement printed with a redundant '1x' would still be understood", () => {
    // Older submissions stored before the formatting fix must keep grading.
    expect(
      parseLinearEquationGroundTruth("Solve for $x$: $$ 1x + 3 = 10 $$")?.groundTruth,
    ).toBe("7");
    expect(
      parseLimitGroundTruth(
        "Compute the limit: $$ \\lim_{x \\to \\infty} \\frac{4x + 3}{1x + 8} $$",
      )?.groundTruth,
    ).toBe("4");
  });
});
