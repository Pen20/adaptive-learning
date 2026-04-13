import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getUser = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();
  },
});

export const getUserMastery = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("studentMastery")
      .withIndex("by_user_mastery", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

export const updateMastery = mutation({
  args: {
    userId: v.string(),
    topicName: v.string(),
    scoreIncrement: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    if (identity.subject !== args.userId) throw new Error("Unauthorized");

    const existing = await ctx.db
      .query("studentMastery")
      .withIndex("by_user_mastery", (q) => q.eq("userId", args.userId).eq("topicName", args.topicName))
      .first();

    const now = Date.now();

    if (existing) {
      // Cap at 100
      const newScore = Math.min(existing.masteryScore + args.scoreIncrement, 100);
      await ctx.db.patch(existing._id, {
        masteryScore: newScore,
        lastAttempt: now,
      });
    } else {
      await ctx.db.insert("studentMastery", {
        userId: args.userId,
        topicName: args.topicName,
        masteryScore: Math.min(args.scoreIncrement, 100), // Initial score
        lastAttempt: now,
      });
    }
  },
});

export const createUser = mutation({
  args: {
    userId: v.string(),
    firstName: v.string(),
    surname: v.string(),
    email: v.string(),
    birthDay: v.string(),
    institutionName: v.string(),
    roles: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    if (existingUser) {
      return existingUser._id;
    }

    const newUserId = await ctx.db.insert("users", {
      userId: args.userId,
      firstName: args.firstName,
      surname: args.surname,
      email: args.email,
      birthDay: args.birthDay,
      institutionName: args.institutionName,
      roles: args.roles ?? ["student"],
    });

    return newUserId;
  },
});

export const updateUser = mutation({
  args: {
    userId: v.string(),
    firstName: v.optional(v.string()),
    surname: v.optional(v.string()),
    email: v.optional(v.string()),
    birthDay: v.optional(v.string()),
    institutionName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    if (!existingUser) {
      console.warn(`User ${args.userId} not found for update`);
      return;
    }

    const updates: any = {};
    if (args.firstName !== undefined) updates.firstName = args.firstName;
    if (args.surname !== undefined) updates.surname = args.surname;
    if (args.email !== undefined) updates.email = args.email;
    if (args.birthDay !== undefined) updates.birthDay = args.birthDay;
    if (args.institutionName !== undefined) updates.institutionName = args.institutionName;

    await ctx.db.patch(existingUser._id, updates);
  },
});

export const deleteUser = mutation({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    if (!existingUser) {
      console.warn(`User ${args.userId} not found for deletion`);
      return;
    }

    await ctx.db.delete(existingUser._id);
  },
});

export const syncUser = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Called syncUser without authentication present");
    }

    const userId = identity.subject;

    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    if (existingUser) return existingUser._id;

    // Map Clerk fields to our schema
    const newUserId = await ctx.db.insert("users", {
      userId,
      firstName: identity.givenName || "",
      surname: identity.familyName || "",
      email: identity.email || "",
      birthDay: "", 
      institutionName: "",
      roles: ["student"],
    });

    return newUserId;
  },
});

export const updateLastActive = mutation({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();
    if (user) {
      await ctx.db.patch(user._id, { lastActive: Date.now() });
    }
  },
});

export const getStudentAnalytics = query({
  args: {},
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

    const students = await ctx.db
      .query("users")
      .collect();

    const analytics = await Promise.all(
      students.map(async (student) => {
        // Topics attempted
        const mastery = await ctx.db
          .query("studentMastery")
          .withIndex("by_user_mastery", (q) => q.eq("userId", student.userId))
          .collect();

        // Submissions for success rate
        const submissions = await ctx.db
          .query("submissions")
          .withIndex("by_user_topic", (q) => q.eq("userId", student.userId))
          .collect();

        // Exam status
        const examSubmissions = await ctx.db
          .query("examSubmissions")
          .filter((q) => q.eq(q.field("userId"), student.userId))
          .collect();

        const correctSubmissions = submissions.filter(s => s.grade === 1).length;
        const totalSubmissions = submissions.length;
        const successRate = totalSubmissions > 0 
          ? Math.round((correctSubmissions / totalSubmissions) * 100) 
          : 0;

        const averageMastery = mastery.length > 0 
          ? Math.round(mastery.reduce((acc, m) => acc + m.masteryScore, 0) / mastery.length) 
          : 0;

        return {
          userId: student.userId,
          name: `${student.firstName} ${student.surname}`,
          email: student.email,
          lastActive: student.lastActive,
          topicsAttempted: mastery.length,
          averageMastery,
          successRate,
          examsTaken: examSubmissions.length,
          isOnline: student.lastActive ? (Date.now() - student.lastActive < 5 * 60 * 1000) : false,
          recentTopic: mastery.length > 0 ? mastery.sort((a, b) => b.lastAttempt - a.lastAttempt)[0].topicName : "N/A"
        };
      })
    );

    return analytics;
  },
});
 
export const updateThemePreference = mutation({
  args: { userId: v.string(), theme: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();
    if (user) {
      await ctx.db.patch(user._id, { themePreference: args.theme });
    }
  },
});

export const getUserStats = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const submissions = await ctx.db
      .query("submissions")
      .withIndex("by_user_topic", (q) => q.eq("userId", args.userId))
      .collect();

    const correctSubmissions = submissions.filter((s) => s.grade === 1).length;
    const totalSubmissions = submissions.length;
    const successRate = totalSubmissions > 0 
      ? Math.round((correctSubmissions / totalSubmissions) * 100) 
      : 0;

    // Calculate Level (1 level per 5 correct answers, starting at level 1)
    const level = Math.floor(correctSubmissions / 5) + 1;

    // Modules Mastered
    const mastery = await ctx.db
      .query("studentMastery")
      .withIndex("by_user_mastery", (q) => q.eq("userId", args.userId))
      .collect();
    const modulesMastered = mastery.filter(m => m.masteryScore >= 80).length;

    // Total Topics count
    const totalTopics = (await ctx.db.query("topics").collect()).length;

    // Calculate Streak
    // Get unique days from submission timestamps (UTC)
    const dates = submissions
      .map(s => new Date(s._creationTime).toDateString());
    const uniqueDates = Array.from(new Set(dates)).map(d => new Date(d));
    uniqueDates.sort((a, b) => b.getTime() - a.getTime()); // reverse chronological

    let streak = 0;
    if (uniqueDates.length > 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const checkDate = new Date(uniqueDates[0]);
      checkDate.setHours(0, 0, 0, 0);

      // Can be today or yesterday to continue/start a streak
      const diffDays = Math.floor((today.getTime() - checkDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays <= 1) {
        streak = 1;
        for (let i = 0; i < uniqueDates.length - 1; i++) {
          const current = new Date(uniqueDates[i]);
          const next = new Date(uniqueDates[i+1]);
          current.setHours(0,0,0,0);
          next.setHours(0,0,0,0);
          
          if ((current.getTime() - next.getTime()) === (1000 * 60 * 60 * 24)) {
            streak++;
          } else {
            break;
          }
        }
      }
    }

    return {
      totalSubmissions,
      successRate,
      level,
      streak,
      modulesMastered,
      totalTopics
    };
  },
});
