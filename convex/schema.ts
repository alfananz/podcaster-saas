import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    episodes: defineTable({
        title: v.string(),
        guest: v.optional(v.string()),
        date: v.string(),
        status: v.union(v.literal("processing"), v.literal("action_required"), v.literal("completed")),
        progress: v.optional(v.number()),
        imageUrl: v.string(),
        duration: v.optional(v.string()),
        issues: v.optional(v.string()),
        storageId: v.optional(v.id("_storage")),
        // Workstation Fields
        currentVersionId: v.optional(v.id("versions")), // Points to the active "Head"
        videoUrl: v.optional(v.string()),
        audioUrl: v.optional(v.string()),

        // AI Data
        transcript: v.optional(v.string()), // Full text
        transcriptJson: v.optional(v.any()), // The raw ElevenLabs JSON
        segments: v.optional(v.array(v.object({
            start: v.number(),
            end: v.number(),
            text: v.string(),
            speaker: v.string(),
        }))),
        speakers: v.optional(v.array(v.string())), // ["Speaker A", "Speaker B"]

        // Enrichment Data
        generatedTitle: v.optional(v.string()),
        summary: v.optional(v.string()),
        aiSynopsis: v.optional(v.string()), // Deeper analysis
        guestBio: v.optional(v.string()),
        keyTakeaways: v.optional(v.array(v.string())),
        seoTags: v.optional(v.array(v.string())),

        chapters: v.optional(v.array(v.object({
            startTime: v.number(), // Seconds
            title: v.string(),
            description: v.optional(v.string())
        }))),
        resources: v.optional(v.array(v.object({
            title: v.string(),
            url: v.optional(v.string())
        }))),

        enrichmentStatus: v.optional(v.union(v.literal("pending"), v.literal("completed"), v.literal("failed"))),

        // Pipeline State
        processingStage: v.optional(v.union(
            v.literal("queued"),
            v.literal("transcribing"),
            v.literal("enriching"),
            v.literal("completed"),
            v.literal("failed"),
            v.literal("revision_requested")
        )),
    }),
    versions: defineTable({
        episodeId: v.id("episodes"),
        versionNumber: v.number(),
        name: v.string(), // "v1.0", "Revision 1", etc.
        storageId: v.id("_storage"),
        videoUrl: v.optional(v.string()),
        authorId: v.optional(v.string()),
        status: v.union(v.literal("processing"), v.literal("active"), v.literal("archived")),
        changeLog: v.optional(v.string()), // "Fixed audio sync issues"
        uploadTime: v.number(),
    })
        .index("by_episode", ["episodeId"])
        .index("by_episode_version", ["episodeId", "versionNumber"]),
    assets: defineTable({
        storageId: v.string(),
        type: v.union(v.literal("video"), v.literal("audio"), v.literal("image"), v.literal("pdf"), v.literal("archive")),
        name: v.string(),
        size: v.number(), // in bytes
        uploadedAt: v.number(),
        userId: v.string(),
        episodeId: v.optional(v.id("episodes")),
        metadata: v.optional(v.object({
            duration: v.optional(v.string()), // e.g., "04:20"
            bitrate: v.optional(v.string()), // e.g., "128kbps"
            resolution: v.optional(v.string()), // e.g., "1920x1080"
            format: v.optional(v.string()), // e.g., "mp4"
        })),
    })
        .index("by_user", ["userId"])
        .index("by_episode", ["episodeId"])
        .index("by_type", ["type"]),
    revision_batches: defineTable({
        episodeId: v.id("episodes"),
        versionId: v.optional(v.id("versions")), // [NEW] Scope to version
        authorId: v.string(),
        note: v.string(),
        status: v.union(v.literal("open"), v.literal("resolved")),
        resolvedAt: v.optional(v.number()),
    })
        .index("by_episode", ["episodeId"])
        .index("by_status", ["status"]),
    comments: defineTable({
        episodeId: v.id("episodes"),
        versionId: v.optional(v.id("versions")), // Link to specific version
        text: v.string(),
        timestamp: v.number(), // in seconds
        user: v.object({
            name: v.string(),
            avatar: v.string(),
        }),
        isResolved: v.boolean(),
        parentId: v.optional(v.id("comments")), // For threading
        likes: v.number(),
        type: v.optional(v.string()), // e.g. "revision_request"
        revisionBatchId: v.optional(v.id("revision_batches")),
    })
        .index("by_episode", ["episodeId"])
        .index("by_parent", ["parentId"])
        .index("by_batch", ["revisionBatchId"])
        .index("by_version", ["versionId"])
        .index("by_episode_version", ["episodeId", "versionId"]),
    transcripts: defineTable({
        episodeId: v.id("episodes"),
        transcriptJson: v.any(),
    }).index("by_episode", ["episodeId"]),
});
