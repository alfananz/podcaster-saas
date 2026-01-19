"use node";
import { action } from "../_generated/server";
import { internal, api } from "../_generated/api";
import { v } from "convex/values";
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";

import { generateShowNotes } from "./enrich";

export const generateTranscript = action({
    args: {
        episodeId: v.id("episodes"),
        storageId: v.string(), // Use v.id("_storage") if storageId is ID
    },
    handler: async (ctx, args) => {
        const file = await ctx.storage.get(args.storageId as any); // Cast to ID if needed or fix arg type
        if (!file) {
            throw new Error("File not found");
        }

        // 1. Transcribe with ElevenLabs
        // NOTE: 'api' is used because these mutations are now public for self-hosted layout
        await ctx.runMutation(api.episodes.updateProcessingStage, {
            episodeId: args.episodeId,
            stage: "transcribing",
        });

        const client = new ElevenLabsClient({ apiKey: process.env.ELEVENLABS_API_KEY });
        const transcriptJson = await client.speechToText.convert({
            file,
            modelId: "scribe_v2",
            diarize: true,
            tagAudioEvents: true,
            languageCode: "eng",
        });

        const transcriptText = (transcriptJson as any).text || JSON.stringify(transcriptJson);
        const words = (transcriptJson as any).words || [];

        const segments = words.map((word: any) => ({
            start: word.start,
            end: word.end,
            text: word.text,
            speaker: word.speakerId || "Unknown",
        }));

        await ctx.runMutation(api.episodes.saveAIResults, {
            episodeId: args.episodeId,
            transcript: transcriptText,
            transcriptJson: transcriptJson,
            segments: segments,
            speakers: [], // Todo: Extract speakers
        });

        // 2. Enrich with Gemini
        await ctx.runMutation(api.episodes.updateProcessingStage, {
            episodeId: args.episodeId,
            stage: "enriching",
        });

        try {
            const enrichmentData = await generateShowNotes(transcriptText);

            await ctx.runMutation(api.episodes.updateEnrichment, {
                episodeId: args.episodeId,
                generatedTitle: enrichmentData.title,
                summary: enrichmentData.summary,
                keyTakeaways: enrichmentData.keyTakeaways,
                seoTags: enrichmentData.seoTags,
                enrichmentStatus: "completed",
            });
            await ctx.runMutation(api.episodes.updateProcessingStage, {
                episodeId: args.episodeId,
                stage: "completed",
                status: "completed"
            });
        } catch (error) {
            console.error("Enrichment failed", error);
            await ctx.runMutation(api.episodes.updateEnrichment, {
                episodeId: args.episodeId,
                enrichmentStatus: "failed",
            });
            await ctx.runMutation(api.episodes.updateProcessingStage, {
                episodeId: args.episodeId,
                stage: "failed", // or completed with partial success
                status: "action_required"
            });
        }
    },
});
