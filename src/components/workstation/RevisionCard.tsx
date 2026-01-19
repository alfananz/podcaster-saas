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
        <div className={cn("relative mb-12 group transition-all duration-300", !active && !isResolved && "opacity-60 hover:opacity-100 grayscale-[0.5] hover:grayscale-0")}>
            {/* Timeline Anchor */}
            <div
                className={cn(
                    "absolute -left-[30px] top-8 size-4 rounded-full border-4 border-[#111317] ring-4 z-10",
                    active ? "bg-[#ff4db5] ring-primary/20" : "bg-[#22EE66] ring-[#22EE66]/20"
                )}
            ></div>

            <div className={cn("rounded-xl border transition-colors", active ? "border-[#ff4db5]/50" : "border-white/5")}>
                <div className={cn("rounded-[14px] overflow-hidden", active ? "bg-gradient-to-br from-[#ff4db5]/10 via-transparent to-transparent" : "bg-[#1A1D23]/50")}>
                    <div className="flex flex-col">

                        {/* Top Info Bar */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-white/5">
                            <div className="flex items-center gap-4">
                                <h3 className={cn("text-xl font-black tracking-tight", isResolved ? "text-white" : "text-[#ff4db5]")}>
                                    REVISION {totalBatches - index}
                                </h3>

                                {active && (
                                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ff4db5]/10 text-[#ff4db5] text-[10px] font-bold border border-[#ff4db5]/20 animate-pulse">
                                        <span className="size-1.5 rounded-full bg-[#ff4db5]"></span>
                                        ACTIVE
                                    </span>
                                )}

                                {isResolved && (
                                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#22EE66]/10 text-[#22EE66] text-[10px] font-bold border border-[#22EE66]/20">
                                        <span className="material-symbols-outlined text-[12px]">check_circle</span>
                                        RESOLVED
                                    </span>
                                )}
                            </div>

                            <div className="flex items-center gap-2 text-white/40 text-[10px] font-mono uppercase tracking-widest">
                                <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                                {batch.formattedDate}
                            </div>
                        </div>

                        {/* Brief & Content */}
                        <div className="p-6 space-y-6">
                            {/* Brief Section */}
                            <div className="space-y-4">
                                <label className="text-white/30 text-[10px] font-bold uppercase tracking-widest">General Brief</label>
                                <div className="flex gap-4">
                                    <div className="flex-1 p-4 rounded-xl bg-white/5 border border-white/5 italic text-white/80 font-medium text-sm leading-relaxed flex gap-3">
                                        <span className="material-symbols-outlined text-white/30">info</span>
                                        "{batch.note}"
                                    </div>
                                </div>
                            </div>

                            {/* Task List */}
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <label className="text-white/30 text-[10px] font-bold uppercase tracking-widest">
                                        Granular Feedback ({batch.comments.length})
                                    </label>
                                </div>

                                <div className="space-y-3">
                                    {batch.comments.map((comment) => (
                                        <div
                                            key={comment._id}
                                            className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors group/task"
                                        >
                                            {/* Timestamp Pill */}
                                            <button
                                                onClick={() => onSeek?.(comment.timestamp)}
                                                className="px-3 py-1 rounded bg-[#3C8CE7]/10 text-[#3C8CE7] text-[10px] font-black font-mono tracking-tighter border border-[#3C8CE7]/20 hover:bg-[#3C8CE7]/20 transition-colors cursor-pointer"
                                            >
                                                [{formatTime(comment.timestamp)}]
                                            </button>

                                            <div className="flex-1">
                                                <p className={cn("text-sm font-medium", comment.isResolved ? "text-white/40 line-through" : "text-white")}>
                                                    {comment.text}
                                                </p>
                                            </div>

                                            {/* Action Buttons (Mock for now, could be Resolve) */}
                                            <div className="opacity-0 group-hover/task:opacity-100 transition-opacity flex gap-2">
                                                {comment.isResolved ? (
                                                    <span className="material-symbols-outlined text-[#22EE66]">check</span>
                                                ) : (
                                                    <button className="size-8 rounded-lg flex items-center justify-center hover:bg-white/10 text-white/40 hover:text-white transition-colors">
                                                        <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Approved By Footer (If Resolved) */}
                        {isResolved && (
                            <div className="px-6 py-4 bg-[#22EE66]/5 border-t border-[#22EE66]/10 flex items-center justify-between">
                                <p className="text-[#22EE66] text-xs font-bold uppercase tracking-widest">
                                    Approved by Lead Producer
                                </p>
                                <div className="size-6 rounded-full bg-[#22EE66]/20 flex items-center justify-center text-[#22EE66]">
                                    <span className="material-symbols-outlined text-[14px]">done_all</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
