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

// Define Speaker Colors based on theme
const SPEAKER_COLORS = [
    {
        name: 'pink',
        text: 'text-pink-500',
        border: 'border-pink-500',
        bg: 'bg-pink-500',
        shadow: 'shadow-[0_0_30px_rgba(236,72,153,0.15)]',
        highlight: 'text-pink-400 shadow-[0_0_10px_rgba(244,114,182,0.5)]'
    },
    {
        name: 'blue',
        text: 'text-[#3C8CE7]',
        border: 'border-[#3C8CE7]',
        bg: 'bg-[#3C8CE7]',
        shadow: 'shadow-[0_0_30px_rgba(60,140,231,0.15)]',
        highlight: 'text-[#60a5fa] shadow-[0_0_10px_rgba(96,165,250,0.5)]'
    },
    {
        name: 'cyan',
        text: 'text-cyan-400',
        border: 'border-cyan-400',
        bg: 'bg-cyan-400',
        shadow: 'shadow-[0_0_30px_rgba(34,211,238,0.15)]',
        highlight: 'text-cyan-300 shadow-[0_0_10px_rgba(103,232,249,0.5)]'
    },
    {
        name: 'emerald',
        text: 'text-emerald-400',
        border: 'border-emerald-400',
        bg: 'bg-emerald-400',
        shadow: 'shadow-[0_0_30px_rgba(52,211,153,0.15)]',
        highlight: 'text-emerald-300 shadow-[0_0_10px_rgba(110,231,183,0.5)]'
    },
    {
        name: 'purple',
        text: 'text-purple-400',
        border: 'border-purple-400',
        bg: 'bg-purple-400',
        shadow: 'shadow-[0_0_30px_rgba(192,132,252,0.15)]',
        highlight: 'text-purple-300 shadow-[0_0_10px_rgba(216,180,254,0.5)]'
    },
    {
        name: 'yellow',
        text: 'text-[#FFF545]',
        border: 'border-[#FFF545]',
        bg: 'bg-[#FFF545]',
        shadow: 'shadow-[0_0_30px_rgba(255,245,69,0.15)]',
        highlight: 'text-yellow-200 shadow-[0_0_10px_rgba(253,224,71,0.5)]'
    }
];

export function TranscriptPanel({ segments = [], currentTime, onSeek, className }: TranscriptPanelProps) {
    const scrollRef = useRef<HTMLDivElement>(null);

    // Identify unique speakers and assign colors
    const speakerMap = useMemo(() => {
        const uniqueSpeakers = Array.from(new Set(segments.map(s => s.speaker))).sort();
        const map = new Map<string, typeof SPEAKER_COLORS[0]>();
        uniqueSpeakers.forEach((speaker, index) => {
            map.set(speaker, SPEAKER_COLORS[index % SPEAKER_COLORS.length]);
        });
        return { map, count: uniqueSpeakers.length };
    }, [segments]);

    // Group words into speaker blocks
    const blocks = useMemo(() => {
        if (!segments || segments.length === 0) return [];

        const result: SpeakerBlock[] = [];
        let currentBlock: SpeakerBlock | null = null;
        segments.forEach((word) => {
            const shouldStartNewBlock = !currentBlock ||
                currentBlock.speaker !== word.speaker;

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
        // Handle "speaker_0", "speaker_1" etc. or raw names
        if (speakerId.toLowerCase().startsWith("speaker_")) {
            const num = speakerId.split('_')[1];
            return `Speaker ${parseInt(num) + 1}`;
        }
        return speakerId.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
    };

    const getSpeakerInitial = (speakerId: string) => {
        if (speakerId.toLowerCase().startsWith("speaker_")) {
            const num = speakerId.split('_')[1];
            return String.fromCharCode(65 + parseInt(num)); // A, B, C...
        }
        return speakerId.charAt(0).toUpperCase();
    }

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
                    const speakerColor = speakerMap.map.get(block.speaker) || SPEAKER_COLORS[0];

                    return (
                        <div
                            key={idx}
                            className={cn(
                                "relative transition-all duration-500 flex flex-col gap-4 border",
                                isActiveBlock
                                    ? cn("opacity-100 scale-[1.02] bg-white/5 rounded-3xl p-6", speakerColor.border, speakerColor.shadow)
                                    : "opacity-40 hover:opacity-100 border-transparent p-4"
                            )}
                            style={isActiveBlock ? { borderColor: 'rgba(255,255,255,0.1)' } : {}}
                        >
                            {/* Timestamp Header (Only for active or hover) */}
                            <div className="flex items-center justify-between">
                                <span className={cn(
                                    "text-[10px] font-bold tracking-widest uppercase",
                                    isActiveBlock ? speakerColor.text : "text-white/30"
                                )}>
                                    {formatTime(block.startTime)}
                                </span>

                                {isActiveBlock && (
                                    <div className="flex items-center gap-2">
                                        <div className={cn("size-1.5 rounded-full animate-pulse", speakerColor.bg)} />
                                        <span className={cn("text-[10px] font-bold tracking-widest uppercase", speakerColor.text)}>Speaking</span>
                                    </div>
                                )}
                            </div>


                            <div className="flex gap-4">
                                <div className="shrink-0 flex flex-col items-center gap-2">
                                    <div className={cn("size-8 rounded-full border flex items-center justify-center text-[10px] font-bold transition-colors",
                                        isActiveBlock
                                            ? cn(speakerColor.border, speakerColor.bg, "text-black")
                                            : "border-white/20 bg-white/5 text-white/60"
                                    )}>
                                        {getSpeakerInitial(block.speaker)}
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
                                            // Optimization: Only check logic if block is active
                                            // Gap-Filling: Highlight until the NEXT word starts
                                            let isWordActive = false;
                                            if (isActiveBlock) {
                                                const nextWord = block.words[wordIdx + 1];
                                                const activeEnd = nextWord ? nextWord.start : word.end;
                                                isWordActive = currentTime >= word.start && currentTime < activeEnd;
                                            }

                                            return (
                                                <span
                                                    key={wordIdx}
                                                    onClick={() => onSeek?.(word.start)}
                                                    className={cn(
                                                        "transition-all duration-75 cursor-pointer rounded px-0.5 inline-block mx-[1px]",
                                                        isWordActive
                                                            ? cn("font-bold scale-105", speakerColor.highlight)
                                                            : isActiveBlock ? "text-white/90 hover:text-white" : "text-white/60 hover:text-white"
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
                        {/* Dynamic Speaker Count */}
                        <div className="flex -space-x-2">
                            {Array.from(speakerMap.map.entries()).slice(0, 3).map(([speaker, color], i) => (
                                <div key={i} className={cn("size-6 rounded-full border border-black flex items-center justify-center text-[8px] font-bold text-black", color.bg)}>
                                    {getSpeakerInitial(speaker)}
                                </div>
                            ))}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-bold text-white leading-none">
                                {speakerMap.count} Speakers Identified
                            </span>
                            <span className="text-[10px] font-semibold text-white/40 tracking-wider">
                                CONFIDENCE: 98%
                            </span>
                        </div>
                    </div>
                    <button className="size-9 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 border border-white/5 transition-colors cursor-pointer group">
                        <span className="material-symbols-outlined text-[20px] text-white/40 group-hover:text-white transition-colors">download</span>
                    </button>
                </div>
            </div>
        </section>
    );
}
