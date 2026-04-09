import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const promoteToAdmin = mutation({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    // Only an existing admin can promote another user
    const caller = await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .first();

    if (!caller || (!caller.roles?.includes("admin") && caller.role !== "admin")) {
      throw new Error("Admin access required");
    }

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), args.email))
      .first();

    if (!user) {
      return "User not found";
    }

    await ctx.db.patch(user._id, { roles: ["admin", "student"], role: "admin" });
    return `User ${user.email} promoted to admin.`;
  },
});
