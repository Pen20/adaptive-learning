// Difficulty-tier classifiers for the quiz study, keyed by topic slug.
// Pure module with zero imports so it can be shared between the frontend
// (src/data/studyDifficulty.ts) and the Convex backend (convex/studyQuiz.ts).
// Statements are matched against the literal patterns each generator variant
// produces.

export type DifficultyTier = "easy" | "medium" | "hard";

export const TIER_CLASSIFIERS: Record<string, (statement: string) => DifficultyTier> = {
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
