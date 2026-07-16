import { topicRegistry } from "@/data/topics";
import type { GeneratedProblem } from "@/data/topics";

// Fixed difficulty script for study practice sessions (protocol §5.2):
// 2 easy → 2 medium → 2 hard, identical across experimental arms, then free
// generation beyond the 6th problem. Difficulty tiers are recognised from the
// generators' problem-variant patterns and obtained by rejection sampling.

export type DifficultyTier = "easy" | "medium" | "hard";

export const STUDY_DIFFICULTY_SEQUENCE: DifficultyTier[] = [
  "easy",
  "easy",
  "medium",
  "medium",
  "hard",
  "hard",
];

// Per-topic variant classifiers, keyed by topic slug. Statements are matched
// against the literal patterns each generator variant produces.
const TIER_CLASSIFIERS: Record<string, (statement: string) => DifficultyTier> = {
  determinants: (s) =>
    s.includes("matrix is singular")
      ? "easy" // 2×2 det = 0, solve for k
      : s.includes("Compute the determinant")
        ? "medium" // numeric 3×3 cofactor expansion
        : "hard", // 3×3 with parameter k, non-zero condition
  eigenvalues: (s) =>
    s.includes("& 0 \\\\ 0 &")
      ? "easy" // diagonal matrix — read off the diagonal
      : s.includes("& 1 \\\\ 1 &")
        ? "hard" // symmetric matrix — full characteristic equation
        : "medium", // upper triangular
  derivatives: (s) =>
    s.includes("\\cdot") || s.includes("\\frac")
      ? "hard" // product rule / quotient rule
      : s.includes("\\cos(") || s.includes("\\ln(")
        ? "medium" // chain rule
        : "easy", // polynomial power rule
};

export function classifyDifficulty(topicId: string, statement: string): DifficultyTier | null {
  const classifier = TIER_CLASSIFIERS[topicId];
  return classifier ? classifier(statement) : null;
}

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
