import { query } from "./_generated/server";
import { v } from "convex/values";

export const inspectEpisode = query({
    args: { id: v.id("episodes") },
    handler: async (ctx, args) => {
        const episode = await ctx.db.get(args.id);
        return {
            _id: episode?._id,
            speakers: episode?.speakers,
            segmentSample: episode?.segments?.slice(0, 5),
            // We want to see the valid keys in the first few words of the raw JSON
            rawWordSample: episode?.transcriptJson?.words ? episode.transcriptJson.words.slice(0, 3) : "No words in raw JSON",
        };
    },
});
