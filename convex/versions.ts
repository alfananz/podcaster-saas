import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

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

        // 4. Trigger Processing for this new version
        await ctx.scheduler.runAfter(0, (internal as any).actions.process.run, {
            episodeId: args.episodeId,
            storageId: args.storageId,
            versionId, // [NEW] Link processing to this version
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

        // Enrich with waveformUrl
        const enriched = await Promise.all(versions.map(async (v) => {
            let waveformUrl = null;
            if (v.waveformId) {
                waveformUrl = await ctx.storage.getUrl(v.waveformId);
            }
            return {
                ...v,
                waveformUrl,
            };
        }));

        return enriched;
    },
});

export const get = query({
    args: { versionId: v.id("versions") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.versionId);
    },
});
export const updateProcessingStage = mutation({
    args: {
        versionId: v.id("versions"),
        stage: v.union(
            v.literal("queued"),
            v.literal("transcribing"),
            v.literal("enriching"),
            v.literal("completed"),
            v.literal("failed")
        ),
        waveformId: v.optional(v.id("_storage")),
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.versionId, {
            processingStage: args.stage,
            ...(args.waveformId ? { waveformId: args.waveformId } : {}),
        });
    },
});

export const saveTranscript = mutation({
    args: {
        versionId: v.id("versions"),
        transcriptJson: v.any(),
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.versionId, {
            transcriptJson: args.transcriptJson,
        });
    },
});

export const updateAIResults = mutation({
    args: {
        versionId: v.id("versions"),
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
        await ctx.db.patch(args.versionId, {
            transcript: args.transcript,
            segments: args.segments,
            speakers: args.speakers,
        });
    },
});

export const updateEnrichment = mutation({
    args: {
        versionId: v.id("versions"),
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
        await ctx.db.patch(args.versionId, {
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

export const saveWaveform = mutation({
    args: {
        versionId: v.id("versions"),
        storageId: v.id("_storage"),
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.versionId, {
            waveformId: args.storageId,
        });
    },
});
