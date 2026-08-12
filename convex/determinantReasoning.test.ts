import { describe, expect, test } from "bun:test";
import {
  analyzeSingularParameterReasoning,
  verifyNumericDeterminantReasoning,
} from "./determinantReasoning";

describe("deterministic determinant reasoning verification", () => {
  test("accepts the condensed correct cofactor calculation from the reported case", () => {
    expect(
      verifyNumericDeterminantReasoning(
        "We get: $|A|=-1(-1-0)-2(2-0)+1(4+2)=3$",
        "3",
      ),
    ).toBe(true);
  });

  test("accepts neutral multiplication by one", () => {
    expect(
      verifyNumericDeterminantReasoning(
        "Using cofactors, |A| = 2(3-2*1) + 1(0-0) = 2",
        "2",
      ),
    ).toBe(true);
  });

  test("rejects a cofactor calculation with the wrong value", () => {
    expect(
      verifyNumericDeterminantReasoning(
        "Using cofactors, |A|=-1(-1-0)-2(2-0)+1(4-2)= -1",
        "3",
      ),
    ).toBe(false);
  });

  test("does not accept an unexplained final number", () => {
    expect(verifyNumericDeterminantReasoning("det(A) = 3", "3")).toBe(false);
  });
});

describe("singular parameter reasoning", () => {
  test("recognizes a correct determinant expression that stops too early", () => {
    expect(
      analyzeSingularParameterReasoning("We get |A| = 5k - 6", "5k - 6", "6/5"),
    ).toBe("correct_but_incomplete");
  });

  test("recognizes the completed singularity argument", () => {
    expect(
      analyzeSingularParameterReasoning(
        "|A| = 5k - 6. For singularity, 5k - 6 = 0, so k = 6/5.",
        "5k - 6",
        "6/5",
      ),
    ).toBe("correct");
  });

  test("does not validate an incorrect determinant expression", () => {
    expect(
      analyzeSingularParameterReasoning("|A| = 5k + 6", "5k - 6", "6/5"),
    ).toBe("not_verified");
  });
});
