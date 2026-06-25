import { mutation, query, internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

function getRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

function getString(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function getNumber(value: unknown, fallback: number): number {
  const numeric = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function getStringArray(value: unknown, fallback: string[]): string[] {
  if (!Array.isArray(value)) return fallback;
  const cleaned = value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
  return cleaned.length ? Array.from(new Set(cleaned)) : fallback;
}

function parseDiagnostics(raw: string): Record<string, unknown> {
  return getRecord(JSON.parse(raw));
}

function getGradeCredit(grade: number): number {
  if (!Number.isFinite(grade)) return 0;
  return Math.max(0, Math.min(1, grade));
}

function getMasteryIncrementForGrade(grade: number): number {
  if (grade >= 1) return 10;
  if (grade >= 0.5) return 3;
  return 0;
}

export const saveSubmission = mutation({
  args: {
    userId: v.string(),
    courseName: v.union(v.literal("Linear Algebra"), v.literal("Differential Calculus")),
    topicName: v.string(),
    problemStatement: v.string(),
    finalAnswer: v.string(),
    reasoningSteps: v.string(),
    grade: v.number(),
    aiFeedback: v.string(),
    judgeFeedback: v.optional(v.string()),
    isJudgeModified: v.optional(v.boolean()),
    judgeConfidence: v.optional(v.number()),
    errorType: v.optional(v.string()),
    usedHints: v.boolean(),
    judgeAlreadyRun: v.optional(v.boolean()),
    pipelineDiagnostics: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    if (identity.subject !== args.userId) throw new Error("Unauthorized: userId mismatch");

    const judgeStatus = args.judgeAlreadyRun ? "complete" : "pending";
    const { judgeAlreadyRun, pipelineDiagnostics, ...insertArgs } = args;
    void judgeAlreadyRun;
    void pipelineDiagnostics;

    // Approach 4 — snapshot mastery BEFORE this submission updates it
    const preMastery = await ctx.db
      .query("studentMastery")
      .withIndex("by_user_mastery", (q) =>
        q.eq("userId", args.userId).eq("topicName", args.topicName)
      )
      .first();
    const masteryBefore = preMastery?.masteryScore ?? 0;

    // Approach 4 — find the immediately preceding submission to backfill its outcomeReward
    const prevSubmission = await ctx.db
      .query("submissions")
      .withIndex("by_user_topic", (q) =>
        q.eq("userId", args.userId).eq("topicName", args.topicName)
      )
      .order("desc")
      .first();

    const submissionId = await ctx.db.insert("submissions", { ...insertArgs, judgeStatus, masteryBefore });
    const now = Date.now();
    const gradeCredit = getGradeCredit(args.grade);
    const scoreIncrement = getMasteryIncrementForGrade(args.grade);

    // Schedule background judge only when it hasn't been run inline already
    if (!args.judgeAlreadyRun) {
      await ctx.scheduler.runAfter(0, internal.grading.runJudgeForSubmission, {
        submissionId,
        problemStatement: args.problemStatement,
        studentAnswer: args.finalAnswer,
        reasoning: args.reasoningSteps,
        grade: args.grade,
        feedback: args.aiFeedback,
        topicName: args.topicName,
      });
    }

    const existingStats = await ctx.db
      .query("studentTopicStats")
      .withIndex("by_user_topic", (q) =>
        q.eq("userId", args.userId).eq("topicName", args.topicName)
      )
      .first();

    if (existingStats) {
      await ctx.db.patch(existingStats._id, {
        total: existingStats.total + 1,
        correct: existingStats.correct + gradeCredit,
        lastAttempt: now,
      });
    } else {
      await ctx.db.insert("studentTopicStats", {
        userId: args.userId,
        topicName: args.topicName,
        total: 1,
        correct: gradeCredit,
        lastAttempt: now,
      });
    }

    // Approach 4 — backfill outcomeReward on previous submission now that we know masteryBefore (= masteryAfter for prev)
    if (prevSubmission && prevSubmission.masteryBefore !== undefined) {
      const outcomeReward = masteryBefore - prevSubmission.masteryBefore;
      await ctx.db.patch(prevSubmission._id, { outcomeReward });
    }

    // Update mastery — reuse preMastery to avoid a redundant query
    if (preMastery) {
      await ctx.db.patch(preMastery._id, {
        masteryScore: Math.min(preMastery.masteryScore + scoreIncrement, 100),
        lastAttempt: now,
      });
    } else {
      await ctx.db.insert("studentMastery", {
        userId: args.userId,
        topicName: args.topicName,
        masteryScore: scoreIncrement,
        lastAttempt: now,
      });
    }

    if (args.pipelineDiagnostics) {
      try {
        const diagnostics = parseDiagnostics(args.pipelineDiagnostics);
        const aiLayer = getRecord(diagnostics.aiLayer);
        const didacticLayer = getRecord(diagnostics.didacticLayer);
        const profileUpdate = getRecord(didacticLayer.profileUpdate);
        const conceptTags = getStringArray(
          didacticLayer.conceptTags,
          getStringArray(aiLayer.conceptTags, [args.topicName]),
        );
        const techniqueUsed = getString(
          aiLayer.techniqueUsed,
          getString(profileUpdate.techniquePracticed, ""),
        );
        const misconception = getString(
          aiLayer.misconception,
          getStringArray(profileUpdate.misconceptionTags, [])[0] ?? "",
        );

        await ctx.db.insert("submissionDiagnostics", {
          submissionId,
          userId: args.userId,
          topicName: args.topicName,
          casLayer: JSON.stringify(getRecord(diagnostics.casLayer)),
          aiLayer: JSON.stringify(aiLayer),
          didacticLayer: JSON.stringify(didacticLayer),
          techniqueUsed: techniqueUsed || undefined,
          misconception: misconception || undefined,
          conceptTags,
          createdAt: now,
        });

        const masteryDelta = getNumber(profileUpdate.masteryDelta, scoreIncrement);
        const recommendedNextTask = getString(
          profileUpdate.recommendedNextTask,
          "",
        );
        const misconceptionTags = getStringArray(
          profileUpdate.misconceptionTags,
          misconception ? [misconception] : [],
        );

        for (const conceptTag of conceptTags) {
          const existingConcept = await ctx.db
            .query("studentLearningProfile")
            .withIndex("by_user_topic_concept", (q) =>
              q
                .eq("userId", args.userId)
                .eq("topicName", args.topicName)
                .eq("conceptTag", conceptTag),
            )
            .first();

          if (existingConcept) {
            await ctx.db.patch(existingConcept._id, {
              masteryScore: Math.max(
                0,
                Math.min(100, existingConcept.masteryScore + masteryDelta),
              ),
              misconceptionCount:
                existingConcept.misconceptionCount +
                (misconceptionTags.length > 0 ? 1 : 0),
              techniqueCount: existingConcept.techniqueCount + 1,
              lastTechnique: techniqueUsed || existingConcept.lastTechnique,
              lastMisconception:
                misconceptionTags[0] || existingConcept.lastMisconception,
              recommendedNextTask:
                recommendedNextTask || existingConcept.recommendedNextTask,
              lastSeen: now,
            });
          } else {
            await ctx.db.insert("studentLearningProfile", {
              userId: args.userId,
              topicName: args.topicName,
              conceptTag,
              masteryScore: Math.max(0, Math.min(100, masteryDelta)),
              misconceptionCount: misconceptionTags.length > 0 ? 1 : 0,
              techniqueCount: 1,
              lastTechnique: techniqueUsed || undefined,
              lastMisconception: misconceptionTags[0] || undefined,
              recommendedNextTask: recommendedNextTask || undefined,
              lastSeen: now,
            });
          }
        }
      } catch (error) {
        console.error("Could not persist pipeline diagnostics", error);
      }
    }

    return submissionId;
  },
});

export const getIncorrectSubmissions = query({
  args: {
    topicName: v.string(),
    limit: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const submissions = await ctx.db
      .query("submissions")
      .withIndex("by_user_topic_grade", (q) =>
        q
          .eq("userId", identity.subject)
          .eq("topicName", args.topicName)
          .lt("grade", 1)
      )
      .take(args.limit);
      
    return submissions;
  },
});
export const getStudentMastery = query({
  args: {
    topicName: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    return await ctx.db
      .query("studentMastery")
      .withIndex("by_user_mastery", (q) =>
        q.eq("userId", identity.subject).eq("topicName", args.topicName)
      )
      .first();
  },
});
 
export const getRecentSubmissions = query({
  args: { limit: v.number() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    return await ctx.db
      .query("submissions")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .order("desc")
      .take(Math.min(args.limit, 50));
  },
});

// Per-topic summary stats for the history panel
export const getTopicSubmissionStats = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const precomputed = await ctx.db
      .query("studentTopicStats")
      .withIndex("by_user_lastAttempt", (q) => q.eq("userId", identity.subject))
      .order("desc")
      .take(100);

    if (precomputed.length > 0) {
      return precomputed.map((stat) => ({
        topic: stat.topicName,
        total: stat.total,
        correct: stat.correct,
        lastAttempt: stat.lastAttempt,
      }));
    }

    const all = await ctx.db
      .query("submissions")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .order("desc")
      .take(500);

    const map: Record<string, { topic: string; total: number; correct: number; lastAttempt: number }> = {};
    for (const s of all) {
      if (!map[s.topicName]) {
        map[s.topicName] = { topic: s.topicName, total: 0, correct: 0, lastAttempt: 0 };
      }
      map[s.topicName].total++;
      map[s.topicName].correct += getGradeCredit(s.grade);
      if (s._creationTime > map[s.topicName].lastAttempt) {
        map[s.topicName].lastAttempt = s._creationTime;
      }
    }
    return Object.values(map).sort((a, b) => b.lastAttempt - a.lastAttempt);
  },
});

// Submissions for a specific topic (or all topics when topicName is empty)
export const getSubmissionsByTopic = query({
  args: { topicName: v.string(), limit: v.number() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    if (args.topicName) {
      return await ctx.db
        .query("submissions")
        .withIndex("by_user_topic", (q) =>
          q.eq("userId", identity.subject).eq("topicName", args.topicName)
        )
        .order("desc")
        .take(Math.min(args.limit, 100));
    }
    return await ctx.db
      .query("submissions")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .order("desc")
      .take(Math.min(args.limit, 100));
  },
});

export const getSubmission = query({
  args: { submissionId: v.id("submissions") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const submission = await ctx.db.get(args.submissionId);
    if (!submission || submission.userId !== identity.subject) return null;

    return submission;
  },
});

export const patchSubmissionWithJudge = internalMutation({
  args: {
    submissionId: v.id("submissions"),
    grade: v.number(),
    feedback: v.string(),
    errorType: v.string(),
    judgeFeedback: v.string(),
    isJudgeModified: v.boolean(),
    judgeConfidence: v.number(),
  },
  handler: async (ctx, args) => {
    const { submissionId, ...patch } = args;
    await ctx.db.patch(submissionId, { ...patch, judgeStatus: "complete" });
  },
});

// Approach 4 — returns top-N submissions by outcomeReward for a topic, across all users.
// Used by gradeOptimized to inject outcome-validated feedback styles as few-shot examples.
export const getHighRewardSubmissions = internalQuery({
  args: {
    topicName: v.string(),
    minReward: v.number(),
    limit: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("submissions")
      .withIndex("by_topic_outcome", (q) =>
        q.eq("topicName", args.topicName).gte("outcomeReward", args.minReward)
      )
      .order("desc")
      .take(Math.min(args.limit, 5));
  },
});
