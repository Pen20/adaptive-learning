import { describe, expect, test } from "bun:test";
import {
  STUDY_DIFFICULTY_SEQUENCE,
  classifyDifficulty,
  generateProblemForTier,
  tierForProblemIndex,
} from "./studyDifficulty";
import { topicRegistry } from "./topics";

// Guarantees for the study practice sessions (protocol §5.2): every tier of the
// fixed difficulty script must be reliably generatable for each study topic.

const STUDY_TOPICS = ["determinants", "eigenvalues", "derivatives"] as const;
const TIERS = ["easy", "medium", "hard"] as const;

for (const topicId of STUDY_TOPICS) {
  describe(`difficulty script — ${topicId}`, () => {
    test("every generated problem classifies into a tier", () => {
      for (let i = 0; i < 100; i++) {
        const generated = topicRegistry[topicId].generate();
        const tier = classifyDifficulty(topicId, generated.statement);
        expect(TIERS).toContain(tier);
      }
    });

    test("all three tiers occur naturally in generation", () => {
      const seen = new Set<string>();
      for (let i = 0; i < 300 && seen.size < 3; i++) {
        const generated = topicRegistry[topicId].generate();
        const tier = classifyDifficulty(topicId, generated.statement);
        if (tier) seen.add(tier);
      }
      expect([...seen].sort()).toEqual(["easy", "hard", "medium"]);
    });

    for (const tier of TIERS) {
      test(`generateProblemForTier produces a ${tier} problem`, () => {
        for (let i = 0; i < 10; i++) {
          const generated = generateProblemForTier(topicId, tier);
          expect(classifyDifficulty(topicId, generated.statement)).toBe(tier);
        }
      });
    }

    test("the full 6-problem session script is generatable in order", () => {
      STUDY_DIFFICULTY_SEQUENCE.forEach((expectedTier, index) => {
        expect(tierForProblemIndex(index)).toBe(expectedTier);
        const generated = generateProblemForTier(topicId, tierForProblemIndex(index));
        expect(classifyDifficulty(topicId, generated.statement)).toBe(expectedTier);
      });
      // Beyond the scripted problems, generation is unconstrained
      expect(tierForProblemIndex(6)).toBeNull();
    });
  });
}
