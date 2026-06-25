import { action, internalAction, internalMutation, internalQuery, query, mutation } from "./_generated/server";
import type { GenericActionCtx } from "convex/server";
import type { DataModel, Id } from "./_generated/dataModel";
import { v } from "convex/values";
import { api, internal } from "./_generated/api";

// ─── Internal helpers ──────────────────────────────────────────────────────────

export const getSubmissionForEval = internalQuery({
  args: { submissionId: v.id("submissions") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.submissionId);
  },
});

export const storePhase1EvalResult = internalMutation({
  args: {
    submissionId: v.id("submissions"),
    topicName: v.string(),
    problemStatement: v.string(),
    studentAnswer: v.string(),
    studentReasoning: v.string(),
    originalGrade: v.number(),
    spGrade: v.number(),
    spJudgeConfidence: v.number(),
    spIsJudgeModified: v.boolean(),
    spErrorType: v.string(),
    spFeedback: v.string(),
    bonGrade: v.number(),
    bonJudgeConfidence: v.number(),
    bonIsJudgeModified: v.boolean(),
    bonSelectedIndex: v.number(),
    bonAllConfidences: v.array(v.number()),
    bonErrorType: v.string(),
    bonFeedback: v.string(),
    casIsComputable: v.boolean(),
    casGroundTruth: v.optional(v.string()),
    casSpAgrees: v.optional(v.boolean()),
    casBonAgrees: v.optional(v.boolean()),
    gradesAgree: v.boolean(),
    confidenceDelta: v.number(),
    model: v.string(),
  },
  handler: async (ctx, args) => {
    // Remove any previous eval for this submission so the table stays clean
    const existing = await ctx.db
      .query("phase1Evaluations")
      .withIndex("by_submission", (q) => q.eq("submissionId", args.submissionId))
      .first();
    if (existing) await ctx.db.delete(existing._id);

    return await ctx.db.insert("phase1Evaluations", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

// ─── Core evaluation action (one submission) ──────────────────────────────────

type SpGradeResult = {
  grade: number;
  feedback: string;
  errorType?: string;
  judgeMetadata?: { judgeConfidence: number; isJudgeModified: boolean; judgeFeedback: string };
};
type BonGradeResult = {
  grade: number;
  feedback: string;
  errorType?: string;
  bestOfNMetadata?: {
    selectedIndex: number;
    selectedJudgeConfidence: number;
    allCandidates: Array<{ judgeConfidence: number; isJudgeModified: boolean }>;
  };
};
type CasResult = { isComputable: boolean; groundTruth: string | null };
type Phase1EvalResult = {
  submissionId: string;
  spConfidence: number;
  bonConfidence: number;
  confidenceDelta: number;
  gradesAgree: boolean;
};

async function runPhase1EvalHandler(
  ctx: GenericActionCtx<DataModel>,
  args: { submissionId: Id<"submissions">; model: string },
): Promise<Phase1EvalResult> {
  const submission = await ctx.runQuery(
    internal.evaluation.getSubmissionForEval,
    { submissionId: args.submissionId },
  );
  if (!submission) throw new Error(`Submission not found: ${args.submissionId}`);

  const gradingArgs = {
    problemStatement: submission.problemStatement,
    studentAnswer: submission.finalAnswer,
    reasoning: submission.reasoningSteps,
    model: args.model,
    topicName: submission.topicName,
  };

  const [spResult, bonResult, casResult] = await Promise.all([
    ctx.runAction(api.grading.gradeWithJudge, gradingArgs) as unknown as SpGradeResult,
    ctx.runAction(api.grading.gradeBestOfN, gradingArgs) as unknown as BonGradeResult,
    ctx.runAction(internal.cas.computeGroundTruth, {
      problemStatement: submission.problemStatement,
      topicName: submission.topicName,
    }) as unknown as CasResult,
  ]);

  const spConfidence = spResult.judgeMetadata?.judgeConfidence ?? 0;
  const bonConfidence = bonResult.bestOfNMetadata?.selectedJudgeConfidence ?? 0;
  const bonSelectedIdx = bonResult.bestOfNMetadata?.selectedIndex ?? 0;
  const bonAllConfidences =
    bonResult.bestOfNMetadata?.allCandidates.map((c: { judgeConfidence: number }) => c.judgeConfidence) ?? [];
  const bonSelectedModified =
    bonResult.bestOfNMetadata?.allCandidates[bonSelectedIdx]?.isJudgeModified ?? false;

  let casSpAgrees: boolean | undefined;
  let casBonAgrees: boolean | undefined;
  if (casResult.isComputable) {
    casSpAgrees = spResult.grade >= 0.5;
    casBonAgrees = bonResult.grade >= 0.5;
  }

  await ctx.runMutation(internal.evaluation.storePhase1EvalResult, {
    submissionId: args.submissionId,
    topicName: submission.topicName,
    problemStatement: submission.problemStatement,
    studentAnswer: submission.finalAnswer,
    studentReasoning: submission.reasoningSteps,
    originalGrade: submission.grade,
    spGrade: spResult.grade,
    spJudgeConfidence: spConfidence,
    spIsJudgeModified: spResult.judgeMetadata?.isJudgeModified ?? false,
    spErrorType: spResult.errorType ?? "",
    spFeedback: spResult.feedback,
    bonGrade: bonResult.grade,
    bonJudgeConfidence: bonConfidence,
    bonIsJudgeModified: bonSelectedModified,
    bonSelectedIndex: bonSelectedIdx,
    bonAllConfidences,
    bonErrorType: bonResult.errorType ?? "",
    bonFeedback: bonResult.feedback,
    casIsComputable: casResult.isComputable,
    casGroundTruth: casResult.groundTruth ?? undefined,
    casSpAgrees,
    casBonAgrees,
    gradesAgree: spResult.grade === bonResult.grade,
    confidenceDelta: bonConfidence - spConfidence,
    model: args.model,
  });

  return {
    submissionId: args.submissionId,
    spConfidence,
    bonConfidence,
    confidenceDelta: bonConfidence - spConfidence,
    gradesAgree: spResult.grade === bonResult.grade,
  };
}

export const runPhase1EvalForSubmission = internalAction({
  args: {
    submissionId: v.id("submissions"),
    model: v.string(),
  },
  handler: runPhase1EvalHandler,
});

// ─── Batch runner — processes submissions sequentially to avoid rate limits ───

export const runPhase1EvalBatch = action({
  args: {
    submissionIds: v.array(v.id("submissions")),
    model: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const model = args.model ?? "gemini-2.5-flash";
    const results: Array<{
      submissionId: string;
      status: string;
      spConfidence?: number;
      bonConfidence?: number;
      confidenceDelta?: number;
      gradesAgree?: boolean;
      error?: string;
    }> = [];

    for (const submissionId of args.submissionIds) {
      try {
        const result = await ctx.runAction(
          internal.evaluation.runPhase1EvalForSubmission,
          { submissionId, model },
        );
        results.push({ ...result, submissionId, status: "ok" });
        console.log(
          `[eval] ${submissionId} — SP: ${result.spConfidence.toFixed(2)} | BoN: ${result.bonConfidence.toFixed(2)} | Δ: ${result.confidenceDelta.toFixed(2)}`,
        );
      } catch (err: any) {
        console.error(`[eval] failed for ${submissionId}:`, err.message);
        results.push({ submissionId, status: "error", error: err.message });
      }
    }

    const successful = results.filter((r) => r.status === "ok");
    const meanSpConfidence =
      successful.reduce((s, r) => s + (r.spConfidence ?? 0), 0) / (successful.length || 1);
    const meanBonConfidence =
      successful.reduce((s, r) => s + (r.bonConfidence ?? 0), 0) / (successful.length || 1);
    const gradeAgreementRate =
      successful.filter((r) => r.gradesAgree).length / (successful.length || 1);

    return {
      total: args.submissionIds.length,
      successful: successful.length,
      failed: results.filter((r) => r.status === "error").length,
      meanSpConfidence,
      meanBonConfidence,
      meanConfidenceDelta: meanBonConfidence - meanSpConfidence,
      gradeAgreementRate,
      results,
    };
  },
});

// ─── Helper: pick a balanced test set from existing submissions ───────────────

export const selectEvalSubmissions = action({
  args: {
    topicNames: v.array(v.string()),
    perTopicLimit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.perTopicLimit ?? 15;
    const allIds: string[] = [];

    for (const topicName of args.topicNames) {
      const pool = (await ctx.runQuery(
        internal.evaluation.getSubmissionsForTopic,
        { topicName, limit: limit * 5 },
      )) as Array<{ _id: string; grade: number }>;

      // Stratify: equal thirds correct / partial / incorrect
      const perStratum = Math.floor(limit / 3);
      const selected = [
        ...pool.filter((s) => s.grade === 1).slice(0, perStratum),
        ...pool.filter((s) => s.grade === 0.5).slice(0, perStratum),
        ...pool.filter((s) => s.grade === 0).slice(0, perStratum),
      ];

      allIds.push(...selected.map((s) => s._id));
    }

    return allIds;
  },
});

export const getSubmissionsForTopic = internalQuery({
  args: { topicName: v.string(), limit: v.number() },
  handler: async (ctx, args) => {
    // Full table scan filtered by topicName — acceptable for a one-time evaluation script
    return await ctx.db
      .query("submissions")
      .filter((q) => q.eq(q.field("topicName"), args.topicName))
      .order("desc")
      .take(args.limit);
  },
});

// ─── Query: read results for analysis ─────────────────────────────────────────

export const getPhase1EvalResults = query({
  args: { topicName: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const rows = args.topicName
      ? await ctx.db
          .query("phase1Evaluations")
          .withIndex("by_topic", (q) => q.eq("topicName", args.topicName!))
          .collect()
      : await ctx.db
          .query("phase1Evaluations")
          .withIndex("by_created", (q) => q.gt("createdAt", 0))
          .order("desc")
          .take(500);

    return rows;
  },
});

export const getPhase1EvalSummary = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const rows = await ctx.db
      .query("phase1Evaluations")
      .withIndex("by_created", (q) => q.gt("createdAt", 0))
      .collect();

    if (rows.length === 0) return null;

    const n = rows.length;
    const meanSp = rows.reduce((s, r) => s + r.spJudgeConfidence, 0) / n;
    const meanBon = rows.reduce((s, r) => s + r.bonJudgeConfidence, 0) / n;
    const meanDelta = rows.reduce((s, r) => s + r.confidenceDelta, 0) / n;

    const spModifiedRate = rows.filter((r) => r.spIsJudgeModified).length / n;
    const bonModifiedRate = rows.filter((r) => r.bonIsJudgeModified).length / n;
    const gradeAgreementRate = rows.filter((r) => r.gradesAgree).length / n;

    const casRows = rows.filter((r) => r.casIsComputable);
    const casN = casRows.length;

    // Variance for confidence delta (for paired t-test reporting)
    const deltas = rows.map((r) => r.confidenceDelta);
    const meanDeltaVal = deltas.reduce((s, d) => s + d, 0) / n;
    const variance = deltas.reduce((s, d) => s + (d - meanDeltaVal) ** 2, 0) / (n - 1);
    const stdDev = Math.sqrt(variance);
    const tStat = meanDeltaVal / (stdDev / Math.sqrt(n));

    const byTopic: Record<string, {
      n: number; meanSpConfidence: number; meanBonConfidence: number; meanDelta: number;
    }> = {};
    for (const row of rows) {
      if (!byTopic[row.topicName]) {
        byTopic[row.topicName] = { n: 0, meanSpConfidence: 0, meanBonConfidence: 0, meanDelta: 0 };
      }
      byTopic[row.topicName].n++;
      byTopic[row.topicName].meanSpConfidence += row.spJudgeConfidence;
      byTopic[row.topicName].meanBonConfidence += row.bonJudgeConfidence;
      byTopic[row.topicName].meanDelta += row.confidenceDelta;
    }
    for (const t of Object.keys(byTopic)) {
      const nt = byTopic[t].n;
      byTopic[t].meanSpConfidence /= nt;
      byTopic[t].meanBonConfidence /= nt;
      byTopic[t].meanDelta /= nt;
    }

    return {
      n,
      meanSpConfidence: meanSp,
      meanBonConfidence: meanBon,
      meanConfidenceDelta: meanDelta,
      stdDevDelta: stdDev,
      tStatistic: tStat,
      spModifiedRate,
      bonModifiedRate,
      gradeAgreementRate,
      casN,
      byTopic,
    };
  },
});

// ─── Mutation: record human preference for a pair ─────────────────────────────

export const recordHumanPreference = mutation({
  args: {
    evalId: v.id("phase1Evaluations"),
    preference: v.union(v.literal("single"), v.literal("bon"), v.literal("tie")),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    await ctx.db.patch(args.evalId, {
      humanPreference: args.preference,
      humanRaterNotes: args.notes,
    });
  },
});
