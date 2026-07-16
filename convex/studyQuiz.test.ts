import { describe, expect, test } from "bun:test";
import { topicRegistry } from "../src/data/topics";
import { checkEquivalenceDirect, computeDirectGroundTruth } from "./cas";

// End-to-end determinism check for the quiz study (docs/research/protocole-etude-quiz.md §5.1):
// quiz items are only accepted when computeDirectGroundTruth can grade them, and a
// student who answers exactly the generator's official solution must be marked correct.

const STUDY_TOPICS = ["determinants", "eigenvalues", "derivatives"];
const CANDIDATE_COUNT = 40;
const QUIZ_ITEM_COUNT = 6;

for (const topicId of STUDY_TOPICS) {
  describe(`study quiz — ${topicId}`, () => {
    const engine = topicRegistry[topicId];
    const candidates = Array.from({ length: CANDIDATE_COUNT }, () => engine.generate());
    const computable = candidates
      .map((generated) => ({
        generated,
        direct: computeDirectGroundTruth(generated.statement, topicId),
      }))
      .filter(
        (item): item is typeof item & { direct: { isComputable: true; groundTruth: string } } =>
          item.direct !== null && item.direct.isComputable && !!item.direct.groundTruth,
      );

    test(`at least ${QUIZ_ITEM_COUNT} of ${CANDIDATE_COUNT} generated problems are direct-CAS gradable`, () => {
      expect(computable.length).toBeGreaterThanOrEqual(QUIZ_ITEM_COUNT);
    });

    test("the generator's official solution is graded as correct", () => {
      for (const { generated, direct } of computable) {
        const check = checkEquivalenceDirect(generated.solution, direct.groundTruth);
        expect(
          `${check.isEquivalent} — solution "${generated.solution}" vs groundTruth "${direct.groundTruth}"`,
        ).toBe(
          `true — solution "${generated.solution}" vs groundTruth "${direct.groundTruth}"`,
        );
      }
    });

    test("a garbage answer is never graded as correct", () => {
      for (const { direct } of computable.slice(0, 5)) {
        const check = checkEquivalenceDirect("banana", direct.groundTruth);
        expect(check.isEquivalent === true).toBe(false);
      }
    });
  });
}
