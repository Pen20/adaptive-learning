import { query, mutation } from "./_generated/server";
import { v } from "convex/values";


export const getCourses = query({
  args: {},
  handler: async (ctx) => {
    const courses = await ctx.db.query("courses").collect();
    
    // Fetch counts for all courses in parallel
    const coursesWithCounts = await Promise.all(courses.map(async (c) => {
      const topics = await ctx.db
        .query("topics")
        .withIndex("by_course", (q) => q.eq("courseId", c.courseId))
        .collect();
      
      return {
        ...c,
        _id: c.courseId, // use the slug as the ID for consistency
        databaseId: c._id, 
        topicCount: topics.length
      };
    }));

    return coursesWithCounts;
  },
});

export const getCourseTopics = query({
  args: { courseId: v.string() },
  handler: async (ctx, args) => {
    const topics = await ctx.db
      .query("topics")
      .withIndex("by_course", (q) => q.eq("courseId", args.courseId))
      .collect();

    return topics.map(t => ({
      ...t,
      id: t.topicId, // use the slug as 'id' for consistency with existing URLs
    }));
  },
});

export const getAllTopics = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("topics").collect();
  },
});

export const updateTopicDescription = mutation({
  args: {
    topicId: v.string(),
    description: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const user = await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .first();

    if (!user || (!user.roles?.includes("admin") && user.role !== "admin")) {
      throw new Error("Admin access required");
    }

    const topic = await ctx.db
      .query("topics")
      .withIndex("by_topicId", (q) => q.eq("topicId", args.topicId))
      .first();

    if (!topic) throw new Error(`Topic "${args.topicId}" not found`);

    await ctx.db.patch(topic._id, { description: args.description });
    return { updated: args.topicId };
  },
});

