import type {
  AiDiagnosisResult,
  CasLayerResult,
  DidacticLayerResult,
  PraxeologyResult,
} from "./layerTypes";

type BuildDidacticArgs = {
  topicName: string;
  grade: number;
  casLayer: CasLayerResult;
  aiDiagnosis: AiDiagnosisResult;
};

type TopicDidacticMap = {
  taskType: string;
  technology: string;
  theory: string;
  recommendedNextTask: string;
};

const TOPIC_DIDACTICS: Record<string, TopicDidacticMap> = {
  quadratic_equations: {
    taskType: "solve a quadratic equation",
    technology:
      "solutions are the roots that make the polynomial equal to zero",
    theory: "polynomial equations and equivalence of solution sets",
    recommendedNextTask:
      "practice identifying all roots and checking them by substitution",
  },
  determinants: {
    taskType: "compute or interpret a determinant",
    technology:
      "the determinant encodes invertibility, area scaling, and singularity",
    theory: "matrix algebra and linear transformations",
    recommendedNextTask:
      "practice determinant expansion and determinant-based conditions",
  },
  eigenvalues: {
    taskType: "find eigenvalues of a matrix",
    technology:
      "eigenvalues are roots of the characteristic equation",
    theory: "linear transformations and invariant directions",
    recommendedNextTask:
      "practice building and solving characteristic polynomials",
  },
  eigenvalues_3x3: {
    taskType: "find eigenvalues of a 3 by 3 matrix",
    technology:
      "eigenvalues are roots of the characteristic polynomial",
    theory: "spectral structure of linear transformations",
    recommendedNextTask:
      "practice factoring cubic characteristic polynomials",
  },
  derivatives: {
    taskType: "differentiate a function",
    technology:
      "derivative rules preserve equivalence while tracking rate of change",
    theory: "local linear approximation and rates of change",
    recommendedNextTask:
      "practice naming the rule used before simplifying the derivative",
  },
  limits: {
    taskType: "evaluate a limit",
    technology:
      "limits describe the value approached by a function near a point",
    theory: "continuity and local function behavior",
    recommendedNextTask:
      "practice choosing between substitution, factoring, and limit laws",
  },
  domain_range: {
    taskType: "determine domain and range",
    technology:
      "domain and range describe allowable inputs and resulting outputs",
    theory: "function structure and set notation",
    recommendedNextTask:
      "practice translating function restrictions into interval notation",
  },
};

function topicLabel(topicName: string) {
  return topicName.replace(/_/g, " ");
}

function getTopicDidactics(topicName: string): TopicDidacticMap {
  return (
    TOPIC_DIDACTICS[topicName] ?? {
      taskType: `work on ${topicLabel(topicName)}`,
      technology:
        "the chosen technique must be justified by the relevant mathematical properties",
      theory: `core ideas from ${topicLabel(topicName)}`,
      recommendedNextTask:
        "practice the same task type while explicitly naming each mathematical step",
    }
  );
}

function uniqueTags(tags: string[]) {
  return Array.from(new Set(tags.map((tag) => tag.trim()).filter(Boolean)));
}

function masteryDeltaForGrade(grade: number) {
  if (grade >= 1) return 10;
  if (grade >= 0.5) return 3;
  return 0;
}

function buildLearningFocus(
  grade: number,
  casLayer: CasLayerResult,
  aiDiagnosis: AiDiagnosisResult,
  praxeology: PraxeologyResult,
) {
  const verificationSentence = casLayer.checked
    ? casLayer.equivalent
      ? "The CAS layer verified that your final answer is equivalent to the expected result."
      : "The CAS layer found that your final answer is not equivalent to the expected result."
    : "The CAS layer could not safely verify the final answer, so the feedback relies more on your reasoning.";

  const nextStep =
    grade >= 1
      ? `Keep using the technique of ${praxeology.technique} and focus on explaining why it works.`
      : `Your next learning focus is ${aiDiagnosis.misconception.toLowerCase()}; connect your technique to the idea that ${praxeology.technology}.`;

  return `**Learning focus:** ${verificationSentence} This is a task of ${praxeology.taskType}. The technique identified was ${praxeology.technique}, supported by the mathematical idea that ${praxeology.technology}. ${nextStep}`;
}

export function buildDidacticInterpretation({
  topicName,
  grade,
  casLayer,
  aiDiagnosis,
}: BuildDidacticArgs): DidacticLayerResult {
  const didactics = getTopicDidactics(topicName);
  const praxeology: PraxeologyResult = {
    taskType: didactics.taskType,
    technique: aiDiagnosis.techniqueUsed,
    technology: didactics.technology,
    theory: didactics.theory,
  };
  const conceptTags = uniqueTags([
    topicName,
    ...aiDiagnosis.conceptTags,
    didactics.taskType,
    didactics.theory,
  ]);
  const misconceptionTags =
    grade < 1 && aiDiagnosis.misconception
      ? uniqueTags([aiDiagnosis.misconception, aiDiagnosis.errorType])
      : [];

  return {
    feedback: buildLearningFocus(grade, casLayer, aiDiagnosis, praxeology),
    conceptTags,
    praxeology,
    profileUpdate: {
      masteryDelta: masteryDeltaForGrade(grade),
      misconceptionTags,
      techniquePracticed: aiDiagnosis.techniqueUsed,
      recommendedNextTask: didactics.recommendedNextTask,
    },
  };
}
