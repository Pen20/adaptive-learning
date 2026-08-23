import { describe, expect, test } from "bun:test";
import {
  buildExercisePedagogyInstance,
  getTopicEvaluationFiche,
} from "./index";
import { topicRegistry } from "../topics";

const canonicalTopics = [
  "limits",
  "derivatives",
  "piecewise_continuity",
  "domain_range",
  "quadratic_equations",
  "linear_systems",
  "linear_equations",
  "eigenvalues",
  "determinants",
  "linear_independence",
  "gram_schmidt",
  "inner_product_def",
  "integral_inner_product",
  "integral_axioms",
  "polynomial_inner_product",
  "eigenvalues_3x3",
  "eigenspaces_2x2",
  "vector_space_axioms",
] as const;

describe("topic-level fiche pédagogique d’évaluation", () => {
  test("the Determinants fiche is valid and versioned", () => {
    const fiche = getTopicEvaluationFiche("determinants");
    expect(fiche).not.toBeNull();
    expect(fiche?.ficheId).toBe("determinants-evaluation");
    expect(fiche?.ficheVersion).toBe("1.1.0");
    expect(fiche?.evaluationRubric.reasoningCriteria.reduce(
      (sum, criterion) => sum + criterion.weight,
      0,
    )).toBe(0.5);
  });

  test("distinguishes incomplete reasoning from a mathematical error", () => {
    const fiche = getTopicEvaluationFiche("determinants");
    expect(
      fiche?.reasoningStatuses.some(
        (item) => item.status === "correct_but_incomplete",
      ),
    ).toBe(true);
    expect(
      fiche?.misconceptions.find((item) => item.misconceptionId === "DET-M6")
        ?.classification,
    ).toBe("incomplete_reasoning");
  });

  test("requires equivalence checks before declaring an error", () => {
    const fiche = getTopicEvaluationFiche("determinants");
    expect(fiche?.equivalencePolicy.mustCheckBeforeDeclaringError).toBe(true);
    expect(
      fiche?.equivalencePolicy.acceptedTransformations.includes(
        "multiplication or division by 1",
      ),
    ).toBe(true);
  });

  test("a 3x3 computation accepts alternative valid techniques", () => {
    const instance = buildExercisePedagogyInstance(
      "determinants",
      "DET-COMPUTE-3X3",
    );
    expect(instance.allowedTechniqueIds).toEqual([
      "cofactor-expansion",
      "row-reduction",
      "sarrus-rule",
    ]);
  });

  test("exercise instances retain topic fiche provenance", () => {
    const instance = buildExercisePedagogyInstance(
      "determinants",
      "DET-SINGULAR-2X2",
      { "two-by-two-formula": { parameterValue: "3/2" } },
    );
    expect(instance.ficheId).toBe("determinants-evaluation");
    expect(instance.ficheVersion).toBe("1.1.0");
    expect(instance.expectedIntermediateResults?.["two-by-two-formula"]?.parameterValue).toBe("3/2");
  });

  test("unknown task types fail instead of silently weakening evaluation", () => {
    let message = "";
    try {
      buildExercisePedagogyInstance("determinants", "DET-UNKNOWN");
    } catch (error) {
      message = error instanceof Error ? error.message : String(error);
    }
    expect(message).toBe("Unknown task type DET-UNKNOWN.");
  });

  test("every canonical topic has a validated evaluation fiche", () => {
    for (const topicId of canonicalTopics) {
      const fiche = getTopicEvaluationFiche(topicId);
      expect(fiche).not.toBeNull();
      expect(fiche?.equivalencePolicy.mustCheckBeforeDeclaringError).toBe(true);
      expect(
        fiche?.evaluationRubric.reasoningCriteria.reduce(
          (sum, criterion) => sum + criterion.weight,
          0,
        ),
      ).toBe(0.5);
      expect(fiche?.misconceptions.length).toBeGreaterThan(0);
    }
  });

  test("every canonical topic generator carries fiche provenance", () => {
    for (const topicId of canonicalTopics) {
      const generated = topicRegistry[topicId].generate();
      expect(generated.pedagogy).toBeDefined();
      expect(generated.pedagogy?.ficheId).toBe(
        getTopicEvaluationFiche(topicId)?.ficheId,
      );
    }
  });

  test("administrative aliases resolve to their canonical fiches", () => {
    expect(getTopicEvaluationFiche("matrices")?.ficheId).toBe("determinants-evaluation");
    expect(getTopicEvaluationFiche("systems")?.ficheId).toBe("linear_systems-evaluation");
    expect(getTopicEvaluationFiche("continuity")?.ficheId).toBe("piecewise_continuity-evaluation");
  });
});
