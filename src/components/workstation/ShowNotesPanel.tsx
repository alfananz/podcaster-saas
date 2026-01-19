import React from 'react';

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
    keyTakeaways?: string[];
    seoTags?: string[];
    onSeek?: (time: number) => void;
}

export function ShowNotesPanel({
    summary,
    aiSynopsis,
    chapters = [],
    resources = [],
    keyTakeaways = [],
    seoTags = [],
    onSeek
}: ShowNotesPanelProps) {

    const formatTime = (seconds: number) => {
        const min = Math.floor(seconds / 60);
        const sec = Math.floor(seconds % 60);
        return `${min < 10 ? '0' : ''}${min}:${sec < 10 ? '0' : ''}${sec}`;
    };

    // Colors derived from design
    const colorPrimary = "#ff00ff";
    const colorCyan = "#00E0FF";

    const [isCopied, setIsCopied] = React.useState(false);

    return (
        <aside className="w-full h-full flex flex-col border-l border-white/10 bg-[#0a0612]/50 backdrop-blur-xl shrink-0 overflow-y-auto">

            {/* Header */}


            <div className="p-6 space-y-8">

                {/* Summary Section */}
                <section>

                    <div className="bg-white/[0.04] backdrop-blur-[20px] border border-white/10 rounded-xl p-5 group transition-all hover:border-[#ff00ff]/20">
                        <h5 className="text-lg font-bold mb-2 text-white">Episode Synopsis</h5>
                        <p className="text-white/70 text-sm leading-relaxed mb-4">
                            {aiSynopsis || summary || "Generate Show Notes to see a deep dive analysis of this episode."}
                        </p>
                        <button
                            onClick={() => {
                                const text = aiSynopsis || summary || "Generate Show Notes to see a deep dive analysis of this episode.";
                                navigator.clipboard.writeText(text);
                                setIsCopied(true);
                                setTimeout(() => setIsCopied(false), 2000);
                            }}
                            className="w-full py-2.5 rounded-lg bg-white/5 text-white text-xs font-bold uppercase tracking-widest hover:bg-[#ff00ff] hover:text-white transition-all flex items-center justify-center gap-2"
                        >
                            {isCopied ? (
                                <>
                                    <span className="material-symbols-outlined text-[16px]">check</span>
                                    Copied!
                                </>
                            ) : (
                                "Copy Synopsis"
                            )}
                        </button>
                    </div>
                </section>

                {/* Chapters Section */}
                {chapters.length > 0 && (
                    <section>
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-[#00E0FF]/40 text-[20px]">list_alt</span>
                                <h4 className="text-sm font-bold uppercase tracking-wider text-white/60">Chapters</h4>
                            </div>
                            <button className="text-[10px] font-bold text-[#00E0FF] tracking-tighter uppercase border border-[#00E0FF]/30 px-2 py-0.5 rounded">Auto-Chaptering ON</button>
                        </div>
                        <div className="space-y-3">
                            {chapters.map((chapter, idx) => (
                                <div
                                    key={idx}
                                    onClick={() => onSeek?.(chapter.startTime)}
                                    className="bg-white/[0.04] backdrop-blur-[20px] border border-white/10 rounded-lg p-4 flex gap-4 items-start group hover:bg-white/[0.07] transition-all cursor-pointer"
                                >
                                    <div className="font-mono text-[11px] font-bold text-[#00E0FF] bg-[#00E0FF]/10 px-2 py-1 rounded border border-[#00E0FF]/20 tracking-tighter shrink-0">
                                        {formatTime(chapter.startTime)}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-white group-hover:text-[#00E0FF] transition-colors">{chapter.title}</p>
                                        {chapter.description && (
                                            <p className="text-xs text-white/40 mt-1 line-clamp-1">{chapter.description}</p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Social Highlights (Key Takeaways) */}
                {keyTakeaways && keyTakeaways.length > 0 && (
                    <section>
                        <div className="flex items-center gap-2 mb-4">
                            <span className="material-symbols-outlined text-[#ff00ff] text-[20px] fill-1">star</span>
                            <h4 className="text-sm font-bold uppercase tracking-wider text-white/60">Social Highlights</h4>
                        </div>

                        {/* Featured Quote (First Takeaway) */}
                        <div className="bg-white/[0.04] backdrop-blur-[20px] border-2 border-[#ff00ff] shadow-[0_0_15px_rgba(255,0,255,0.15)] rounded-xl p-5 relative overflow-hidden group">
                            <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#ff00ff]/10 blur-[50px] pointer-events-none"></div>
                            <div className="flex justify-between items-start mb-4">
                                <span className="material-symbols-outlined text-[#ff00ff]">format_quote</span>
                                <div className="flex gap-2">
                                    <button className="w-7 h-7 bg-white/5 rounded flex items-center justify-center hover:bg-[#ff00ff]/20 transition-colors text-white">
                                        <span className="material-symbols-outlined text-[16px]">content_copy</span>
                                    </button>
                                    <button className="w-7 h-7 bg-white/5 rounded flex items-center justify-center hover:bg-[#ff00ff]/20 transition-colors text-white">
                                        <span className="material-symbols-outlined text-[16px]">ios_share</span>
                                    </button>
                                </div>
                            </div>
                            <p className="text-base font-medium leading-relaxed italic text-white/90 mb-4">
                                "{keyTakeaways[0]}"
                            </p>
                            <div className="flex items-center gap-2">
                                <div className="h-0.5 w-6 bg-[#ff00ff]"></div>
                                <span className="text-[10px] font-bold uppercase tracking-widest text-[#ff00ff]">Key Takeaway</span>
                            </div>
                        </div>

                        {/* Secondary Quotes */}
                        {keyTakeaways.slice(1, 3).map((takeaway, idx) => (
                            <div key={idx} className="mt-4 bg-white/[0.04] backdrop-blur-[20px] border border-white/5 rounded-lg p-4 flex items-center justify-between group hover:bg-white/10 transition-colors cursor-pointer">
                                <p className="text-xs text-white/60 font-medium truncate pr-4">"{takeaway}"</p>
                                <span className="material-symbols-outlined text-[16px] text-white/20 group-hover:text-[#ff00ff] transition-colors">arrow_forward_ios</span>
                            </div>
                        ))}
                    </section>
                )}

                {/* Keywords */}
                {seoTags && seoTags.length > 0 && (
                    <section className="pb-10">
                        <div className="flex flex-wrap gap-2">
                            {seoTags.map((tag, idx) => (
                                <span key={idx} className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] font-bold uppercase tracking-tighter text-white/50 hover:text-white hover:border-white/30 transition-colors">
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </section>
                )}
            </div>
        </aside>
    );
}
