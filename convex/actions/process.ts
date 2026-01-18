"use node";
import { action } from "../_generated/server";
import { internal } from "../_generated/api";
import { v } from "convex/values";
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import { generateShowNotes } from "./enrich";

export const run = action({
    args: {
        episodeId: v.id("episodes"),
        storageId: v.id("_storage"),
    },
    handler: async (ctx, args) => {
        try {
            // 1. Update State to Transcribing
            await ctx.runMutation(internal.episodes.updateProcessingStage, {
                episodeId: args.episodeId,
                stage: "transcribing",
                progress: 10,
            });

            // 2. Fetch File
            const file = await ctx.storage.get(args.storageId);
            if (!file) throw new Error("File not found in storage");

            // 3. ElevenLabs Transcription
            console.log("STEP 1: Starting Transcription", args.episodeId);
            const client = new ElevenLabsClient({ apiKey: process.env.ELEVENLABS_API_KEY });

            // "scribe_v2" is the model ID for Scribe.
            const transcriptResponse = await client.speechToText.convert({
                file,
                modelId: "scribe_v2",
                diarize: true,
                tagAudioEvents: true,
                languageCode: "eng",
            });
            console.log("STEP 2: Transcription Complete", JSON.stringify(transcriptResponse).substring(0, 200) + "..."); // Log truncated result

            // 4. Update State to Enriching
            await ctx.runMutation(internal.episodes.updateProcessingStage, {
                episodeId: args.episodeId,
                stage: "enriching",
                progress: 50,
            });

            // 5. Parse Results
            // Assuming transcriptResponse follows the Scribe output format
            const text = (transcriptResponse as any).text || "";
            const words = (transcriptResponse as any).words || [];

            const speakers = new Set<string>();
            const segments = words.map((word: any) => ({
                start: word.start,
                end: word.end,
                text: word.text,
                speaker: word.speaker_id || "Unknown",
            }));

            words.forEach((word: any) => {
                if (word.speaker_id) {
                    speakers.add(word.speaker_id);
                }
            });

            // 6. Save Base Results
            await ctx.runMutation(internal.episodes.saveAIResults, {
                episodeId: args.episodeId,
                transcript: text,
                transcriptJson: transcriptResponse,
                segments: segments,
                speakers: Array.from(speakers),
            });

            // 7. Enriched Show Notes
            console.log("STEP 3: Generating Show Notes");
            try {
                // Update stage
                await ctx.runMutation(internal.episodes.updateProcessingStage, {
                    episodeId: args.episodeId,
                    stage: "enriching",
                    progress: 75,
                });

                const enrichmentData = await generateShowNotes(segments); // Pass segments, not text

                await ctx.runMutation(internal.episodes.updateEnrichment, {
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
                // We don't fail the whole pipeline, just mark enrichment as failed
                await ctx.runMutation(internal.episodes.updateEnrichment, {
                    episodeId: args.episodeId,
                    enrichmentStatus: "failed",
                });
            }

            // 7. Complete
            await ctx.runMutation(internal.episodes.updateProcessingStage, {
                episodeId: args.episodeId,
                stage: "completed",
                status: "action_required", // Set to action_required so user reviews it
                progress: 100,
            });

        } catch (error) {
            console.error("Processing failed:", error);
            await ctx.runMutation(internal.episodes.updateProcessingStage, {
                episodeId: args.episodeId,
                stage: "failed",
                status: "action_required", // Ensure UI shows the red badge
                errorMessage: (error as Error).message || "Unknown error occurred",
            });
        }
    },
});
