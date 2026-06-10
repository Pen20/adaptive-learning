import type { AnswerFormat } from "@/data/topics";

export interface ProblemData {
  statement: string;
  hint: string;
  solution: string;
  explanation?: string;
  guide?: { title: string; content: string };
  title?: string;
  answerFormat: AnswerFormat;
  reasoningSteps?: string;
}

export interface GradingResult {
  grade: number;
  feedback: string;
  errorType?: string;
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
