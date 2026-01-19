import React from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import { RevisionCard } from './RevisionCard';

interface RevisionHistoryProps {
    episodeId: Id<"episodes">;
    onSeek?: (time: number) => void;
}

export function RevisionHistory({ episodeId, onSeek }: RevisionHistoryProps) {
    const batches = useQuery(api.revisions.list, { episodeId });

    if (!batches) {
        return <div className="p-8 text-center text-white/30 text-xs font-mono animate-pulse">LOADING HISTORY...</div>;
    }

    return (
        <div className="flex-1 overflow-y-auto custom-scrollbar relative pl-12 pr-6 py-8 h-full bg-[#111317]">
            <h2 className="text-[10px] font-black tracking-[0.3em] text-white/40 uppercase mb-8 ml-1">Revision History</h2>

            <div className="relative flex flex-col gap-0">
                {/* Glowing Spine Line */}
                <div className="absolute -left-[23px] top-4 bottom-10 w-[2px] bg-white/10">
                    <div className="absolute inset-0 bg-gradient-to-b from-[#ff4db5] via-[#ff4db5]/50 to-[#22EE66]/50 opacity-80 glowing-spine"></div>
                </div>

                {batches.map((batch, index) => (
                    <RevisionCard
                        key={batch._id}
                        batch={batch as any}
                        index={index}
                        totalBatches={batches.length}
                        active={batch.status === 'open'}
                        onSeek={onSeek}
                    />
                ))}

                {batches.length === 0 && (
                    <div className="ml-12 text-white/30 text-xs italic">No revision history found.</div>
                )}
            </div>
        </div>
    );
}

