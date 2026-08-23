import determinantsData from "./determinants.json";
import { standardTopicFiches } from "./standardFiches";
import {
  validateTopicEvaluationFiche,
  type ExercisePedagogyInstance,
  type TopicEvaluationFiche,
} from "./schema";

const determinantsFiche = validateTopicEvaluationFiche(
  determinantsData as TopicEvaluationFiche,
);

const fiches: Record<string, TopicEvaluationFiche> = {
  determinants: determinantsFiche,
  ...Object.fromEntries(
    standardTopicFiches.map((fiche) => [
      fiche.topicId,
      validateTopicEvaluationFiche(fiche),
    ]),
  ),
};

const topicAliases: Record<string, string> = {
  limits_continuity: "limits",
  continuity: "piecewise_continuity",
  piecewise: "piecewise_continuity",
  derivatives_practice: "derivatives",
  quadratic: "quadratic_equations",
  systems: "linear_systems",
  equations: "linear_equations",
  matrices: "determinants",
};

export function getTopicEvaluationFiche(topicId: string) {
  return fiches[topicAliases[topicId] ?? topicId] ?? null;
}

export function buildExercisePedagogyInstance(
  topicId: string,
  taskTypeId: string,
  expectedIntermediateResults?: Record<string, Record<string, string>>,
): ExercisePedagogyInstance {
  const fiche = getTopicEvaluationFiche(topicId);
  if (!fiche) throw new Error(`No pedagogical fiche for ${topicId}.`);
  const task = fiche.taskTypes.find((item) => item.taskTypeId === taskTypeId);
  if (!task) throw new Error(`Unknown task type ${taskTypeId}.`);

  return {
    ficheId: fiche.ficheId,
    ficheVersion: fiche.ficheVersion,
    taskTypeId,
    objectiveIds: task.objectiveIds,
    allowedTechniqueIds: task.acceptedTechniques.map((item) => item.techniqueId),
    expectedIntermediateResults,
  };
}

export type { ExercisePedagogyInstance, TopicEvaluationFiche } from "./schema";
