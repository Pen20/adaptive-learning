import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

export const submitFeedback = mutation({
  args: {
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    type: v.string(),
    message: v.string(),
    institution: v.optional(v.string()),
    gender: v.optional(v.string()),
    profession: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("feedback", {
      name: args.name,
      email: args.email,
      type: args.type,
      message: args.message,
      institution: args.institution,
      gender: args.gender,
      profession: args.profession,
      submittedAt: Date.now(),
    });

    // Send email notification to admin
    await ctx.scheduler.runAfter(0, api.email.sendFeedbackEmail, {
      name: args.name,
      email: args.email,
      type: args.type,
      message: args.message,
      institution: args.institution,
      gender: args.gender,
      profession: args.profession,
    });
  },
});
