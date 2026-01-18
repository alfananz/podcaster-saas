import React, { useEffect, useRef, useMemo } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: (string | undefined | null | false)[]) {
    return twMerge(clsx(inputs));
}

export interface TranscriptWord {
    start: number;
    end: number;
    text: string;
    speaker: string;
}

interface TranscriptPanelProps {
    segments?: TranscriptWord[];
    currentTime: number;
    onSeek?: (time: number) => void;
    className?: string; // New prop for styling flexibility
}

interface SpeakerBlock {
    speaker: string;
    words: TranscriptWord[];
    startTime: number;
    endTime: number;
}

export function TranscriptPanel({ segments = [], currentTime, onSeek, className }: TranscriptPanelProps) {
    const scrollRef = useRef<HTMLDivElement>(null);

    // Group words into speaker blocks
    const blocks = useMemo(() => {
        if (!segments || segments.length === 0) return [];

        const result: SpeakerBlock[] = [];
        let currentBlock: SpeakerBlock | null = null;
        const SEGMENT_DURATION = 5; // User requested 5-second paragraphs

        segments.forEach((word) => {
            const shouldStartNewBlock = !currentBlock ||
                currentBlock.speaker !== word.speaker ||
                (word.start - currentBlock.startTime >= SEGMENT_DURATION);

            if (shouldStartNewBlock) {
                if (currentBlock) result.push(currentBlock);
                currentBlock = {
                    speaker: word.speaker,
                    words: [word],
                    startTime: word.start,
                    endTime: word.end
                };
            } else {
                currentBlock!.words.push(word);
                currentBlock!.endTime = word.end;
            }
        });
        if (currentBlock) result.push(currentBlock);
        return result;
    }, [segments]);

    // Find active block
    const activeBlockIndex = blocks.findIndex(block => currentTime >= block.startTime && currentTime <= block.endTime);

    // Auto-scroll logic (scroll to active BLOCK)
    useEffect(() => {
        if (activeBlockIndex !== -1 && scrollRef.current) {
            const activeElement = scrollRef.current.children[activeBlockIndex] as HTMLElement;
            if (activeElement) {
                activeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    }, [activeBlockIndex]);

    const formatSpeaker = (speakerId: string) => {
        if (speakerId === "speaker_0") return "Speaker A";
        if (speakerId === "speaker_1") return "Speaker B";
        return speakerId.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
    };

    const formatTime = (seconds: number) => {
        const min = Math.floor(seconds / 60);
        const sec = Math.floor(seconds % 60);
        return `${min < 10 ? '0' : ''}${min}:${sec < 10 ? '0' : ''}${sec}`;
    };

    if (blocks.length === 0) {
        return (
            <section className="w-1/3 border-l border-white/5 bg-black/40 backdrop-blur-3xl flex flex-col min-w-[400px] h-full">
                <div className="flex border-b border-white/5 p-2">
                    <button className="flex-1 py-4 text-xs font-bold uppercase tracking-widest text-white relative">Transcript</button>
                </div>
                <div className="flex-1 flex items-center justify-center text-white/20 text-sm">
                    Waiting for transcript...
                </div>
            </section>
        );
    }

    return (
        <section className={cn("flex flex-col h-full min-w-[400px]", className)}>
            {/* Header removed - handled by parent */}

            <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-hide relative" ref={scrollRef}>
                {blocks.map((block, idx) => {
                    const isActiveBlock = idx === activeBlockIndex;

                    return (
                        <div
                            key={idx}
                            className={cn(
                                "relative transition-all duration-500 flex flex-col gap-4 border",
                                isActiveBlock
                                    ? "opacity-100 scale-[1.02] border-pink-500/30 bg-pink-500/5 shadow-[0_0_30px_rgba(236,72,153,0.15)] rounded-3xl p-6"
                                    : "opacity-40 hover:opacity-100 border-transparent p-4"
                            )}
                        >
                            {/* Timestamp Header (Only for active or hover) */}
                            <div className="flex items-center justify-between">
                                <span className={cn(
                                    "text-[10px] font-bold tracking-widest uppercase",
                                    isActiveBlock ? "text-pink-400" : "text-white/30"
                                )}>
                                    {formatTime(block.startTime)}
                                </span>

                                {isActiveBlock && (
                                    <div className="flex items-center gap-2">
                                        <div className="size-1.5 rounded-full bg-pink-500 animate-pulse" />
                                        <span className="text-[10px] font-bold text-pink-500 tracking-widest uppercase">Speaking</span>
                                    </div>
                                )}
                            </div>


                            <div className="flex gap-4">
                                <div className="shrink-0 flex flex-col items-center gap-2">
                                    <div className={cn("size-8 rounded-full border flex items-center justify-center text-[10px] font-bold transition-colors",
                                        block.speaker.includes("0")
                                            ? (isActiveBlock ? "border-pink-500 bg-pink-500 text-black" : "border-white/20 bg-white/5 text-white/40")
                                            : "border-white/20 bg-white/5 text-white/60"
                                    )}>
                                        {block.speaker.includes("0") ? "A" : "B"}
                                    </div>
                                </div>

                                <div className="flex-1">
                                    <h4 className={cn(
                                        "text-[10px] font-bold uppercase tracking-widest mb-3",
                                        isActiveBlock ? "text-white" : "text-white/40"
                                    )}>
                                        {formatSpeaker(block.speaker)}
                                    </h4>

                                    <p className="text-base leading-relaxed">
                                        {block.words.map((word, wordIdx) => {
                                            const isWordActive = currentTime >= word.start && currentTime <= word.end;
                                            return (
                                                <span
                                                    key={wordIdx}
                                                    onClick={() => onSeek?.(word.start)}
                                                    className={cn(
                                                        "transition-all duration-150 cursor-pointer rounded px-0.5 inline-block mx-[1px]",
                                                        isWordActive
                                                            ? "text-pink-400 font-bold drop-shadow-[0_0_10px_rgba(244,114,182,0.5)] scale-105"
                                                            : isActiveBlock ? "text-white/90 hover:text-pink-200" : "text-white/60 hover:text-white"
                                                    )}
                                                >
                                                    {word.text}
                                                </span>
                                            );
                                        })}
                                    </p>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="p-6 bg-black/40 border-t border-white/5 backdrop-blur-xl mt-auto z-10">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-pink-500 text-[20px] animate-pulse">auto_fix_high</span>
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-pink-500">Live Sync Active</span>
                    </div>
                    <button className="size-9 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 border border-white/5 transition-colors cursor-pointer group">
                        <span className="material-symbols-outlined text-[20px] text-white/40 group-hover:text-white transition-colors">download</span>
                    </button>
                </div>
            </div>
        </section>
    );
}
