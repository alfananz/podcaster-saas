import React from 'react';
import { Id } from '../../../convex/_generated/dataModel';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: (string | undefined | null | false)[]) {
    return twMerge(clsx(inputs));
}

// Data Interface based on valid Convex response
export interface RevisionBatch {
    _id: Id<"revision_batches">;
    status: "open" | "resolved";
    note: string;
    formattedDate: string;
    resolvedDate?: string | null;
    author: { name: string; avatar: string };
    versionInfo?: { name: string; number: number } | null; // [NEW]
    comments: Array<{
        _id: Id<"comments">;
        timestamp: number;
        text: string;
        isResolved: boolean;
    }>;
}

interface RevisionCardProps {
    batch: RevisionBatch;
    index: number;
    totalBatches: number;
    active: boolean; // Computed by parent (e.g., status === 'open')
    onSeek?: (timestamp: number) => void;
}

export function RevisionCard({ batch, index, totalBatches, active, onSeek }: RevisionCardProps) {
    // Visual States
    const isResolved = batch.status === 'resolved';

    // Theme configuration
    const theme = active
        ? {
            border: 'border-[#ff4db5]',
            bg: 'bg-[#1A1D23]',
            text: 'text-[#ff4db5]',
            shadow: 'shadow-[0_0_25px_rgba(205,55,150,0.15)]',
            accentBg: 'bg-[#ff4db5]',
            accentText: 'text-[#ff4db5]',
            nodeBorder: 'border-[#ff4db5]',
            title: 'text-white'
        }
        : {
            border: 'border-[#22EE66]', // Green for resolved
            bg: 'bg-surface-dark/50',
            text: 'text-[#22EE66]',
            shadow: 'shadow-none',
            accentBg: 'bg-[#22EE66]',
            accentText: 'text-[#22EE66]',
            nodeBorder: 'border-[#22EE66]',
            title: 'text-white/70'
        };

    // Helpers
    const formatTime = (ms: number) => {
        const seconds = Math.floor(ms); // Stored as seconds in DB usually, provided spec said ms but existing app uses seconds
        // Wait, let's verify. The app uses 'seconds' mostly (AVSyncPlayer). But let's assume `timestamp` in comments is seconds.
        // If it's MS, we divide by 1000. Let's stick to MM:SS format helper.
        const min = Math.floor(seconds / 60);
        const sec = Math.floor(seconds % 60);
        return `${min < 10 ? '0' : ''}${min}:${sec < 10 ? '0' : ''}${sec}`;
    };

    return (
        <div className={cn("relative pl-4 mb-6 group transition-all duration-300", !active && !isResolved && "opacity-60 hover:opacity-100 grayscale-[0.5] hover:grayscale-0")}>
            {/* Timeline Dot - Aligned with Rail at -23px */}
            <div
                className={cn(
                    "absolute -left-[29px] top-6 size-[12px] rounded-full z-10 border-2 border-[#16181d]",
                    active
                        ? "bg-[#ff4dc3] shadow-[0_0_12px_#ff4dc3]"
                        : "bg-[#3DD263] shadow-[0_0_12px_rgba(61,210,99,0.3)]"
                )}
            ></div>

            {/* Card Container - Compact Styling */}
            <div
                className={cn(
                    "rounded-xl p-5 transition-all duration-300",
                    "bg-[#2e323a]/40 backdrop-blur-md border border-white/5", // Glass Card Base
                    active
                        ? "border-[#ff4dc3]/50 shadow-[0_0_20px_rgba(255,77,195,0.1),inset_0_0_10px_rgba(255,77,195,0.05)]" // Active Glow
                        : "border-[#3DD263]/20 hover:bg-[#2e323a]/60" // Resolved Border
                )}
            >
                {/* Header */}
                <div className="flex justify-between items-start mb-5">
                    <div>
                        <div className="flex items-baseline gap-3 mb-1.5">
                            <h3 className="text-lg font-bold text-white leading-none">
                                Revision {totalBatches - index}
                                {batch.versionInfo && <span className="ml-2 font-normal text-white/50">- {batch.versionInfo.name}</span>}
                            </h3>
                        </div>

                        <div className="flex items-center gap-3 text-[11px] font-bold tracking-wide">
                            {/* Status Text (No Pill) */}
                            <div className={cn("flex items-center gap-2", active ? "text-[#ff4dc3]" : "text-[#3DD263]")}>
                                <div className={cn("size-2 rounded-full", active ? "bg-[#ff4dc3] animate-pulse" : "bg-[#3DD263]")} />
                                {active ? "IN PROGRESS" : "RESOLVED"}
                            </div>

                            <span className="text-white/20 font-light">•</span>

                            {/* Date */}
                            <span className="text-white/30 font-medium normal-case tracking-normal">
                                Started {batch.formattedDate}
                            </span>
                        </div>
                    </div>


                </div>

                {/* General Brief Box - Compact */}
                {batch.note && (
                    <div className={cn(
                        "bg-[#1A1D23]/50 rounded-lg p-4 border-l-[3px] italic text-white/80 mb-6 text-sm leading-relaxed",
                        active ? "border-[#ff4dc3]" : "border-[#3DD263]/50 text-white/60"
                    )}>
                        <div className="flex items-center gap-2 mb-2 not-italic">
                            <span className={cn("material-symbols-outlined text-xs", active ? "text-[#ff4dc3]" : "text-[#3DD263]/70")}>sticky_note_2</span>
                            <span className={cn("text-[10px] font-bold uppercase tracking-widest", active ? "text-[#ff4dc3]/70" : "text-[#3DD263]/50")}>General Brief</span>
                        </div>
                        "{batch.note}"
                    </div>
                )}

                {/* Task List */}
                <div className="space-y-3">
                    {batch.comments.map((comment) => (
                        <div
                            key={comment._id}
                            className={cn(
                                "flex items-center justify-between p-2.5 rounded-lg border border-dashed transition-colors group",
                                active
                                    ? "border-white/10 hover:bg-white/5"
                                    : "bg-[#3DD263]/5 border-transparent"
                            )}
                        >
                            <div className="flex items-center gap-3">
                                {/* Square Checkbox */}
                                <div className={cn(
                                    "size-5 rounded-[4px] flex items-center justify-center transition-colors border",
                                    active
                                        ? "border-[#ff4dc3]/40 cursor-pointer hover:bg-[#ff4dc3]/10 bg-transparent"
                                        : "bg-[#3DD263] border-[#3DD263]"
                                )}>
                                    {!active && <span className="material-symbols-outlined text-[#16181d] text-[14px] font-bold">check</span>}
                                </div>

                                <span className={cn("text-sm font-medium", active ? "text-white/80 group-hover:text-white" : "text-white/40 line-through")}>
                                    {comment.text}
                                </span>
                            </div>

                            {/* Timeline Pill (Shown for both Active and Resolved) */}
                            {onSeek && (
                                <button
                                    onClick={() => onSeek(comment.timestamp)}
                                    className={cn(
                                        "px-2 py-0.5 rounded text-[10px] font-bold transition-all",
                                        active
                                            ? "bg-[#4FC0EE]/10 text-[#4FC0EE] hover:bg-[#4FC0EE] hover:text-[#16181d]"
                                            : "bg-white/5 text-white/30 hover:text-white"
                                    )}
                                >
                                    {formatTime(comment.timestamp)}
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
