"use node";

// CRITICAL FIX: Force internal networking for Convex Client (runMutation)
// This MUST run before imports to ensure the client is initialized with the local address.
// Without this, 'ctx.runMutation' fails because it tries to hit the public URL.
if (process.env.CONVEX_CLOUD_URL?.includes('api.mellostudio.com') || !process.env.CONVEX_CLOUD_URL) {
    process.env.CONVEX_CLOUD_URL = "http://127.0.0.1:3210";
    console.log(" [NETWORKING] Forced CONVEX_CLOUD_URL -> http://127.0.0.1:3210");
}

import { action } from "../_generated/server";
import { internal, api } from "../_generated/api";
import { v } from "convex/values";
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import { generateShowNotes } from "./enrich";

export const run = action({
    args: {
        episodeId: v.id("episodes"),
        storageId: v.id("_storage"),
    },
    handler: async (ctx, args) => {
        // --- SELF-HOSTED NETWORKING FIX ---
        // The default 'ctx.runMutation' is bound to the public URL, which fails inside Docker (NAT Loopback).
        // We manually create a client pointing to the INTERNAL Docker address, which we know works (127.0.0.1:3210).
        let mutationClient = {
            mutation: (fn: any, args: any) => ctx.runMutation(fn, args), // Default to standard client
            query: (fn: any, args: any) => ctx.runQuery(fn, args)
        };

        // If we detect we are in the self-hosted environment, use the manual client
        if (process.env.CONVEX_CLOUD_URL?.includes('api.mellostudio.com') || process.env.CONVEX_CLOUD_URL?.includes('127.0.0.1')) {
            console.log(" [NETWORKING_MANUAL_CLIENT] Initializing Manual Client for 127.0.0.1:3210");
            const { ConvexHttpClient } = await import("convex/browser");
            const internalUrl = "http://127.0.0.1:3210";

            // We use the browser client because it allows specifying a custom URL easily at runtime
            const rawClient = new ConvexHttpClient(internalUrl);

            // Override the mutation helper
            mutationClient.mutation = async (fn: any, args: any) => {
                // If an admin key is available, use it. Otherwise, assume internal trust.
                const key = process.env.CONVEX_SELF_HOSTED_ADMIN_KEY;
                if (key) rawClient.setAuth(key);
                return rawClient.mutation(fn, args);
            };

            // Override the query helper (for storage URL retrieval)
            mutationClient.query = async (fn: any, args: any) => {
                const key = process.env.CONVEX_SELF_HOSTED_ADMIN_KEY;
                if (key) rawClient.setAuth(key);
                return rawClient.query(fn, args);
            };
        }

        try {
            // 1. Update State to Transcribing
            console.log("STEP 0: Starting Process via Mutation Client");
            // NOTE: We now use 'api' because we exposed these as public mutations for the manual client
            await mutationClient.mutation(api.episodes.updateProcessingStage, {
                episodeId: args.episodeId,
                stage: "transcribing",
                progress: 10,
            });

            // 2. Fetch File (The Critical Fix)
            // We use the manual client to ask the backend for the URL, avoiding the broken ActionCtx RPC
            const publicUrl = await mutationClient.query(api.episodes.getStorageUrl, { storageId: args.storageId });
            if (!publicUrl) throw new Error("File URL not found in storage");

            let fetchUrl = publicUrl;
            if (publicUrl.includes("api.mellostudio.com")) {
                fetchUrl = publicUrl.replace("https://api.mellostudio.com", "http://127.0.0.1:3210");
                console.log(`[Self-Hosted Fix] Rewrote URL for Docker Fetch: ${fetchUrl}`);
            } else {
                console.log(`[Cloud/Local] Using original URL: ${fetchUrl}`);
            }

            const fileResponse = await fetch(fetchUrl);
            if (!fileResponse.ok) throw new Error(`Failed to fetch file: ${fileResponse.statusText}`);
            const file = await fileResponse.blob();

            // 3. ElevenLabs Transcription
            console.log("STEP 2: Starting Transcription", args.episodeId);
            const client = new ElevenLabsClient({ apiKey: process.env.ELEVENLABS_API_KEY });

            const transcriptResponse = await client.speechToText.convert({
                file,
                modelId: "scribe_v2",
                diarize: true,
                tagAudioEvents: true,
                languageCode: "eng",
            });
            console.log("STEP 3: Transcription Complete");

            // 4. Update State to Enriching
            await mutationClient.mutation(api.episodes.updateProcessingStage, {
                episodeId: args.episodeId,
                stage: "enriching",
                progress: 50,
            });

            // 5. Parse Results
            const text = (transcriptResponse as any).text || "";
            const words = (transcriptResponse as any).words || [];

            const speakers = new Set<string>();
            const segments = words.map((word: any) => ({
                start: word.start,
                end: word.end,
                text: word.text,
                speaker: word.speakerId || "Unknown",
            }));

            words.forEach((word: any) => {
                if (word.speakerId) {
                    speakers.add(word.speakerId);
                }
            });

            // 6. Save Base Results - Split into two calls to prevent timeouts
            console.log("STEP 3.1: Saving Heavy Transcript JSON");
            await mutationClient.mutation(api.episodes.saveTranscript, {
                episodeId: args.episodeId,
                transcriptJson: transcriptResponse,
            });

            console.log("STEP 3.2: Updating Episode Metadata");
            await mutationClient.mutation(api.episodes.updateEpisodeAIResults, {
                episodeId: args.episodeId,
                transcript: text,
                segments: segments,
                speakers: Array.from(speakers),
            });

            // 7. Enriched Show Notes
            console.log("STEP 4: Generating Show Notes");
            try {
                await mutationClient.mutation(api.episodes.updateProcessingStage, {
                    episodeId: args.episodeId,
                    stage: "enriching",
                    progress: 75,
                });

                const enrichmentData = await generateShowNotes(segments);

                await mutationClient.mutation(api.episodes.updateEnrichment, {
                    episodeId: args.episodeId,
                    generatedTitle: enrichmentData.title,
                    summary: enrichmentData.summary,
                    aiSynopsis: enrichmentData.aiSynopsis,
                    guestBio: enrichmentData.guestBio,
                    keyTakeaways: enrichmentData.keyTakeaways,
                    seoTags: enrichmentData.seoTags,
                    chapters: enrichmentData.chapters,
                    resources: enrichmentData.resources,
                    enrichmentStatus: "completed",
                });
            } catch (err) {
                console.error("Show Notes Generation Failed:", err);
                await mutationClient.mutation(api.episodes.updateEnrichment, {
                    episodeId: args.episodeId,
                    enrichmentStatus: "failed",
                });
            }

            // 8. Complete
            await mutationClient.mutation(api.episodes.updateProcessingStage, {
                episodeId: args.episodeId,
                stage: "completed",
                status: "action_required", // Set to action_required so user reviews it
                progress: 100,
            });

        } catch (error) {
            console.error("Processing failed:", error);
            // Even if the manual client fails, try to log the error using it
            try {
                await mutationClient.mutation(api.episodes.updateProcessingStage, {
                    episodeId: args.episodeId,
                    stage: "failed",
                    status: "action_required", // Ensure UI shows the red badge
                    errorMessage: (error as Error).message || "Unknown error occurred",
                });
            } catch (e) {
                console.error("Failed to report error state:", e);
            }
        }
    },
});
