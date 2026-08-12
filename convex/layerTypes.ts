export type CasLayerResult = {
  isComputable: boolean;
  checked: boolean;
  equivalent: boolean | null;
  expectedAnswer: string | null;
  expression: string | null;
  description: string;
  confidence: number;
};

export type AiDiagnosisResult = {
  techniqueUsed: string;
  errorType: string;
  misconception: string;
  errorLocation: string;
  reasoningScore: 0 | 0.5;
  conceptTags: string[];
  confidence: number;
  pedagogicalEvaluation?: PedagogicalEvaluation;
};

export type PedagogicalCriterionResult = {
  criterionId: string;
  status: "satisfied" | "partial" | "incorrect" | "not-evidenced";
  evidence: string;
};

export type PedagogicalEvaluation = {
  ficheId: string;
  ficheVersion: string;
  taskTypeId: string;
  techniqueId: string;
  techniqueLabel: string;
  reasoningStatus: "correct" | "correct_but_incomplete" | "incorrect" | "missing" | "not_applicable";
  completedStepIds: string[];
  firstIncorrectStepId: string | null;
  misconceptionId: string | null;
  misconceptionLabel: string | null;
  criterionResults: PedagogicalCriterionResult[];
  remediationPrompt: string | null;
};

export type PraxeologyResult = {
  taskType: string;
  technique: string;
  technology: string;
  theory: string;
};

export type ProfileUpdate = {
  masteryDelta: number;
  misconceptionTags: string[];
  techniquePracticed: string;
  recommendedNextTask: string;
};

export type DidacticLayerResult = {
  feedback: string;
  conceptTags: string[];
  praxeology: PraxeologyResult;
  profileUpdate: ProfileUpdate;
};

export type PipelineDiagnostics = {
  casLayer: CasLayerResult;
  aiLayer: AiDiagnosisResult;
  didacticLayer: DidacticLayerResult;
};
