import { query } from "./_generated/server";
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

