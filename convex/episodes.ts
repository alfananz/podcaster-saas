import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

export const list = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db.query("episodes").collect();
    },
});

export const create = mutation({
    args: {
        title: v.string(),
        storageId: v.optional(v.id("_storage")), // Made optional to support draft flows, but pipeline requires it
        episodeNumber: v.number(),
    },
    handler: async (ctx, args) => {
        const episodeId = await ctx.db.insert("episodes", {
            title: args.title,
            storageId: args.storageId,
            date: new Date().toISOString(),
            status: "processing",
            processingStage: "queued", // Initial Stage
            progress: 0,
            imageUrl: "https://placehold.co/600x400/1a1a1a/ffffff?text=Processing",
            duration: "00:00",
            issues: undefined,
        });

        // Atomic Scheduling: If storageId is present, start the pipeline immediately.
        if (args.storageId) {
            await ctx.scheduler.runAfter(0, (internal as any).actions.process.run, {
                episodeId,
                storageId: args.storageId,
            });
        }

        return episodeId;
    },
});

import { Id } from "./_generated/dataModel";

export const get = query({
    args: { id: v.string() }, // Changed from v.id() to v.string() for robustness
    handler: async (ctx, args) => {
        try {
            // 1. Manually cast to ID
            const episodeId = args.id as Id<"episodes">;

            // 2. Fetch
            const episode = await ctx.db.get(episodeId);

            // 3. Debug Log
            console.log(`[Backend] Fetching episode ${args.id}:`, episode ? "FOUND" : "NOT FOUND");

            return episode;
        } catch (e) {
            console.error("[Backend] Error fetching episode:", e);
            return null;
        }
    },
});

export const remove = mutation({
    args: { episodeId: v.id("episodes") },
    handler: async (ctx, args) => {
        const episode = await ctx.db.get(args.episodeId);
        if (!episode) return; // Already deleted or doesn't exist

        if (episode.storageId) {
            await ctx.storage.delete(episode.storageId);
        }

        await ctx.db.delete(args.episodeId);
    },
});

// Internal Mutations


export const updateProcessingStage = internalMutation({
    args: {
        episodeId: v.id("episodes"),
        stage: v.union(
            v.literal("queued"),
            v.literal("transcribing"),
            v.literal("enriching"),
            v.literal("completed"),
            v.literal("failed")
        ),
        status: v.optional(v.union(v.literal("processing"), v.literal("action_required"), v.literal("completed"))),
        progress: v.optional(v.number()),
        errorMessage: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const list = {
            processingStage: args.stage,
            ...(args.status ? { status: args.status } : {}),
            ...(args.progress !== undefined ? { progress: args.progress } : {}),
            ...(args.errorMessage ? { issues: args.errorMessage } : {}),
        };
        await ctx.db.patch(args.episodeId, list);
    },
});

export const saveAIResults = internalMutation({
    args: {
        episodeId: v.id("episodes"),
        transcript: v.string(),
        transcriptJson: v.any(),
        segments: v.array(v.object({
            start: v.number(),
            end: v.number(),
            text: v.string(),
            speaker: v.string(),
        })),
        speakers: v.array(v.string()),
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.episodeId, {
            transcript: args.transcript,
            transcriptJson: args.transcriptJson,
            segments: args.segments,
            speakers: args.speakers,
        });
    },
});

export const updateEnrichment = internalMutation({
    args: {
        episodeId: v.id("episodes"),
        generatedTitle: v.optional(v.string()),
        summary: v.optional(v.string()),
        aiSynopsis: v.optional(v.string()),
        guestBio: v.optional(v.string()),
        keyTakeaways: v.optional(v.array(v.string())),
        seoTags: v.optional(v.array(v.string())),
        chapters: v.optional(v.array(v.object({
            startTime: v.number(),
            title: v.string(),
            description: v.optional(v.string())
        }))),
        resources: v.optional(v.array(v.object({
            title: v.string(),
            url: v.optional(v.string())
        }))),
        enrichmentStatus: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.episodeId, {
            generatedTitle: args.generatedTitle,
            summary: args.summary,
            aiSynopsis: args.aiSynopsis,
            guestBio: args.guestBio,
            keyTakeaways: args.keyTakeaways,
            seoTags: args.seoTags,
            chapters: args.chapters,
            resources: args.resources,
            enrichmentStatus: args.enrichmentStatus as any,
        });
    },
});
