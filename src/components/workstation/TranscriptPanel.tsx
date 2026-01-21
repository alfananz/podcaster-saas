import React, { useEffect, useRef, useMemo, useState } from 'react';
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
    language?: "en" | "ar"; // [NEW]
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

export function TranscriptPanel({ segments = [], currentTime, onSeek, className, language = "en" }: TranscriptPanelProps) {
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

    // Smooth scrolling logic using requestAnimationFrame for "camera follow" feel
    // [MODIFIED] Added explicit seek handling

    const isHoveringRef = useRef(false); // Use ref for mutable access in rAF
    const [isCopied, setIsCopied] = useState(false);

    // [MODIFED] Simpler "Always Center" logic
    const prevTimeRef = useRef(currentTime);
    const lastScrolledRef = useRef<string | null>(null);

    useEffect(() => {
        if (!scrollRef.current) return;
        const container = scrollRef.current;

        // 1. Determine if this was a seek (large jump)
        const delta = Math.abs(currentTime - prevTimeRef.current);
        const isSeek = delta > 0.5;
        prevTimeRef.current = currentTime;

        // 2. Hover check (Suspend only auto-scroll, allow seek)
        if (isHoveringRef.current && !isSeek) return;

        // 3. Find active element
        let activeEl = container.querySelector('[data-active="true"]') as HTMLElement;

        // Fallback for gaps
        if (!activeEl && segments.length > 0) {
            const closest = segments.reduce((prev, curr) =>
                Math.abs(curr.start - currentTime) < Math.abs(prev.start - currentTime) ? curr : prev
            );
            if (closest) {
                activeEl = container.querySelector(`[data-start="${closest.start}"]`) as HTMLElement;
            }
        }

        if (!activeEl) return;

        // 4. Calculate Position relative to container
        const containerRect = container.getBoundingClientRect();
        const elRect = activeEl.getBoundingClientRect();
        const activeWordStart = activeEl.dataset.start || null;

        if (isSeek) {
            // FORCE CENTER on Seek
            activeEl.scrollIntoView({ behavior: "auto", block: "center" });
            lastScrolledRef.current = activeWordStart;
        } else {
            // [LAZY FOLLOW] Only scroll if element is leaving the "Safe Zone"
            const relativeTop = elRect.top - containerRect.top;
            const safeZoneTop = containerRect.height * 0.3;     // Top 30% border
            const safeZoneBottom = containerRect.height * 0.7;  // Bottom 70% border

            const isAbove = relativeTop < safeZoneTop;
            const isBelow = (elRect.bottom - containerRect.top) > safeZoneBottom;

            if ((isAbove || isBelow) && activeWordStart !== lastScrolledRef.current) {
                activeEl.scrollIntoView({ behavior: "smooth", block: "center" });
                lastScrolledRef.current = activeWordStart;
            }
        }
    }, [currentTime, segments]);

    // Keep hover listeners simple
    useEffect(() => {
        const container = scrollRef.current;
        if (!container) return;

        const onMouseEnter = () => { isHoveringRef.current = true; };
        const onMouseLeave = () => { isHoveringRef.current = false; };

        container.addEventListener('mouseenter', onMouseEnter);
        container.addEventListener('mouseleave', onMouseLeave);

        return () => {
            container.removeEventListener('mouseenter', onMouseEnter);
            container.removeEventListener('mouseleave', onMouseLeave);
        };
    }, []);

    const handleCopyTranscript = () => {
        const fullText = segments.map(s => `${s.speaker}: ${s.text}`).join('\n');
        navigator.clipboard.writeText(fullText);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

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
            {/* NEW HEADER: Combined Title + Stats */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/5 bg-white/[0.02]">
                <div className="flex items-center gap-6">
                    {/* Title */}
                    <div className="flex items-center gap-3">
                        <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
                            <span className="material-symbols-outlined text-primary text-[18px]">description</span>
                        </div>
                        <span className="text-xs font-black uppercase tracking-widest text-white">Live Transcript</span>
                        {language === 'ar' && <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-white/50 font-bold">AR</span>}
                    </div>

                    {/* Separator */}
                    <div className="h-4 w-px bg-white/10"></div>

                    {/* Speaker Stats (Moved from footer) */}
                    <div className="flex items-center gap-3">
                        <div className="flex -space-x-2">
                            {Array.from(speakerMap.map.entries()).slice(0, 3).map(([speaker, color], i) => (
                                <div key={i} className={cn("size-5 rounded-full border border-[#0a0612] flex items-center justify-center text-[8px] font-bold text-black shadow-lg", color.bg)}>
                                    {getSpeakerInitial(speaker)}
                                </div>
                            ))}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-white/60 leading-tight">
                                {speakerMap.count} Speakers
                            </span>
                        </div>
                    </div>
                </div>

                {/* Right Actions */}
                {/* Right Actions */}
                <button
                    onClick={handleCopyTranscript}
                    className={cn(
                        "size-8 rounded-lg flex items-center justify-center transition-all duration-300 border cursor-pointer group",
                        isCopied
                            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                            : "bg-white/5 border-white/5 text-white/40 hover:bg-white/10 hover:text-white"
                    )}
                    title={isCopied ? "Copied!" : "Copy Transcript"}
                >
                    <span className={cn("material-symbols-outlined text-[18px] transition-transform duration-300", isCopied && "scale-110")}>
                        {isCopied ? "check" : "content_copy"}
                    </span>
                </button>
            </div >

            <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide relative" ref={scrollRef} dir={language === 'ar' ? 'rtl' : 'ltr'}>
                {blocks.map((block, idx) => {
                    const isActiveBlock = idx === activeBlockIndex;
                    const speakerColor = speakerMap.map.get(block.speaker) || SPEAKER_COLORS[0];

                    return (
                        <div
                            key={idx}
                            className={cn(
                                "relative transition-all duration-500 flex flex-col gap-3 group/block",
                                isActiveBlock // Active State
                                    ? "opacity-100"
                                    : "opacity-50 hover:opacity-100"
                            )}
                        >
                            <div className="flex gap-4">
                                {/* Left Column: Avatar & Time */}
                                <div className="shrink-0 flex flex-col items-center gap-2 pt-1">
                                    <div className={cn("size-8 rounded-full border flex items-center justify-center text-[10px] font-bold transition-all shadow-lg",
                                        isActiveBlock
                                            ? cn(speakerColor.border, speakerColor.bg, "text-black scale-110")
                                            : cn("border-transparent bg-white/5 text-white/40 group-hover/block:border-white/10 group-hover/block:bg-white/10")
                                    )}>
                                        {getSpeakerInitial(block.speaker)}
                                    </div>
                                </div>

                                {/* Right Column: Content */}
                                <div className={cn(
                                    "flex-1 p-5 rounded-2xl border transition-all duration-500",
                                    isActiveBlock
                                        ? cn("bg-white/5 border-white/5 shadow-[0_4px_20px_rgba(0,0,0,0.2)]", speakerColor.border + "/30")
                                        : "bg-transparent border-transparent"
                                )}>
                                    <div className="flex items-center gap-3 mb-2">
                                        <h4 className={cn(
                                            "text-[10px] font-black uppercase tracking-widest",
                                            isActiveBlock ? speakerColor.text : "text-white/40"
                                        )}>
                                            {formatSpeaker(block.speaker)}
                                        </h4>
                                        <span className="text-[10px] font-medium text-white/20 font-mono">
                                            {formatTime(block.startTime)}
                                        </span>
                                    </div>

                                    <p className="text-base leading-7 font-medium text-white/80">
                                        {block.words.map((word, wordIdx) => {
                                            // Optimization: Only check logic if block is active
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
                                                    data-active={isWordActive} // [NEW] Track active word
                                                    data-start={word.start} // [NEW] Track active word identity
                                                    className={cn(
                                                        "transition-all duration-100 cursor-pointer rounded px-0.5 inline-block mx-[1px]",
                                                        isWordActive
                                                            ? cn("z-10 relative", speakerColor.highlight, "bg-white/5") // Removed scale-110
                                                            : isActiveBlock ? "text-white hover:text-white hover:bg-white/10" : "text-white/60 hover:text-white"
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
                {/* Large padding at bottom to ensure last lines can scroll to center */}
                <div className="h-[50vh]"></div>
            </div>
        </section >
    );
}
