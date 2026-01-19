import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
    args: { episodeId: v.id("episodes") },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("comments")
            .withIndex("by_episode", (q) => q.eq("episodeId", args.episodeId))
            .collect();
    },
});

export const create = mutation({
    args: {
        episodeId: v.id("episodes"),
        text: v.string(),
        timestamp: v.number(),
        user: v.object({
            name: v.string(),
            avatar: v.string(),
        }),
        parentId: v.optional(v.id("comments")),
    },
    handler: async (ctx, args) => {
        await ctx.db.insert("comments", {
            episodeId: args.episodeId,
            text: args.text,
            timestamp: args.timestamp,
            user: args.user,
            isResolved: false,
            parentId: args.parentId,
            likes: 0,
        });
    },
});

export const toggleLike = mutation({
    args: { commentId: v.id("comments") },
    handler: async (ctx, args) => {
        const comment = await ctx.db.get(args.commentId);
        if (!comment) return;
        // In a real app we'd track WHO liked it to prevent duplicates, 
        // but for now simple increment is sufficient as per plan.
        await ctx.db.patch(args.commentId, { likes: (comment.likes || 0) + 1 });
    }
});

export const resolve = mutation({
    args: { commentId: v.id("comments") },
    handler: async (ctx, args) => {
        const comment = await ctx.db.get(args.commentId);
        if (!comment) return;
        await ctx.db.patch(args.commentId, { isResolved: !comment.isResolved });
    }
});

export const edit = mutation({
    args: {
        commentId: v.id("comments"),
        text: v.string(),
    },
    handler: async (ctx, args) => {
        const comment = await ctx.db.get(args.commentId);
        if (!comment) throw new Error("Comment not found");
        // In real app, check auth vs comment.user.id
        await ctx.db.patch(args.commentId, { text: args.text });
    }
});

export const deleteComment = mutation({
    args: { commentId: v.id("comments") },
    handler: async (ctx, args) => {
        const comment = await ctx.db.get(args.commentId);
        if (!comment) return; // Idempotent

        // 1. Delete the comment itself
        await ctx.db.delete(args.commentId);

        // 2. Delete all replies (Recursive logic handled by fetching children)
        // Note: For deep nesting, we'd need a recursive function, but schema only suggests 1 level or flat threading via parentId.
        // Assuming single level nesting or flattened structure for now based on CommentsSection implementation.
        const replies = await ctx.db
            .query("comments")
            .withIndex("by_parent", (q) => q.eq("parentId", args.commentId))
            .collect();

        for (const reply of replies) {
            await ctx.db.delete(reply._id);
            // If we support deep nesting, we'd recurse here.
        }
    }
});
