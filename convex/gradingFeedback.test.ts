import { describe, expect, test } from "bun:test";
import {
  INTERMEDIATE_EQUIVALENCE_RULE,
  removeNumberedStepReferences,
  replaceVerdictWithSingleSummary,
} from "./grading";

describe("learner-facing reasoning feedback", () => {
  test("removes numbered step references and describes a divergence", () => {
    const feedback =
      "**Reasoning steps:** Your reasoning diverges at Step 4 — Multiply each entry by its signed cofactor.";
    const normalized = removeNumberedStepReferences(feedback);
    expect(normalized.includes("Step 4")).toBe(false);
    expect(normalized.includes("Your reasoning diverges when")).toBe(true);
    expect(normalized.includes("Multiply each entry by its signed cofactor")).toBe(true);
  });

  test("keeps a single concise verdict without additional guidance", () => {
    const feedback =
      "**Final Answer:** Incorrect.\n\n**Reasoning steps:** Incorrect cofactor sign.\n\n**Verdict:** Your score is 0/1. The final answer is incorrect. Please review the minors.";
    const normalized = replaceVerdictWithSingleSummary(feedback, 0, 0);
    expect((normalized.match(/\*\*Verdict:\*\*/g) ?? []).length).toBe(1);
    expect(normalized.includes("Additional guidance")).toBe(false);
    expect(normalized.includes("Please review the minors")).toBe(false);
  });

  test("explicitly protects neutral-factor equivalence", () => {
    expect(INTERMEDIATE_EQUIVALENCE_RULE.includes("2k - 2 and 2k - 2 × 1 are exactly equivalent")).toBe(true);
    expect(INTERMEDIATE_EQUIVALENCE_RULE.includes("do NOT create a reasoning divergence")).toBe(true);
  });
});
