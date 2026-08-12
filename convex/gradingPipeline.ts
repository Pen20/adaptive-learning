import { action } from "./_generated/server";
import { v } from "convex/values";
import { api, internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import type { PedagogicalEvaluation, PipelineDiagnostics } from "./layerTypes";
import { STUDY_MODEL } from "./experiment";

type GradeAndSaveResult = {
  grade: number;
  feedback: string;
  errorType?: string;
  layerDiagnostics?: PipelineDiagnostics;
  pedagogicalEvaluation?: PedagogicalEvaluation;
  submissionId: Id<"submissions">;
};

type BestOfNMetadata = {
  n: number;
  selectedIndex: number;
  selectedJudgeConfidence: number;
  allCandidates: Array<{
    index: number;
    grade: number;
    judgeConfidence: number;
    isJudgeModified: boolean;
  }>;
};

export const gradeAndSaveSubmission = action({
  args: {
    userId: v.string(),
    courseName: v.union(
      v.literal("Linear Algebra"),
      v.literal("Differential Calculus"),
    ),
    topicName: v.string(),
    problemStatement: v.string(),
    finalAnswer: v.string(),
    reasoningSteps: v.string(),
    model: v.string(),
    usedHints: v.boolean(),
    answerFormatInstruction: v.optional(v.string()),
    reasoningStepsContext: v.optional(v.string()),
    exercisePedagogyJson: v.optional(v.string()),
    // RLHF: when true, runs Best-of-N sampling with the judge as reward model
    useBestOfN: v.optional(v.boolean()),
  },
  handler: async (ctx, args): Promise<GradeAndSaveResult> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    if (identity.subject !== args.userId) {
      throw new Error("Unauthorized: userId mismatch");
    }

    // Quiz study — an active experiment assignment for this user/topic forces
    // the feedback condition, overriding the frontend's useBestOfN flag
    // (see docs/research/protocole-etude-quiz.md §3.1 and convex/experiment.ts).
    const assignment = (await ctx.runQuery(internal.experiment.getActiveAssignment, {
      userId: args.userId,
      topicName: args.topicName,
    })) as {
      condition: "single_pass" | "best_of_n" | "best_of_n_outcome";
      phase: number;
      participantCode: string;
    } | null;

    const useBestOfN = assignment
      ? assignment.condition !== "single_pass"
      : !!args.useBestOfN;

    // During the study the grading model is fixed server-side (protocol §10);
    // outside the study the client's model choice is respected.
    const model = assignment ? STUDY_MODEL : args.model;

    const gradingArgs = {
      problemStatement: args.problemStatement,
      studentAnswer: args.finalAnswer,
      reasoning: args.reasoningSteps,
      model,
      topicName: args.topicName,
      answerFormatInstruction: args.answerFormatInstruction,
      reasoningStepsContext: args.reasoningStepsContext,
      exercisePedagogyJson: args.exercisePedagogyJson,
      ...(assignment
        ? {
            includeOutcomeContext: assignment.condition === "best_of_n_outcome",
            frozenPoolPhase: assignment.phase,
          }
        : {}),
    };

    const gradingStartedAt = Date.now();
    const gradeResult = (await (useBestOfN
      ? ctx.runAction(api.grading.gradeBestOfN, gradingArgs)
      : ctx.runAction(api.grading.gradeOptimized, gradingArgs)
    )) as {
      grade: number;
      feedback: string;
      errorType?: string;
      layerDiagnostics?: PipelineDiagnostics;
      pedagogicalEvaluation?: PedagogicalEvaluation;
      bestOfNMetadata?: BestOfNMetadata;
    };
    const gradingLatencyMs = Date.now() - gradingStartedAt;

    const bonMeta = gradeResult.bestOfNMetadata;
    const selectedCandidate = bonMeta
      ? bonMeta.allCandidates[bonMeta.selectedIndex]
      : undefined;

    const submissionId = (await ctx.runMutation(api.submissions.saveSubmission, {
      userId: args.userId,
      courseName: args.courseName,
      topicName: args.topicName,
      problemStatement: args.problemStatement,
      finalAnswer: args.finalAnswer,
      reasoningSteps: args.reasoningSteps,
      grade: gradeResult.grade,
      aiFeedback: gradeResult.feedback,
      errorType: gradeResult.errorType,
      usedHints: args.usedHints,
      judgeAlreadyRun: useBestOfN,
      judgeConfidence: bonMeta?.selectedJudgeConfidence,
      isJudgeModified: selectedCandidate?.isJudgeModified,
      pipelineDiagnostics: gradeResult.layerDiagnostics
        ? JSON.stringify(gradeResult.layerDiagnostics)
        : undefined,
      experimentCondition: assignment?.condition,
      experimentPhase: assignment?.phase,
      judgeFrozenPoolPhase: assignment?.phase,
    })) as Id<"submissions">;

    if (assignment) {
      await ctx.runMutation(internal.experiment.logGradingEvent, {
        submissionId,
        userId: args.userId,
        participantCode: assignment.participantCode,
        phase: assignment.phase,
        topicName: args.topicName,
        condition: assignment.condition,
        model,
        gradingLatencyMs,
        candidatesJson: JSON.stringify(
          bonMeta?.allCandidates ?? [{ index: 0, grade: gradeResult.grade }],
        ),
        selectedIndex: bonMeta?.selectedIndex,
      });
    }

    return {
      ...gradeResult,
      submissionId,
    };
  },
});
