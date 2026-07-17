import { topicRegistry } from "@/data/topics";
import type { GeneratedProblem } from "@/data/topics";
import { TIER_CLASSIFIERS, classifyDifficulty } from "@/data/difficultyClassifiers";
import type { DifficultyTier } from "@/data/difficultyClassifiers";

// Fixed difficulty script for study practice sessions (protocol §5.2):
// 2 easy → 2 medium → 2 hard, identical across experimental arms, then free
// generation beyond the 6th problem. Difficulty tiers are recognised from the
// generators' problem-variant patterns (shared classifiers in
// difficultyClassifiers.ts) and obtained by rejection sampling.

export type { DifficultyTier };
export { classifyDifficulty };

export const STUDY_DIFFICULTY_SEQUENCE: DifficultyTier[] = [
  "easy",
  "easy",
  "medium",
  "medium",
  "hard",
  "hard",
];

// Tier required for the Nth problem of a session (0-indexed); null = free.
export function tierForProblemIndex(index: number): DifficultyTier | null {
  return STUDY_DIFFICULTY_SEQUENCE[index] ?? null;
}

const MAX_SAMPLING_TRIES = 80;

// Generates a problem of the requested tier by rejection sampling the topic's
// parametric generator. Falls back to an unconstrained problem for topics
// without a classifier or if sampling fails (never blocks the participant).
export function generateProblemForTier(
  topicId: string,
  tier: DifficultyTier | null,
): GeneratedProblem {
  const engine = topicRegistry[topicId];
  if (!engine) {
    throw new Error(`No problem generator for topic "${topicId}"`);
  }
  const classifier = TIER_CLASSIFIERS[topicId];
  if (!tier || !classifier) return engine.generate();

  for (let attempt = 0; attempt < MAX_SAMPLING_TRIES; attempt++) {
    const generated = engine.generate();
    if (classifier(generated.statement) === tier) return generated;
  }
  return engine.generate();
}
