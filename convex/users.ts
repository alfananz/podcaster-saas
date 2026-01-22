import { query } from "./_generated/server";
import { v } from "convex/values";

export const current = query({
    args: { userId: v.optional(v.id("users")) },
    handler: async (ctx, args) => {
        if (!args.userId) return null;
        return await ctx.db.get(args.userId);
    },
});
