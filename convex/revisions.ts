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
                commentCount,
                comments, // Return the full array
                formattedDate: timeAgo,
                resolvedDate: batch.resolvedAt ? new Date(batch.resolvedAt).toLocaleDateString() : null
            };
        }));

        return enrichedBatches;
    },
});
