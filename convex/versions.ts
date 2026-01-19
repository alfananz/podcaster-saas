import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const create = mutation({
    args: {
        episodeId: v.id("episodes"),
        storageId: v.id("_storage"),
        changeLog: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        const authorId = identity?.subject || "admin";

        // 1. Determine next version number
        const existingVersions = await ctx.db
            .query("versions")
            .withIndex("by_episode", (q) => q.eq("episodeId", args.episodeId))
            .collect();

        const versionNumber = existingVersions.length + 1;
        const name = `v${versionNumber}.0`;

        // 2. Create the version
        const versionId = await ctx.db.insert("versions", {
            episodeId: args.episodeId,
            versionNumber,
            name,
            storageId: args.storageId,
            authorId,
            status: "active",
            changeLog: args.changeLog,
            uploadTime: Date.now(),
        });

        // 3. Update Episode "Head"
        await ctx.db.patch(args.episodeId, {
            currentVersionId: versionId,
            // We might want to update videoUrl/storageId on the episode itself for legacy compatibility
            // but the plan is to switch frontend to use version.videoUrl.
            // For now, let's strictly rely on currentVersionId logic in frontend.
        });

        return versionId;
    },
});

export const list = query({
    args: { episodeId: v.id("episodes") },
    handler: async (ctx, args) => {
        const versions = await ctx.db
            .query("versions")
            .withIndex("by_episode", (q) => q.eq("episodeId", args.episodeId))
            .order("desc") // Latest first
            .collect();
        return versions;
    },
});

export const get = query({
    args: { versionId: v.id("versions") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.versionId);
    },
});
