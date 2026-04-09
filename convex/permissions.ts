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
      allowRLHF: true,
      alwaysShowSolution: false,
    };
  },
});

export const getAllPermissions = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .first();

    if (!user) return null;

    if (!user.roles?.includes("admin") && user.role !== "admin") {
       return null;
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

    const ALLOWED_FIELDS = ["allowHints", "allowSolution", "allowDetailedSolution", "allowPractice", "allowRLHF", "alwaysShowSolution"];
    if (!ALLOWED_FIELDS.includes(args.field)) {
      throw new Error(`Invalid field: ${args.field}`);
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
        alwaysShowSolution: false,
        [args.field]: args.value,
      });
    }
  },
});
