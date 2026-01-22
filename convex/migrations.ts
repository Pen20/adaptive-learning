import { mutation } from "./_generated/server";

export const migrateRoles = mutation({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    let count = 0;
    for (const user of users) {
      // If roles array doesn't exist, create it from the old role field
      if (!user.roles) {
        const initialRoles = user.role ? [user.role] : ["student"];
        await ctx.db.patch(user._id, { roles: initialRoles });
        count++;
      }
    }
    return `Successfully migrated ${count} users to the new roles array structure.`;
  },
});
