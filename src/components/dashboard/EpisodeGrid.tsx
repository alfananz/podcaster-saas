"use client";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { EpisodeCard } from "./EpisodeCard";

export function EpisodeGrid() {
    const episodes = useQuery(api.episodes.list);

    if (episodes === undefined) {
        return (
            <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-8">
                {[1, 2].map((i) => (
                    <div key={i} className="glass p-6 rounded-3xl animate-pulse h-96"></div>
                ))}
            </div>
        );
    }

    // Limit to most recent 6 for dashboard view if needed, or show all
    // Sorting should ideally happen in backend, assuming they come in some order or we sort here
    const sortedEpisodes = [...episodes].reverse(); // Show newest first if DB insert order

    return (
        <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-8">
            {sortedEpisodes.map((ep) => (
                <EpisodeCard key={ep._id} episode={ep as any} />
            ))}
            {sortedEpisodes.length === 0 && (
                <div className="col-span-full py-12 text-center text-white/20 font-bold border-2 border-dashed border-white/5 rounded-3xl">
                    No active episodes. Upload one to get started!
                </div>
            )}
        </div>
    );
}
