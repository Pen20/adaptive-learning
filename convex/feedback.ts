import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const submitFeedback = mutation({
  args: {
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    type: v.string(),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("feedback", {
      name: args.name,
      email: args.email,
      type: args.type,
      message: args.message,
      submittedAt: Date.now(),
    });
  },
});
