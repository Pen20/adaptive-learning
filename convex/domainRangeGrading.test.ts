import { describe, expect, test } from "bun:test";
import {
  canonicalizeDomainRangeAnswer,
  canonicalizeSetExpression,
  isDomainRangeEquivalent,
} from "./calculusCasUtils";
import { checkEquivalenceDirect, computeDirectGroundTruth } from "./cas";
import { topicRegistry } from "../src/data/topics";

// Domain/range answers used to be handed straight to the AI grader. They are
// now settled deterministically whenever both sides canonicalise; anything the
// canonicaliser does not recognise must still return null so the AI decides.

describe("canonicalizeSetExpression", () => {
  test("recognises all-reals notations", () => {
    for (const notation of [
      "(-\\infty, \\infty)",
      "\\mathbb{R}",
      "R",
      "all reals",
      "(-inf, inf)",
      "(-∞, ∞)",
    ]) {
      expect(`${notation} → ${canonicalizeSetExpression(notation)}`).toBe(`${notation} → R`);
    }
  });

  test("recognises closed rays", () => {
    for (const notation of ["[2, \\infty)", "[2, inf)", "x \\ge 2", "x >= 2", "[2, ∞)"]) {
      expect(`${notation} → ${canonicalizeSetExpression(notation)}`).toBe(
        `${notation} → [2,inf)`,
      );
    }
  });

  test("recognises the reals minus one point", () => {
    for (const notation of [
      "\\mathbb{R} \\setminus \\{4\\}",
      "R\\{4}",
      "x \\ne 4",
      "x != 4",
      "all reals except 4",
      "(-\\infty, 4) \\cup (4, \\infty)",
    ]) {
      expect(`${notation} → ${canonicalizeSetExpression(notation)}`).toBe(
        `${notation} → R\\{4}`,
      );
    }
  });

  test("returns null for expressions it cannot interpret", () => {
    for (const notation of ["", "x > 2", "[2, 5]", "positive numbers", "banana"]) {
      expect(`${notation} → ${canonicalizeSetExpression(notation)}`).toBe(`${notation} → null`);
    }
  });
});

describe("canonicalizeDomainRangeAnswer", () => {
  test("splits labelled and unlabelled answers", () => {
    const expected = { domain: "[1,inf)", range: "[0,inf)" };
    for (const answer of [
      "Domain: [1, \\infty), Range: [0, \\infty)",
      "Domain \\([1, \\infty)\\)  Range \\([0, \\infty)\\)",
      "[1, \\infty) and [0, \\infty)",
      "x \\ge 1 and f(x) \\ge 0",
    ]) {
      expect(`${answer} → ${JSON.stringify(canonicalizeDomainRangeAnswer(answer))}`).toBe(
        `${answer} → ${JSON.stringify(expected)}`,
      );
    }
  });

  test("returns null when only one half is given", () => {
    expect(canonicalizeDomainRangeAnswer("Domain: [1, \\infty)")).toBeNull();
    expect(canonicalizeDomainRangeAnswer("[1, \\infty)")).toBeNull();
  });
});

describe("isDomainRangeEquivalent", () => {
  const squareRoot = "Domain: [2, inf), Range: [0, inf)";
  const rational = "Domain: R\\{4}, Range: R\\{0}";
  const absolute = "Domain: (-inf, inf), Range: [3, inf)";

  test("accepts every equivalent notation of a correct answer", () => {
    for (const answer of [
      "Domain: \\([2, \\infty)\\),  Range: \\([0, \\infty)\\)",
      "Domain: [2, infinity), Range: [0, infinity)",
      "[2, \\infty) and [0, \\infty)",
      "x \\ge 2 and f(x) \\ge 0",
    ]) {
      expect(`${answer} → ${isDomainRangeEquivalent(answer, squareRoot)}`).toBe(
        `${answer} → true`,
      );
    }
    for (const answer of [
      "Domain: \\(\\mathbb{R} \\setminus \\{4\\}\\),  Range: \\(\\mathbb{R} \\setminus \\{0\\}\\)",
      "(-\\infty, 4) \\cup (4, \\infty) and (-\\infty, 0) \\cup (0, \\infty)",
      "x \\ne 4 and f(x) \\ne 0",
      "all reals except 4 and all reals except 0",
    ]) {
      expect(`${answer} → ${isDomainRangeEquivalent(answer, rational)}`).toBe(
        `${answer} → true`,
      );
    }
    expect(isDomainRangeEquivalent("Domain: R, Range: [3, \\infty)", absolute)).toBe(true);
  });

  test("rejects wrong bounds and swapped halves", () => {
    expect(isDomainRangeEquivalent("Domain: [3, inf), Range: [0, inf)", squareRoot)).toBe(false);
    expect(isDomainRangeEquivalent("Domain: (-inf, inf), Range: [0, inf)", squareRoot)).toBe(
      false,
    );
    expect(isDomainRangeEquivalent("Domain: [0, inf), Range: [2, inf)", squareRoot)).toBe(false);
    expect(isDomainRangeEquivalent("Domain: R\\{5}, Range: R\\{0}", rational)).toBe(false);
  });

  test("defers to the AI grader instead of guessing", () => {
    for (const answer of ["I think it is all real numbers", "Domain: [2, inf)", "banana", ""]) {
      expect(`${answer} → ${isDomainRangeEquivalent(answer, squareRoot)}`).toBe(
        `${answer} → null`,
      );
    }
  });
});

describe("domain_range end to end", () => {
  test("every generated problem is graded deterministically from its own solution", () => {
    for (let i = 0; i < 150; i++) {
      const problem = topicRegistry.domain_range.generate();
      const direct = computeDirectGroundTruth(problem.statement, "domain_range");
      expect(`gradable: ${!!direct} — ${problem.statement}`).toBe(
        `gradable: true — ${problem.statement}`,
      );
      const verdict = checkEquivalenceDirect(problem.solution, direct!.groundTruth);
      expect(`${problem.solution} → ${verdict.isEquivalent}`).toBe(
        `${problem.solution} → true`,
      );
    }
  });

  test("a wrong answer to a generated problem is caught without the AI", () => {
    let checked = 0;
    for (let i = 0; i < 60; i++) {
      const problem = topicRegistry.domain_range.generate();
      const direct = computeDirectGroundTruth(problem.statement, "domain_range")!;
      // Claiming the domain is all of R is wrong for the square-root family.
      if (!direct.groundTruth.startsWith("Domain: [")) continue;
      const verdict = checkEquivalenceDirect("Domain: R, Range: [0, inf)", direct.groundTruth);
      expect(verdict.isEquivalent).toBe(false);
      checked++;
    }
    expect(checked).toBeGreaterThan(0);
  });
});
