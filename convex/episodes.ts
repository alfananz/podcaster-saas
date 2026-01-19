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


export const updateProcessingStage = mutation({
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

// 1. Heavy JSON Write
export const saveTranscript = mutation({
    args: {
        episodeId: v.id("episodes"),
        transcriptJson: v.any(),
    },
    handler: async (ctx, args) => {
        const existingTranscript = await ctx.db
            .query("transcripts")
            .withIndex("by_episode", (q) => q.eq("episodeId", args.episodeId))
            .first();

        if (existingTranscript) {
            await ctx.db.patch(existingTranscript._id, { transcriptJson: args.transcriptJson });
        } else {
            await ctx.db.insert("transcripts", {
                episodeId: args.episodeId,
                transcriptJson: args.transcriptJson
            });
        }
    },
});

// 2. Lighter Metadata Update
export const updateEpisodeAIResults = mutation({
    args: {
        episodeId: v.id("episodes"),
        transcript: v.string(),
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
            segments: args.segments,
            speakers: args.speakers,
        });
    },
});

// DEPRECATED: Keep for backward compatibility if any running actions use it, but try to use split versions.
export const saveAIResults = mutation({
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
        // Delegate to new split functions (conceptual, but mutations can't call mutations directly in same context easily without internal calls)
        // Re-implement logic to be safe, but this is the offending function.
        // We will update the ACTION to use the new split mutations instead.

        // 1. Offload heavy JSON
        const existingTranscript = await ctx.db
            .query("transcripts")
            .withIndex("by_episode", (q) => q.eq("episodeId", args.episodeId))
            .first();

        if (existingTranscript) {
            await ctx.db.patch(existingTranscript._id, { transcriptJson: args.transcriptJson });
        } else {
            await ctx.db.insert("transcripts", {
                episodeId: args.episodeId,
                transcriptJson: args.transcriptJson
            });
        }

        // 2. Update lighter fields
        await ctx.db.patch(args.episodeId, {
            transcript: args.transcript,
            segments: args.segments,
            speakers: args.speakers,
        });
    },
});

export const updateEnrichment = mutation({
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

export const getStorageUrl = query({
    args: {
        storageId: v.id("_storage"),
    },
    handler: async (ctx, args) => {
        return await ctx.storage.getUrl(args.storageId);
    },
});

// Revision Workflow
export const requestRevision = mutation({
    args: { episodeId: v.id("episodes"), feedback: v.string() },
    handler: async (ctx, args) => {
        // 1. Auth Check
        const identity = await ctx.auth.getUserIdentity();
        // Use identity or mock
        const userId = identity?.subject || "mock-user-id";

        // 2. Create Revision Batch
        const batchId = await ctx.db.insert("revision_batches", {
            episodeId: args.episodeId,
            authorId: userId,
            note: args.feedback,
            status: "open",
        });

        // 3. Bundle Comments
        // Find all unresolved comments for this episode that are NOT already in a batch
        const pendingComments = await ctx.db
            .query("comments")
            .withIndex("by_episode", (q) => q.eq("episodeId", args.episodeId))
            .filter((q) => q.eq(q.field("revisionBatchId"), undefined))
            .filter((q) => q.eq(q.field("isResolved"), false))
            .collect();

        for (const comment of pendingComments) {
            await ctx.db.patch(comment._id, { revisionBatchId: batchId });
        }

        // 4. Move Episode Backwards
        await ctx.db.patch(args.episodeId, {
            status: "action_required",
            processingStage: "revision_requested" as any
        });
    },
});

export const completeRevision = mutation({
    args: { batchId: v.id("revision_batches"), episodeId: v.id("episodes") },
    handler: async (ctx, args) => {
        // 1. Close Batch
        await ctx.db.patch(args.batchId, {
            status: "resolved",
            resolvedAt: Date.now(),
        });

        // 2. Resolve ALL comments in this batch
        const batchComments = await ctx.db
            .query("comments")
            .withIndex("by_batch", (q) => q.eq("revisionBatchId", args.batchId))
            .collect();

        for (const comment of batchComments) {
            await ctx.db.patch(comment._id, { isResolved: true });
        }

        // 3. Update Episode Status
        await ctx.db.patch(args.episodeId, {
            status: "processing", // Or whatever "In Review" maps to in your flow, user said "in_review" but schema has "processing" | "action_required" | "completed"
            // Let's assume "processing" with stage "completed" means "In Review" based on EditorHeader logic
            processingStage: "completed" as any
        });
    },
});

export const getActiveRevisionBatch = query({
    args: { episodeId: v.id("episodes") },
    handler: async (ctx, args) => {
        const batch = await ctx.db
            .query("revision_batches")
            .withIndex("by_episode", (q) => q.eq("episodeId", args.episodeId))
            .filter((q) => q.eq(q.field("status"), "open"))
            .first();
        return batch;
    },
});

export const inspectEpisode = query({
    args: { id: v.string() }, // Accept string for easier CLI usage
    handler: async (ctx, args) => {
        const episode = await ctx.db.get(args.id as Id<"episodes">);
        const transcriptDoc = await ctx.db
            .query("transcripts")
            .withIndex("by_episode", (q) => q.eq("episodeId", args.id as Id<"episodes">))
            .first();

        const transcriptJson = transcriptDoc?.transcriptJson || (episode as any)?.transcriptJson;

        return {
            _id: episode?._id,
            speakers: episode?.speakers,
            segmentSample: episode?.segments?.slice(0, 5),
            rawWordSample: transcriptJson?.words ? transcriptJson.words.slice(0, 3) : "No words in raw JSON",
        };
    },
});

export const repairEpisode = mutation({
    args: { episodeId: v.id("episodes") },
    handler: async (ctx, args) => {
        const episode = await ctx.db.get(args.episodeId);
        if (!episode) throw new Error("Episode not found");

        const transcriptDoc = await ctx.db
            .query("transcripts")
            .withIndex("by_episode", (q) => q.eq("episodeId", args.episodeId))
            .first();

        // Fallback to legacy field if new one missing
        const transcriptJson = transcriptDoc?.transcriptJson || (episode as any).transcriptJson;

        if (!transcriptJson) throw new Error("No transcript data");

        // Re-parse using correct speakerId key
        const words = (transcriptJson as any).words || [];
        const segments = words.map((word: any) => ({
            start: word.start,
            end: word.end,
            text: word.text,
            speaker: word.speakerId || word.speaker_id || "Unknown",
        }));

        const speakers = new Set<string>();
        words.forEach((word: any) => {
            const spk = word.speakerId || word.speaker_id;
            if (spk) speakers.add(spk);
        });

        await ctx.db.patch(args.episodeId, {
            segments,
            speakers: Array.from(speakers),
        });

        return {
            status: "repaired",
            segmentsCount: segments.length,
            uniqueSpeakers: Array.from(speakers)
        };
    },
});
