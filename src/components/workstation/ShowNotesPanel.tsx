import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: (string | undefined | null | false)[]) {
    return twMerge(clsx(inputs));
}

interface Chapter {
    startTime: number;
    title: string;
    description?: string;
}

interface Resource {
    title: string;
    url?: string;
}

interface ShowNotesPanelProps {
    summary?: string;
    aiSynopsis?: string;
    chapters?: Chapter[];
    resources?: Resource[];
    guestBio?: string;
    onSeek?: (time: number) => void;
    // Header Props for the shared header (temporarily handled by Parent but UI rendered here if needed)
}

export function ShowNotesPanel({
    summary,
    aiSynopsis,
    chapters = [],
    resources = [],
    onSeek
}: ShowNotesPanelProps) {

    const formatTime = (seconds: number) => {
        const min = Math.floor(seconds / 60);
        const sec = Math.floor(seconds % 60);
        return `${min < 10 ? '0' : ''}${min}:${sec < 10 ? '0' : ''}${sec}`;
    };

    return (
        <section className="w-1/3 border-l border-white/5 bg-black/40 backdrop-blur-3xl flex flex-col min-w-[400px] h-full">
            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-hide">

                {/* SUMMARY CARD */}
                <div className="relative overflow-hidden rounded-3xl bg-[#1a1625] border border-white/5 p-1">
                    {/* Glass Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-blue-500/5 pointer-events-none" />

                    {/* Thumbnail / Header Image Placeholder */}
                    <div className="h-32 w-full bg-[#13111a] rounded-t-[20px] flex items-center justify-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-900/20 to-blue-900/20" />
                        <span className="material-symbols-outlined text-4xl text-white/10">equalizer</span>
                    </div>

                    <div className="p-6 relative">
                        <div className="flex items-center gap-2 mb-4">
                            <span className="material-symbols-outlined text-purple-400 text-lg">auto_awesome</span>
                            <h3 className="text-sm font-bold text-white tracking-wide">AI-Generated Synopsis</h3>
                        </div>

                        <p className="text-sm leading-relaxed text-white/70 mb-6">
                            {aiSynopsis || summary || "Generate Show Notes to see a deep dive analysis of this episode."}
                        </p>

                        <button className="w-full py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-xs font-bold uppercase tracking-widest text-white/50 hover:text-white">
                            Read Full Analysis
                        </button>
                    </div>
                </div>

                {/* CHAPTERS */}
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-blue-400">toc</span>
                            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-white/60">Chapters</h3>
                        </div>
                        <div className="px-2 py-1 rounded bg-blue-500/20 border border-blue-500/30">
                            <span className="text-[9px] font-bold text-blue-400 uppercase tracking-wider">Auto-Chaptering ON</span>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {chapters.length > 0 ? chapters.map((chapter, idx) => (
                            <button
                                key={idx}
                                onClick={() => onSeek?.(chapter.startTime)}
                                className="w-full text-left group p-4 rounded-2xl bg-[#13111a] border border-white/5 hover:border-white/10 hover:bg-[#1a1625] transition-all flex items-start gap-4"
                            >
                                <div className="px-2 py-1 rounded bg-blue-500/10 border border-blue-500/20 group-hover:bg-blue-500/20 transition-colors shrink-0">
                                    <span className="text-[10px] font-mono font-bold text-blue-400">{formatTime(chapter.startTime)}</span>
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-white/80 group-hover:text-white transition-colors mb-1">{chapter.title}</h4>
                                    {chapter.description && (
                                        <p className="text-xs text-white/40 line-clamp-1">{chapter.description}</p>
                                    )}
                                </div>
                            </button>
                        )) : (
                            <div className="p-4 rounded-2xl bg-[#13111a] border border-white/5 text-center">
                                <p className="text-xs text-white/30">No chapters generated yet.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* RESOURCES */}
                {resources.length > 0 && (
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <span className="material-symbols-outlined text-emerald-400">link</span>
                            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-white/60">Resources</h3>
                        </div>
                        <div className="grid gap-2">
                            {resources.map((res, idx) => (
                                <a
                                    key={idx}
                                    href={res.url || "#"}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-between p-4 rounded-2xl bg-[#13111a] border border-white/5 hover:bg-emerald-500/5 hover:border-emerald-500/20 transition-all group"
                                >
                                    <span className="text-sm text-white/60 group-hover:text-white transition-colors">{res.title}</span>
                                    <span className="material-symbols-outlined text-white/20 text-sm group-hover:text-emerald-400">open_in_new</span>
                                </a>
                            ))}
                        </div>
                    </div>
                )}

            </div>
        </section>
    );
}
