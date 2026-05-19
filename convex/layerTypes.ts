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
