import { query } from "./_generated/server";

export const getCounts = query({
  args: {},
  handler: async (ctx) => {
    const topics = await ctx.db.query("topics").collect();
    const courses = await ctx.db.query("courses").collect();
    return {
      topicCount: topics.length,
      topics: topics.map(t => ({ id: t.topicId, title: t.title, course: t.courseId, chapter: t.chapter })),
      courseCount: courses.length,
    };
  },
});
