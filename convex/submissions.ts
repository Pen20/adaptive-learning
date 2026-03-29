import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

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
  },
  handler: async (ctx, args) => {
    // Check for existing user logic could go here if needed to link strictly to internal ID
    // For now we just store the submission with the Clerk User ID as per schema
    const submissionId = await ctx.db.insert("submissions", args);
    
    // Update mastery (always track the topic, increment score only if correct)
    const existingMastery = await ctx.db
      .query("studentMastery")
      .withIndex("by_user_mastery", (q) => q.eq("userId", args.userId)) 
      .filter((q) => q.eq(q.field("topicName"), args.topicName))
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
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .filter((q) => q.eq(q.field("topicName"), args.topicName))
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
      .take(args.limit);
  },
});
