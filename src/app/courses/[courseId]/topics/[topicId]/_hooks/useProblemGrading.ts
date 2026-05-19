"use client";

import { useEffect, useState } from "react";
import { useAction } from "convex/react";
import { toast } from "sonner";
import { api } from "@/lib/convex";
import type { Id } from "@/lib/convex";
import type { AnswerFormat } from "@/data/topics";
import type { GradingResult, ProblemData } from "../_types";
import { courseIdToCourseName } from "./useProblemPermissions";

interface UseProblemGradingArgs {
  userId?: string;
  courseId: string;
  topicId: string;
  problemData: ProblemData | null;
  finalAnswer: string;
  reasoning: string;
  model: string;
  usedHints: boolean;
}

function buildAnswerFormatInstruction(answerFormat: AnswerFormat) {
  return [
    answerFormat.instruction,
    answerFormat.alternatives?.length
      ? `Accepted alternative formats: ${answerFormat.alternatives.join("; ")}.`
      : "",
  ]
    .filter(Boolean)
    .join(" ");
}

export function useProblemGrading({
  userId,
  courseId,
  topicId,
  problemData,
  finalAnswer,
  reasoning,
  model,
  usedHints,
}: UseProblemGradingArgs) {
  const gradeAndSaveSubmission = useAction(
    api.gradingPipeline.gradeAndSaveSubmission,
  );
  const [grading, setGrading] = useState(false);
  const [result, setResult] = useState<GradingResult | null>(null);
  const [lastSubmissionId, setLastSubmissionId] =
    useState<Id<"submissions"> | null>(null);

  useEffect(() => {
    setResult(null);
    setLastSubmissionId(null);
    setGrading(false);
  }, [problemData?.statement]);

  const handleCheck = async () => {
    if (!userId || !problemData) return;

    setGrading(true);
    setResult(null);
    let feedbackReady = false;

    try {
      const gradeResult = (await gradeAndSaveSubmission({
        userId,
        courseName: courseIdToCourseName(courseId),
        topicName: topicId,
        problemStatement: problemData.statement,
        finalAnswer,
        reasoningSteps: reasoning,
        model,
        usedHints,
        answerFormatInstruction: buildAnswerFormatInstruction(
          problemData.answerFormat,
        ),
      })) as GradingResult & { submissionId: Id<"submissions"> };

      setResult({
        grade: gradeResult.grade,
        feedback: gradeResult.feedback,
        errorType: gradeResult.errorType,
      });
      feedbackReady = true;
      setGrading(false);
      setLastSubmissionId(gradeResult.submissionId);
    } catch (error) {
      console.error("Grading failed:", error);
      toast.error(
        feedbackReady
          ? "Feedback loaded, but saving the submission failed."
          : "Grading failed. Please check your connection and try again.",
      );
    } finally {
      setGrading(false);
    }
  };

  return {
    grading,
    result,
    lastSubmissionId,
    handleCheck,
  };
}
