import { describe, expect, test } from "bun:test";
import {
  computeQuadraticRoots,
  formatRational,
  isNumericListEquivalent,
  parseNumericList,
} from "./mathAnswerUtils";

describe("math answer utilities", () => {
  test("computes deterministic integer roots for generated quadratic statements", () => {
    expect(computeQuadraticRoots("Solve for x: $$x^2 + 7x + 12 = 0$$")).toEqual([
      "-4",
      "-3",
    ]);
  });

  test("accepts equivalent root sets in common student notation", () => {
    expect(isNumericListEquivalent("x in {-3, -4}", "[-4, -3]")).toBe(true);
    expect(isNumericListEquivalent("{-4, -3}", "[-4, -3]")).toBe(true);
    expect(isNumericListEquivalent("x = -3 and x = -4", "[-4, -3]")).toBe(
      true,
    );
  });

  test("uses the final numeric set from reasoning-heavy answers", () => {
    const answer =
      "First I compute the determinant as 1. Thus the solutions are x_1=-4 and x_2=-3.";

    expect(isNumericListEquivalent(answer, "[-4, -3]")).toBe(true);
  });

  test("rejects incomplete root lists", () => {
    expect(isNumericListEquivalent("x = -3", "[-4, -3]")).toBe(false);
  });

  test("parses latex fractions and reduces rational results", () => {
    expect(parseNumericList("\\frac{-7}{2}, 1")).toEqual([-3.5, 1]);
    expect(formatRational(-6, -4)).toBe("3/2");
  });
});
