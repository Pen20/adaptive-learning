import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const submitCorrection = mutation({
  args: {
    submissionId: v.id("submissions"),
    correctedGrade: v.number(),
    correctedFeedback: v.string(),
    topicName: v.string(),
    userId: v.string(),
    bypassModeration: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Check if user is admin in DB
    const user = await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    const hasAdminRole = user?.roles?.includes("admin") || user?.role === "admin";
    
    // Status is 'approved' only if user is an admin AND we aren't in student-view (bypassModeration=true)
    const status = (hasAdminRole && args.bypassModeration) ? "approved" : "pending";

    const correctionId = await ctx.db.insert("humanCorrections", {
      submissionId: args.submissionId,
      correctedGrade: args.correctedGrade,
      correctedFeedback: args.correctedFeedback,
      topicName: args.topicName,
      status,
      createdBy: args.userId,
      createdAt: Date.now(),
    });

    return { correctionId, status };
  },
});

export const approveCorrection = mutation({
  args: {
    correctionId: v.id("humanCorrections"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.correctionId, { status: "approved" });
  },
});

export const rejectCorrection = mutation({
  args: {
    correctionId: v.id("humanCorrections"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.correctionId, { status: "rejected" });
  },
});

export const getPendingCorrections = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .first();

    if (!user || (!user.roles?.includes("admin") && user.role !== "admin")) {
      return [];
    }

    return await ctx.db
      .query("humanCorrections")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .order("desc")
      .collect();
  },
});

export const getRecentApprovedCorrections = query({
  args: { limit: v.number() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .first();

    if (!user || (!user.roles?.includes("admin") && user.role !== "admin")) {
      return [];
    }

    return await ctx.db
      .query("humanCorrections")
      .withIndex("by_status", (q) => q.eq("status", "approved"))
      .order("desc")
      .take(args.limit);
  },
});

export const getApprovedCorrectionsForTopic = query({
  args: {
    topicName: v.string(),
    limit: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("humanCorrections")
      .withIndex("by_topic_status", (q) => q.eq("topicName", args.topicName).eq("status", "approved"))
      .order("desc")
      .take(args.limit);
  },
});
