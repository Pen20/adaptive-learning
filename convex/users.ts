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
    const existing = await ctx.db
      .query("studentMastery")
      .withIndex("by_user_mastery", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("topicName"), args.topicName))
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
