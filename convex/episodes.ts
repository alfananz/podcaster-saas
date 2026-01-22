import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

export const list = query({
    args: {},
    handler: async (ctx) => {
        const episodes = await ctx.db.query("episodes").order("desc").collect();

        // Enrich with videoUrl from currentVersion if available
        const enriched = await Promise.all(episodes.map(async (ep) => {
            let videoUrl = ep.videoUrl;

            // If no videoUrl on episode, check current version
            if (!videoUrl && ep.currentVersionId) {
                const version = await ctx.db.get(ep.currentVersionId);
                // Note: version.videoUrl might be a storage ID or a full URL. 
                // Assuming version logic stores a usable URL or we need to generate one from storageId.
                if (version?.videoUrl) {
                    videoUrl = version.videoUrl;
                } else if (version?.storageId) {
                    videoUrl = await ctx.storage.getUrl(version.storageId) || undefined;
                }
            } else if (!videoUrl && ep.storageId) {
                // Fallback to episode storage (legacy)
                videoUrl = await ctx.storage.getUrl(ep.storageId) || undefined;
            }

            // [NEW] Resolve Waveform URL (S3 vs Storage)
            let waveformUrl = ep.waveformUrl;
            if (!waveformUrl && ep.waveformId) {
                waveformUrl = await ctx.storage.getUrl(ep.waveformId) || undefined;
            }

            return { ...ep, videoUrl, waveformUrl };
        }));

        return enriched;
    },
});

export const create = mutation({
    args: {
        title: v.string(),
        storageId: v.optional(v.id("_storage")), // Made optional to support draft flows, but pipeline requires it
        episodeNumber: v.number(),
        description: v.optional(v.string()),
        language: v.optional(v.union(v.literal("en"), v.literal("ar"))),
        waveformId: v.optional(v.id("_storage")), // [NEW] Pre-computed waveform
        videoUrl: v.optional(v.string()), // [NEW] S3 URL
        audioUrl: v.optional(v.string()), // [NEW] Support for Audio
        waveformUrl: v.optional(v.string()), // [NEW] S3 URL
    },
    handler: async (ctx, args) => {
        const episodeId = await ctx.db.insert("episodes", {
            title: args.title,
            storageId: args.storageId,
            videoUrl: args.videoUrl, // [NEW]
            audioUrl: args.audioUrl, // [NEW]
            episodeNumber: args.episodeNumber,
            description: args.description,
            date: new Date().toISOString(),
            status: "processing",
            processingStage: "queued", // Initial Stage
            progress: 0,
            imageUrl: "https://placehold.co/600x400/1a1a1a/ffffff?text=Processing",
            duration: "00:00",
            issues: undefined,
            language: args.language || "en", // Default to English
            waveformId: args.waveformId, // [NEW] Store it
            waveformUrl: args.waveformUrl, // [NEW]
        });

        // Atomic Scheduling: If storageId OR videoUrl OR audioUrl is present
        if (args.storageId || args.videoUrl || args.audioUrl) {
            // [NEW] v1.0 Logic: Create initial version entry
            const versionId = await ctx.db.insert("versions", {
                episodeId,
                versionNumber: 1,
                name: "v1.0 (Original)",
                storageId: args.storageId,
                videoUrl: args.videoUrl, // [NEW]
                audioUrl: args.audioUrl, // [NEW]
                authorId: (await ctx.auth.getUserIdentity())?.subject || "admin",
                status: "active",
                uploadTime: Date.now(),
                changeLog: "Initial Upload",
            });

            // Update Episode with Head Pointer
            await ctx.db.patch(episodeId, {
                currentVersionId: versionId
            });

            // Start Pipeline
            await ctx.scheduler.runAfter(0, (internal as any).actions.process.run, {
                episodeId,
                storageId: args.storageId,
                videoUrl: args.videoUrl || args.audioUrl, // Pipeline might still use videoUrl generic arg, or we update pipeline? 
                // Let's pass it as videoUrl if videoUrl is missing, OR we update pipeline.
                // For now, let's keep pipeline signature checks simple. The pipeline likely reads from DB anyway.
                versionId, // [NEW] Version Context
            });
        }

        return episodeId;
    },
});

import { Id } from "./_generated/dataModel";

// [NEW] Save Persistent Waveform
export const saveWaveform = mutation({
    args: {
        episodeId: v.id("episodes"),
        storageId: v.optional(v.id("_storage")),
        waveformUrl: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.episodeId, {
            waveformId: args.storageId,
            waveformUrl: args.waveformUrl,
        });
    },
});

export const get = query({
    args: { id: v.string() }, // Accept string to handle potential raw ID from URL
    handler: async (ctx, args) => {
        // Safe ID conversion
        const episodeId = ctx.db.normalizeId("episodes", args.id);
        if (!episodeId) return null;

        const episode = await ctx.db.get(episodeId);
        if (!episode) return null;

        // Get Waveform URL if it exists
        let waveformUrl = episode.waveformUrl;
        if (!waveformUrl && episode.waveformId) {
            waveformUrl = await ctx.storage.getUrl(episode.waveformId) || undefined;
        }

        return {
            ...episode,
            waveformUrl, // [NEW] Return the signed URL for the waveform JSON
        };
    },
});

export const remove = mutation({
    args: { episodeId: v.id("episodes") },
    handler: async (ctx, args) => {
        const episode = await ctx.db.get(args.episodeId);
        if (!episode) return; // Already deleted or doesn't exist

        // 1. Collect S3 Keys to Delete
        const keysToDelete: string[] = [];
        const extractKey = (url: string | undefined | null) => {
            if (!url) return null;
            try {
                // Typical S3 URL: https://BUCKET.s3.REGION.amazonaws.com/KEY
                // Or: https://s3.REGION.amazonaws.com/BUCKET/KEY
                // Let's assume standard virtual-hosted style from our action:
                // https://podcaster-saas-media.s3.eu-central-1.amazonaws.com/videos/1700...
                const urlObj = new URL(url);
                if (urlObj.hostname.includes("amazonaws.com")) {
                    return urlObj.pathname.substring(1); // Remove leading slash
                }
            } catch (e) {
                return null;
            }
            return null;
        };

        // Episode Keys
        const epKey1 = extractKey(episode.videoUrl);
        if (epKey1) keysToDelete.push(epKey1);
        const epKey2 = extractKey(episode.waveformUrl);
        if (epKey2) keysToDelete.push(epKey2);

        // Version Keys
        const versions = await ctx.db
            .query("versions")
            .withIndex("by_episode", (q) => q.eq("episodeId", args.episodeId))
            .collect();

        for (const v of versions) {
            const vKey1 = extractKey(v.videoUrl);
            if (vKey1) keysToDelete.push(vKey1);
            const vKey2 = extractKey(v.waveformUrl);
            if (vKey2) keysToDelete.push(vKey2);
        }

        // 2. Schedule S3 Deletion (Async)
        if (keysToDelete.length > 0) {
            // Dedupe
            const uniqueKeys = Array.from(new Set(keysToDelete));
            await ctx.scheduler.runAfter(0, (internal as any).actions.files.deleteS3Files, {
                keys: uniqueKeys
            });
        }

        // 3. Delete Legacy Convex Storage Files
        if (episode.storageId) {
            try { await ctx.storage.delete(episode.storageId); } catch (e) { /** Ignore if missing */ }
        }
        if (episode.waveformId) {
            try { await ctx.storage.delete(episode.waveformId); } catch (e) { /** Ignore */ }
        }

        for (const v of versions) {
            if (v.storageId) try { await ctx.storage.delete(v.storageId); } catch (e) { }
            if (v.waveformId) try { await ctx.storage.delete(v.waveformId); } catch (e) { }

            // Delete the version record
            await ctx.db.delete(v._id);
        }

        // 4. Delete Transcripts & other data (Optional but good hygiene)
        // ... (Skipping strict cascade for now as per minimal request, but versions are critical)

        // 5. Delete Episode
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
        console.log(`[Mutation:updateProcessingStage] Episode: ${args.episodeId}, Stage: ${args.stage}, Progress: ${args.progress}`);
        const list = {
            processingStage: args.stage,
            ...(args.status ? { status: args.status } : {}),
            ...(args.progress !== undefined ? { progress: args.progress } : {}),
            ...(args.errorMessage ? { issues: args.errorMessage } : {}),
        };
        await ctx.db.patch(args.episodeId, list);
        console.log(`[Mutation:updateProcessingStage] PATCH COMPLETE`);
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
    args: { episodeId: v.id("episodes"), versionId: v.optional(v.id("versions")), feedback: v.string() },
    handler: async (ctx, args) => {
        // 1. Auth Check
        const identity = await ctx.auth.getUserIdentity();
        const userId = identity?.subject || "mock-user-id";

        // 2. [LOCKING] Check for existing open batch for this episode
        const existingOpenBatch = await ctx.db
            .query("revision_batches")
            .withIndex("by_episode", (q) => q.eq("episodeId", args.episodeId))
            .filter((q) => q.eq(q.field("status"), "open"))
            .first();

        if (existingOpenBatch) {
            throw new Error("A revision request is already active for this episode. Please resolve it before requesting another.");
        }

        // 3. Create Revision Batch (Scoped to Version)
        const batchId = await ctx.db.insert("revision_batches", {
            episodeId: args.episodeId,
            versionId: args.versionId, // [NEW] Link to version
            authorId: userId,
            note: args.feedback,
            status: "open",
        });

        // 4. Bundle Comments (Scoped to Version)
        // Find all unresolved comments for this episode AND version that are NOT already in a batch
        let pendingCommentsQuery = ctx.db
            .query("comments")
            .withIndex("by_episode", (q) => q.eq("episodeId", args.episodeId));

        // Strict filtering by version
        const pendingComments = await pendingCommentsQuery
            .filter((q) => q.eq(q.field("revisionBatchId"), undefined))
            .filter((q) => q.eq(q.field("isResolved"), false))
            .filter((q) => q.eq(q.field("versionId"), args.versionId)) // [NEW] Strict Scope
            .collect();

        for (const comment of pendingComments) {
            await ctx.db.patch(comment._id, { revisionBatchId: batchId });
        }

        // 5. Move Episode Backwards
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

export const approve = mutation({
    args: { episodeId: v.id("episodes") },
    handler: async (ctx, args) => {
        // 1. Resolve any open revision batches
        const openBatch = await ctx.db
            .query("revision_batches")
            .withIndex("by_episode", (q) => q.eq("episodeId", args.episodeId))
            .filter((q) => q.eq(q.field("status"), "open"))
            .first();

        if (openBatch) {
            await ctx.db.patch(openBatch._id, { status: "resolved", resolvedAt: Date.now() });
        }

        // 2. Update Episode Status
        await ctx.db.patch(args.episodeId, {
            status: "completed",
            processingStage: "completed" as any,
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
