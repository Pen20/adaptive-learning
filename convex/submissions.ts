import { mutation, query, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

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
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    if (identity.subject !== args.userId) throw new Error("Unauthorized: userId mismatch");

    const judgeStatus = args.judgeAlreadyRun ? "complete" : "pending";
    const { judgeAlreadyRun, ...insertArgs } = args;
    const submissionId = await ctx.db.insert("submissions", { ...insertArgs, judgeStatus });

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

    // Update mastery (always track the topic, increment score only if correct)
    const existingMastery = await ctx.db
      .query("studentMastery")
      .withIndex("by_user_mastery", (q) => q.eq("userId", args.userId).eq("topicName", args.topicName))
      .first();
    
    const scoreIncrement = args.grade === 1 ? 10 : 0;

    if (existingMastery) {
      await ctx.db.patch(existingMastery._id, {
        masteryScore: Math.min(existingMastery.masteryScore + scoreIncrement, 100),
        lastAttempt: Date.now(),
      });
    } else {
      await ctx.db.insert("studentMastery", {
        userId: args.userId,
        topicName: args.topicName,
        masteryScore: scoreIncrement,
        lastAttempt: Date.now(),
      });
    }

    return submissionId;
  },
});

export const getIncorrectSubmissions = query({
  args: {
    userId: v.string(),
    topicName: v.string(),
    limit: v.number(),
  },
  handler: async (ctx, args) => {
    // Note: efficiently querying this requires an index on userId + topic + grade
    // The schema has index "by_user_topic": ["userId", "topicName"]
    // We can use that and filter in memory since user data volume is manageable per topic
    const submissions = await ctx.db
      .query("submissions")
      .withIndex("by_user_topic", (q) => q.eq("userId", args.userId).eq("topicName", args.topicName))
      .filter((q) => q.lt(q.field("grade"), 1)) // Grade < 1 means 0 (incorrect)
      .take(args.limit);
      
    return submissions;
  },
});
export const getStudentMastery = query({
  args: {
    userId: v.string(),
    topicName: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("studentMastery")
      .withIndex("by_user_mastery", (q) => q.eq("userId", args.userId).eq("topicName", args.topicName))
      .first();
  },
});
 
export const getRecentSubmissions = query({
  args: { userId: v.string(), limit: v.number() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("submissions")
      .withIndex("by_user_topic", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(Math.min(args.limit, 50));
  },
});

export const getSubmission = query({
  args: { submissionId: v.id("submissions") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.submissionId);
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
