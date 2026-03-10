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
    
    // Update mastery (simple logic: increment if correct)
    if (args.grade === 1) {
       const existingMastery = await ctx.db
         .query("studentMastery")
         .withIndex("by_user_mastery", (q) => q.eq("userId", args.userId)) 
         .filter((q) => q.eq(q.field("topicName"), args.topicName))
         .first();
       
       if (existingMastery) {
         await ctx.db.patch(existingMastery._id, {
           masteryScore: existingMastery.masteryScore + 10,
           lastAttempt: Date.now(),
         });
       } else {
         await ctx.db.insert("studentMastery", {
           userId: args.userId,
           topicName: args.topicName,
           masteryScore: 10,
           lastAttempt: Date.now(),
         });
       }
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
