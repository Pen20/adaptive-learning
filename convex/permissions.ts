import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getPermissions = query({
  args: {
    courseName: v.string(),
    topicName: v.string(),
  },
  handler: async (ctx, args) => {
    const permissions = await ctx.db
      .query("topicPermissions")
      .withIndex("by_course_topic", (q) => 
        q.eq("courseName", args.courseName).eq("topicName", args.topicName)
      )
      .first();
    return permissions || {
      allowHints: true,
      allowSolution: true,
      allowDetailedSolution: true,
      allowPractice: true,
      allowRLHF: (permissions as any)?.allowRLHF ?? true,
    };
  },
});

export const getAllPermissions = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const user = await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    if (!user.roles?.includes("admin") && user.role !== "admin") {
       // Ideally throw, but for now we might just return empty or handle gracefully in UI
       // throw new Error("Admin access required"); 
    }

    return await ctx.db.query("topicPermissions").collect();
  },
});

export const updatePermission = mutation({
  args: {
    courseName: v.string(),
    topicName: v.string(),
    field: v.string(), // "allowHints" | "allowSolution" | "allowDetailedSolution" | "allowPractice" | "allowRLHF"
    value: v.boolean(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const user = await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .first();

    if (!user) throw new Error("User not found");
    if (!user.roles?.includes("admin") && user.role !== "admin") {
      throw new Error("Admin access required");
    }

    const existing = await ctx.db
      .query("topicPermissions")
      .withIndex("by_course_topic", (q) => 
        q.eq("courseName", args.courseName).eq("topicName", args.topicName)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, { [args.field]: args.value });
    } else {
      // Create with defaults but override the specific field
      await ctx.db.insert("topicPermissions", {
        courseName: args.courseName,
        topicName: args.topicName,
        allowHints: true,
        allowSolution: true,
        allowDetailedSolution: true,
        allowPractice: true,
        allowRLHF: true,
        [args.field]: args.value,
      });
    }
  },
});
