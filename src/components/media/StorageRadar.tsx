import React from 'react';

interface StorageRadarProps {
    video: number;
    audio: number;
    assets: number;
}

export function StorageRadar({ video, audio, assets }: StorageRadarProps) {
    const total = video + audio + assets || 1;
    const percentage = Math.round((total / (1.5 * 1024 * 1024 * 1024 * 1024)) * 100) || 0; // Assuming 1.5TB cap from prototype text "1.2TB of 1.5TB used"

    const formatSize = (bytes: number) => {
        if (bytes >= 1024 * 1024 * 1024) {
            return (bytes / (1024 * 1024 * 1024)).toFixed(0) + 'GB';
        }
        return (bytes / (1024 * 1024)).toFixed(0) + 'MB';
    };

    return (
        <div className="col-span-12 lg:col-span-4 bg-media-surface rounded-xl p-6 border border-white/5 inner-glow relative overflow-hidden group">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-6 flex items-center justify-between">
                Storage Metrics
                <span className="material-symbols-outlined text-sm text-media-primary">data_usage</span>
            </h3>
            <div className="flex items-center gap-8">
                <div className="relative size-32 flex items-center justify-center">
                    <svg className="size-full -rotate-90 transform" viewBox="0 0 100 100">
                        <circle className="text-white/5" cx="50" cy="50" fill="transparent" r="40" stroke="currentColor" strokeWidth="8"></circle>
                        {/* Video Ring */}
                        <circle
                            className="text-media-primary"
                            cx="50" cy="50" fill="transparent" r="40"
                            stroke="currentColor"
                            strokeDasharray="251.2"
                            strokeDashoffset={251.2 - (251.2 * (video / total))} // Example logic, stacking? No, just visual rings based on HTML logic
                            // The HTML had specific explicit logic:
                            // Primary: offset 50.2 (201/251 = 80%)
                            // Magenta: offset 180.2 (71/251 = 28%)
                            // Yellow: offset 220.2 (31/251 = 12%)
                            // It seems they are independently calculated or stacked. 
                            // I will use them as overlapping for now, largest to smallest or stacked?
                            // The HTML provided has: Primary (large), Magenta (medium), Yellow (small).
                            // I'll render them in that order but logic requires knowing which is accumulated.
                            // For simplicity I will just map them to arbitrary relative sizes or just use the raw values if logical.
                            strokeWidth="8"
                        ></circle>
                        <circle
                            className="text-media-magenta"
                            cx="50" cy="50" fill="transparent" r="40"
                            stroke="currentColor"
                            strokeDasharray="251.2"
                            strokeDashoffset={251.2 - (251.2 * (audio / total))}
                            strokeWidth="8"
                        ></circle>
                        <circle
                            className="text-media-yellow"
                            cx="50" cy="50" fill="transparent" r="40"
                            stroke="currentColor"
                            strokeDasharray="251.2"
                            strokeDashoffset={251.2 - (251.2 * (assets / total))}
                            strokeWidth="8"
                        ></circle>
                    </svg>
                    <div className="absolute flex flex-col items-center">
                        <span className="text-2xl font-bold">{percentage}%</span>
                        <span className="text-[8px] uppercase text-slate-400">Full</span>
                    </div>
                </div>
                <div className="flex flex-col gap-3 flex-1">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="size-2 rounded-full bg-media-primary"></span>
                            <span className="text-[10px] text-slate-300">Raw Video</span>
                        </div>
                        <span className="text-[10px] font-bold">{formatSize(video)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="size-2 rounded-full bg-media-magenta"></span>
                            <span className="text-[10px] text-slate-300">Lossless Audio</span>
                        </div>
                        <span className="text-[10px] font-bold">{formatSize(audio)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="size-2 rounded-full bg-media-yellow"></span>
                            <span className="text-[10px] text-slate-300">Project Assets</span>
                        </div>
                        <span className="text-[10px] font-bold">{formatSize(assets)}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
