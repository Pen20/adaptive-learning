import { describe, expect, test } from "bun:test";
import {
  computeQuadraticRoots,
  formatRational,
  isNumericListEquivalent,
  parseSimpleRelation,
  parseNumericList,
  parseSingleNumericAnswer,
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

  test("parses parameter-style final answers as single numeric values", () => {
    expect(parseSingleNumericAnswer("k = 1")).toBe(1);
    expect(parseSingleNumericAnswer("\\boxed{k = 1}")).toBe(1);
    expect(parseSingleNumericAnswer("k = \\frac{3}{2}")).toBe(1.5);
  });

  test("accepts structured eigenvalue answers and plus-minus notation", () => {
    expect(
      isNumericListEquivalent("lambda_1 = 2, lambda_2 = 3", "[2, 3]"),
    ).toBe(true);
    expect(
      isNumericListEquivalent("lambda in {5, 2 +/- sqrt(3)}", "[0.26794919243112, 3.7320508075689, 5]"),
    ).toBe(true);
    expect(parseNumericList("lambda in {5, 2 +/- sqrt(3)}")).toEqual([
      5,
      2 + Math.sqrt(3),
      2 - Math.sqrt(3),
    ]);
  });

  test("parses simple equality and inequality relations", () => {
    expect(parseSimpleRelation("k != 3")).toEqual({
      variable: "k",
      operator: "!=",
      value: 3,
    });
    expect(parseSimpleRelation("k \\neq \\frac{3}{2}")).toEqual({
      variable: "k",
      operator: "!=",
      value: 1.5,
    });
    expect(parseSimpleRelation("lambda_1 = 2")).toEqual({
      variable: "lambda_1",
      operator: "=",
      value: 2,
    });
  });
});
