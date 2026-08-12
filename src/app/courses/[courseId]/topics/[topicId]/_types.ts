import type { AnswerFormat } from "@/data/topics";
import type { ExercisePedagogyInstance } from "@/data/pedagogy";

export interface ProblemData {
  statement: string;
  hint: string;
  solution: string;
  explanation?: string;
  guide?: { title: string; content: string };
  title?: string;
  answerFormat: AnswerFormat;
  reasoningSteps?: string;
  pedagogy?: ExercisePedagogyInstance;
}

export interface GradingResult {
  grade: number;
  feedback: string;
  errorType?: string;
  pedagogicalEvaluation?: PedagogicalEvaluation;
}

export interface CriterionResult {
  criterionId: string;
  status: "satisfied" | "partial" | "incorrect" | "not-evidenced";
  evidence: string;
}

export interface PedagogicalEvaluation {
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
  criterionResults: CriterionResult[];
  remediationPrompt: string | null;
}

export interface PracticeQuestion {
  id: string;
  text: string;
  correctAnswer: string;
}

export interface PracticeRecommendations {
  message: string;
  questions: PracticeQuestion[];
}
