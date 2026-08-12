import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { findActiveAssignment } from "./experiment";

type Activity = {
  id: string;
  stage: "concept_activation" | "guided_correction" | "focused_check" | "transfer_task" | "reflection";
  title: string;
  prompt: string;
  responseType: "choice" | "text";
  options?: string[];
  expectedAnswer?: string;
  successFeedback: string;
  retryFeedback: string;
};

function asRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

function asString(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function normalizeAnswer(value: string) {
  return value.toLowerCase().replace(/\s+/g, "").replace(/\\/g, "");
}

function buildActivities(
  misconceptionId: string,
  remediationPrompt: string,
): Activity[] {
  const targeted: Record<string, Activity[]> = {
    "DET-M1": [
      {
        id: "concept-minor",
        stage: "concept_activation",
        title: "Reconstruct a minor",
        prompt: "To form the minor of an entry, what must you remove from the original matrix?",
        responseType: "choice",
        options: ["Its row and its column", "Only its row", "Only its column"],
        expectedAnswer: "Its row and its column",
        successFeedback: "Exactly. The remaining entries form the minor.",
        retryFeedback: "A minor removes both coordinates of the selected entry: its row and its column.",
      },
    ],
    "DET-M2": [
      {
        id: "concept-sign",
        stage: "concept_activation",
        title: "Activate the cofactor sign pattern",
        prompt: "In the first row, which cofactor sign pattern is correct?",
        responseType: "choice",
        options: ["+, −, +", "+, +, −", "−, +, −"],
        expectedAnswer: "+, −, +",
        successFeedback: "Correct. Cofactor signs alternate in a checkerboard pattern.",
        retryFeedback: "Start with a positive sign at position (1,1), then alternate signs.",
      },
    ],
    "DET-M3": [
      {
        id: "concept-2x2",
        stage: "concept_activation",
        title: "Recall the two-by-two determinant",
        prompt: "For [[a,b],[c,d]], which expression gives the determinant?",
        responseType: "choice",
        options: ["ad − bc", "ad + bc", "ac − bd"],
        expectedAnswer: "ad − bc",
        successFeedback: "Correct. Multiply the main diagonal and subtract the other diagonal product.",
        retryFeedback: "Use the main diagonal product first, then subtract the other diagonal product.",
      },
    ],
    "DET-M4": [
      {
        id: "concept-singular",
        stage: "concept_activation",
        title: "Connect determinant and singularity",
        prompt: "A square matrix is singular under which condition?",
        responseType: "choice",
        options: ["det(A) = 0", "det(A) ≠ 0", "det(A) = 1"],
        expectedAnswer: "det(A) = 0",
        successFeedback: "Correct. A zero determinant characterizes a singular matrix.",
        retryFeedback: "A singular matrix is not invertible, which corresponds to a zero determinant.",
      },
    ],
    "DET-M6": [
      {
        id: "complete-singularity",
        stage: "concept_activation",
        title: "Complete the singularity argument",
        prompt: "Once you have a correct determinant expression, what condition must you impose for the matrix to be singular?",
        responseType: "choice",
        options: ["Set the determinant equal to zero", "Make the determinant non-zero", "Set the determinant equal to one"],
        expectedAnswer: "Set the determinant equal to zero",
        successFeedback: "Correct. Now apply that condition to your determinant expression and solve for the parameter.",
        retryFeedback: "A singular matrix has determinant zero.",
      },
    ],
  };

  const activation = targeted[misconceptionId] ?? targeted["DET-M3"];
  return [
    ...activation,
    {
      id: "repair-original-step",
      stage: "guided_correction",
      title: "Correct your original reasoning",
      prompt: remediationPrompt || "Rewrite only the first incorrect determinant step and explain why the correction is valid.",
      responseType: "text",
      successFeedback: "Your corrected step is recorded. Now isolate the underlying skill.",
      retryFeedback: "Show a mathematical expression and a short justification before continuing.",
    },
    {
      id: "focused-check",
      stage: "focused_check",
      title: "Focused check",
      prompt: "Compute det([[3,2],[1,4]]).",
      responseType: "text",
      expectedAnswer: "10",
      successFeedback: "Correct: 3×4 − 2×1 = 10.",
      retryFeedback: "Use ad − bc: multiply both diagonals, then subtract.",
    },
    {
      id: "transfer-task",
      stage: "transfer_task",
      title: "Transfer to a new case",
      prompt: "Find k so that [[2,3],[4,k]] is singular.",
      responseType: "text",
      expectedAnswer: "6",
      successFeedback: "Correct. You transferred the determinant condition to a new matrix.",
      retryFeedback: "Set 2k − 12 equal to zero, then solve for k.",
    },
    {
      id: "reflection",
      stage: "reflection",
      title: "Make the strategy reusable",
      prompt: "In one sentence, what will you check first next time you solve a determinant problem?",
      responseType: "text",
      successFeedback: "Good. Naming your check makes the strategy easier to reuse.",
      retryFeedback: "Write one concrete check, such as signs, minors, row-operation effects, or the singularity condition.",
    },
  ];
}

export const startRemediation = mutation({
  args: { submissionId: v.id("submissions") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const submission = await ctx.db.get(args.submissionId);
    if (!submission || submission.userId !== identity.subject) {
      throw new Error("Submission not found");
    }
    if (submission.topicName !== "determinants") {
      throw new Error("Guided remediation is currently available for Determinants only.");
    }
    const studyAssignment = await findActiveAssignment(
      ctx,
      identity.subject,
      submission.topicName,
    );
    if (studyAssignment) {
      throw new Error("Guided remediation is unavailable during the controlled study session.");
    }

    const existing = await ctx.db
      .query("remediationSessions")
      .withIndex("by_user_submission", (q) =>
        q.eq("userId", identity.subject).eq("submissionId", args.submissionId),
      )
      .first();
    if (existing) return existing._id;

    const diagnostics = await ctx.db
      .query("submissionDiagnostics")
      .withIndex("by_submission", (q) => q.eq("submissionId", args.submissionId))
      .first();
    if (!diagnostics) throw new Error("Pedagogical diagnosis is not available.");
    const aiLayer = asRecord(JSON.parse(diagnostics.aiLayer));
    const evaluation = asRecord(aiLayer.pedagogicalEvaluation);
    const ficheId = asString(evaluation.ficheId, "determinants-evaluation");
    const ficheVersion = asString(evaluation.ficheVersion, "1.1.0");
    const taskTypeId = asString(evaluation.taskTypeId, "DET-COMPUTE-3X3");
    const techniqueId = asString(evaluation.techniqueId, "unidentified-technique");
    const misconceptionId = asString(evaluation.misconceptionId, "DET-M3");
    const misconceptionLabel = asString(evaluation.misconceptionLabel, diagnostics.misconception ?? "Determinant reasoning error");
    const activities = buildActivities(
      misconceptionId,
      asString(evaluation.remediationPrompt),
    );

    return await ctx.db.insert("remediationSessions", {
      userId: identity.subject,
      submissionId: args.submissionId,
      topicName: submission.topicName,
      ficheId,
      ficheVersion,
      taskTypeId,
      techniqueId,
      misconceptionId,
      misconceptionLabel,
      activitiesJson: JSON.stringify(activities),
      responsesJson: "[]",
      currentActivityIndex: 0,
      successfulChecks: 0,
      status: "in_progress",
      startedAt: Date.now(),
    });
  },
});

export const getRemediationState = query({
  args: { sessionId: v.id("remediationSessions") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    const session = await ctx.db.get(args.sessionId);
    if (!session || session.userId !== identity.subject) return null;
    const activities = JSON.parse(session.activitiesJson) as Activity[];
    const activity = activities[session.currentActivityIndex] ?? null;
    return {
      sessionId: session._id,
      status: session.status,
      misconceptionLabel: session.misconceptionLabel,
      techniqueId: session.techniqueId,
      progress: { current: Math.min(session.currentActivityIndex + 1, activities.length), total: activities.length },
      activity: activity
        ? { id: activity.id, stage: activity.stage, title: activity.title, prompt: activity.prompt, responseType: activity.responseType, options: activity.options }
        : null,
    };
  },
});

export const submitRemediationResponse = mutation({
  args: { sessionId: v.id("remediationSessions"), response: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    const session = await ctx.db.get(args.sessionId);
    if (!session || session.userId !== identity.subject) throw new Error("Session not found");
    if (session.status === "completed") return { correct: true, completed: true, feedback: "Remediation already completed." };

    const activities = JSON.parse(session.activitiesJson) as Activity[];
    const activity = activities[session.currentActivityIndex];
    if (!activity) throw new Error("Activity not found");
    const response = args.response.trim();
    const correct = activity.expectedAnswer
      ? normalizeAnswer(response).includes(normalizeAnswer(activity.expectedAnswer))
      : response.length >= 12;
    const previousResponses = JSON.parse(session.responsesJson) as unknown[];
    const responses = [...previousResponses, { activityId: activity.id, response, correct, at: Date.now() }];

    if (!correct) {
      await ctx.db.patch(session._id, { responsesJson: JSON.stringify(responses) });
      return { correct: false, completed: false, feedback: activity.retryFeedback };
    }

    const nextIndex = session.currentActivityIndex + 1;
    const completed = nextIndex >= activities.length;
    await ctx.db.patch(session._id, {
      responsesJson: JSON.stringify(responses),
      currentActivityIndex: nextIndex,
      successfulChecks: session.successfulChecks + 1,
      status: completed ? "completed" : "in_progress",
      completedAt: completed ? Date.now() : undefined,
    });

    if (completed) {
      const mastery = await ctx.db
        .query("studentMastery")
        .withIndex("by_user_mastery", (q) =>
          q.eq("userId", identity.subject).eq("topicName", session.topicName),
        )
        .first();
      if (mastery) {
        await ctx.db.patch(mastery._id, {
          masteryScore: Math.min(100, mastery.masteryScore + 5),
          lastAttempt: Date.now(),
        });
      }
    }

    return { correct: true, completed, feedback: activity.successFeedback };
  },
});
