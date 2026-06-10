import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import type { PipelineDiagnostics } from "./layerTypes";

type GradeAndSaveResult = {
  grade: number;
  feedback: string;
  errorType?: string;
  layerDiagnostics?: PipelineDiagnostics;
  submissionId: Id<"submissions">;
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
  },
  handler: async (ctx, args): Promise<GradeAndSaveResult> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    if (identity.subject !== args.userId) {
      throw new Error("Unauthorized: userId mismatch");
    }

    const gradeResult = (await ctx.runAction(api.grading.gradeOptimized, {
      problemStatement: args.problemStatement,
      studentAnswer: args.finalAnswer,
      reasoning: args.reasoningSteps,
      model: args.model,
      topicName: args.topicName,
      answerFormatInstruction: args.answerFormatInstruction,
      reasoningStepsContext: args.reasoningStepsContext,
    })) as {
      grade: number;
      feedback: string;
      errorType?: string;
      layerDiagnostics?: PipelineDiagnostics;
    };

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
      judgeAlreadyRun: false,
      pipelineDiagnostics: gradeResult.layerDiagnostics
        ? JSON.stringify(gradeResult.layerDiagnostics)
        : undefined,
    })) as Id<"submissions">;

    return {
      ...gradeResult,
      submissionId,
    };
  },
});
