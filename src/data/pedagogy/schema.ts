export type PedagogicalStep = {
  componentId: string;
  description: string;
  required: boolean;
  acceptableEvidence: string[];
  insufficientEvidence?: string[];
};

export type PedagogicalTechnique = {
  techniqueId: string;
  label: string;
  constraints?: string[];
  reasoningComponents: PedagogicalStep[];
};

export type PedagogicalTaskType = {
  taskTypeId: string;
  name: string;
  objectiveIds: string[];
  acceptedTechniques: PedagogicalTechnique[];
  reasoningCriterionIds: string[];
};

export type PedagogicalCriterion = {
  criterionId: string;
  description: string;
  weight: number;
};

export type PedagogicalMisconception = {
  misconceptionId: string;
  label: string;
  classification: "conceptual_error" | "procedural_error" | "calculation_error" | "incomplete_reasoning";
  observableIndicators: string[];
  prerequisiteIds: string[];
  feedbackStrategy: {
    acknowledge: string;
    prompt: string;
    avoidGivingAnswerImmediately: boolean;
  };
  remediationStrategy: string;
};

export type TopicEvaluationFiche = {
  schemaVersion: string;
  ficheId: string;
  ficheVersion: string;
  topicId: string;
  title: string;
  learningObjectives: Array<{ objectiveId: string; description: string }>;
  prerequisites: Array<{ prerequisiteId: string; description: string }>;
  taskTypes: PedagogicalTaskType[];
  evaluationRubric: {
    finalAnswerWeight: number;
    reasoningWeight: number;
    reasoningCriteria: PedagogicalCriterion[];
  };
  reasoningStatuses: Array<{
    status: "correct" | "correct_but_incomplete" | "incorrect" | "missing" | "not_applicable";
    definition: string;
    penalizesReasoning: boolean;
  }>;
  equivalencePolicy: {
    mustCheckBeforeDeclaringError: boolean;
    acceptedTransformations: string[];
    rule: string;
  };
  scoringPolicy: {
    mode: "binary";
    maximumReasoningScore: number;
    fullCreditRule: string;
    zeroCreditRule: string;
    criteriaPurpose: "diagnosis_and_feedback";
  };
  feedbackPolicy: {
    acknowledgeCorrectWorkFirst: boolean;
    identifyFirstGenuineDivergence: boolean;
    doNotMentionInternalStepIds: boolean;
    doNotCallEquivalentExpressionsErrors: boolean;
    distinguishIncompleteFromIncorrect: boolean;
    maximumActionableCorrections: number;
    preferredReasoningPhrases: {
      incorrect: string;
      incomplete: string;
      correct: string;
    };
  };
  misconceptions: PedagogicalMisconception[];
};

export type ExercisePedagogyInstance = {
  ficheId: string;
  ficheVersion: string;
  taskTypeId: string;
  objectiveIds: string[];
  allowedTechniqueIds: string[];
  expectedIntermediateResults?: Record<string, Record<string, string>>;
};

export function validateTopicEvaluationFiche(
  value: TopicEvaluationFiche,
): TopicEvaluationFiche {
  if (!value.ficheId || !value.topicId || !value.ficheVersion) {
    throw new Error("A pedagogical fiche requires an id, version, and topicId.");
  }

  const objectives = new Set(value.learningObjectives.map((item) => item.objectiveId));
  const criteria = new Set(
    value.evaluationRubric.reasoningCriteria.map((item) => item.criterionId),
  );
  const misconceptions = new Set<string>();

  for (const task of value.taskTypes) {
    const techniqueIds = new Set<string>();
    for (const objectiveId of task.objectiveIds) {
      if (!objectives.has(objectiveId)) {
        throw new Error(`Unknown objective ${objectiveId} in ${task.taskTypeId}.`);
      }
    }
    for (const criterionId of task.reasoningCriterionIds) {
      if (!criteria.has(criterionId)) {
        throw new Error(`Unknown criterion ${criterionId} in ${task.taskTypeId}.`);
      }
    }
    for (const technique of task.acceptedTechniques) {
      if (techniqueIds.has(technique.techniqueId)) {
        throw new Error(`Duplicate technique ${technique.techniqueId}.`);
      }
      techniqueIds.add(technique.techniqueId);
      if (!technique.reasoningComponents.length) {
        throw new Error(`Technique ${technique.techniqueId} has no reasoning components.`);
      }
      for (const component of technique.reasoningComponents) {
        if (!component.acceptableEvidence.length) {
          throw new Error(`Component ${component.componentId} has no acceptable evidence.`);
        }
      }
    }
  }

  for (const misconception of value.misconceptions) {
    if (misconceptions.has(misconception.misconceptionId)) {
      throw new Error(`Duplicate misconception ${misconception.misconceptionId}.`);
    }
    misconceptions.add(misconception.misconceptionId);
  }

  const reasoningTotal = value.evaluationRubric.reasoningCriteria.reduce(
    (sum, criterion) => sum + criterion.weight,
    0,
  );
  if (Math.abs(reasoningTotal - value.evaluationRubric.reasoningWeight) > 0.0001) {
    throw new Error("Reasoning criterion weights must equal reasoningWeight.");
  }
  if (!value.equivalencePolicy.mustCheckBeforeDeclaringError) {
    throw new Error("Equivalence must be checked before declaring a reasoning error.");
  }
  if (value.scoringPolicy.maximumReasoningScore !== value.evaluationRubric.reasoningWeight) {
    throw new Error("The scoring policy must match the reasoning rubric weight.");
  }

  return value;
}
