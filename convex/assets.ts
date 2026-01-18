import { query } from "./_generated/server";
import { v } from "convex/values";

export const recent = query({
    args: {},
    handler: async (ctx) => {
        const assets = await ctx.db.query("assets").collect();
        // Sort by uploadedAt descending in memory for now as we don't have a specific index
        // and the dataset is expected to be manageable.
        return assets.sort((a, b) => b.uploadedAt - a.uploadedAt).slice(0, 10);
    },
});
