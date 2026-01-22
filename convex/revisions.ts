import { query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
    args: { episodeId: v.id("episodes") },
    handler: async (ctx, args) => {
        const batches = await ctx.db
            .query("revision_batches")
            .withIndex("by_episode", (q) => q.eq("episodeId", args.episodeId))
            // .order("desc") // Schema definition didn't specify order on index, so we sort in memory or rely on default insertion order if monotonic
            .collect();

        // Sort descending by creation time (using _creationTime)
        batches.sort((a, b) => b._creationTime - a._creationTime);

        const enrichedBatches = await Promise.all(batches.map(async (batch) => {
            // Fetch comments to display as tasks
            const comments = await ctx.db
                .query("comments")
                .withIndex("by_batch", (q) => q.eq("revisionBatchId", batch._id))
                .collect();

            const commentCount = comments.length;

            // Mock Author (Since we store authorId as string)
            const author = {
                name: "Client User", // In real app, fetch from users table
                avatar: "https://ui-avatars.com/api/?name=Client+User&background=random"
            };

            // [NEW] Version Info
            let versionInfo = null;
            if (batch.versionId) {
                const version = await ctx.db.get(batch.versionId);
                if (version) {
                    versionInfo = {
                        name: version.name,
                        number: version.versionNumber
                    };
                }
            }

            // Format Relative Date
            const timeDiff = Date.now() - batch._creationTime;
            let timeAgo = "Just now";
            if (timeDiff > 60000) {
                const mins = Math.floor(timeDiff / 60000);
                timeAgo = `${mins} mins ago`;
                if (mins > 60) {
                    const hours = Math.floor(mins / 60);
                    timeAgo = `${hours} hours ago`;
                }
            }

            return {
                ...batch,
                author,
                versionInfo, // [NEW]
                commentCount,
                comments, // Return the full array
                formattedDate: timeAgo,
                resolvedDate: batch.resolvedAt ? new Date(batch.resolvedAt).toLocaleDateString() : null
            };
        }));

        return enrichedBatches;
    },
});

export const listOpen = query({
    args: {},
    handler: async (ctx) => {
        // 1. Fetch all revision batches that are 'open'
        // Index: .index("by_status", ["status"])
        const batches = await ctx.db
            .query("revision_batches")
            .withIndex("by_status", (q) => q.eq("status", "open"))
            .collect();

        // 2. Sort by creation time descending (newest first)
        batches.sort((a, b) => b._creationTime - a._creationTime);

        // 3. Enrich with Episode Data
        const enriched = await Promise.all(batches.map(async (batch) => {
            const episode = await ctx.db.get(batch.episodeId);

            // Mock Author (consistent with list query)
            const author = {
                name: "Client User",
                avatar: "https://ui-avatars.com/api/?name=Client+User&background=random"
            };

            // Format Relative Date
            const timeDiff = Date.now() - batch._creationTime;
            let timeAgo = "Just now";
            if (timeDiff > 60000) {
                const mins = Math.floor(timeDiff / 60000);
                timeAgo = `${mins} mins ago`;
                if (mins > 60) {
                    const hours = Math.floor(mins / 60);
                    timeAgo = `${hours} hours ago`;
                }
            }

            return {
                ...batch,
                author,
                formattedDate: timeAgo,
                episode: episode ? {
                    _id: episode._id,
                    title: episode.title,
                    imageUrl: episode.imageUrl,
                    videoUrl: episode.videoUrl // [NEW] Return video URL for thumbnail generation
                } : null
            };
        }));

        // Filter out any where episode might be null (deleted episodes)
        return enriched.filter(b => b.episode !== null);
    }
});
