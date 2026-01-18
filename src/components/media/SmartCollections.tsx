import React from 'react';

export function SmartCollections() {
    return (
        <section>
            <div className="flex items-center justify-between mb-4 px-2">
                <h3 className="text-sm font-bold tracking-wide">Smart Collections</h3>
                <button className="text-xs text-media-primary hover:underline">Manage Rules</button>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar relative pr-20">
                {/* Fade indicator */}
                <div className="absolute right-0 top-0 bottom-4 w-20 bg-gradient-to-l from-media-bg-dark to-transparent pointer-events-none z-10"></div>
                {/* Collection Cards */}
                <div className="flex-none w-48 bg-media-surface border border-white/5 rounded-xl p-4 hover:border-media-primary/50 transition-all cursor-pointer">
                    <div className="size-8 rounded-lg bg-media-primary/20 text-media-primary flex items-center justify-center mb-3">
                        <span className="material-symbols-outlined text-lg">publish</span>
                    </div>
                    <p className="text-xs font-bold mb-1">Ready to Publish</p>
                    <p className="text-[10px] text-slate-400">12 assets · 4.2GB</p>
                </div>
                <div className="flex-none w-48 bg-media-surface border border-white/5 rounded-xl p-4 hover:border-media-primary/50 transition-all cursor-pointer">
                    <div className="size-8 rounded-lg bg-media-magenta/20 text-media-magenta flex items-center justify-center mb-3">
                        <span className="material-symbols-outlined text-lg">edit_note</span>
                    </div>
                    <p className="text-xs font-bold mb-1">Current Drafts</p>
                    <p className="text-[10px] text-slate-400">45 assets · 12.8GB</p>
                </div>
                <div className="flex-none w-48 bg-media-surface border border-white/5 rounded-xl p-4 hover:border-media-primary/50 transition-all cursor-pointer">
                    <div className="size-8 rounded-lg bg-media-yellow/20 text-media-yellow flex items-center justify-center mb-3">
                        <span className="material-symbols-outlined text-lg">movie_filter</span>
                    </div>
                    <p className="text-xs font-bold mb-1">Unused B-Roll</p>
                    <p className="text-[10px] text-slate-400">89 assets · 154GB</p>
                </div>
                <div className="flex-none w-48 bg-media-surface border border-white/5 rounded-xl p-4 hover:border-media-primary/50 transition-all cursor-pointer">
                    <div className="size-8 rounded-lg bg-white/10 text-slate-300 flex items-center justify-center mb-3">
                        <span className="material-symbols-outlined text-lg">description</span>
                    </div>
                    <p className="text-xs font-bold mb-1">AI Transcripts</p>
                    <p className="text-[10px] text-slate-400">15 files · 124MB</p>
                </div>
                <div className="flex-none w-48 bg-media-surface border border-white/5 rounded-xl p-4 hover:border-media-primary/50 transition-all cursor-pointer">
                    <div className="size-8 rounded-lg bg-media-primary/20 text-media-primary flex items-center justify-center mb-3">
                        <span className="material-symbols-outlined text-lg">campaign</span>
                    </div>
                    <p className="text-xs font-bold mb-1">Social Promos</p>
                    <p className="text-[10px] text-slate-400">8 assets · 2.1GB</p>
                </div>
                <div className="flex-none w-48 bg-media-surface border border-white/5 rounded-xl p-4 hover:border-media-primary/50 transition-all cursor-pointer">
                    <div className="size-8 rounded-lg bg-white/5 text-slate-500 flex items-center justify-center mb-3">
                        <span className="material-symbols-outlined text-lg">add_circle</span>
                    </div>
                    <p className="text-xs font-bold mb-1">Create New</p>
                    <p className="text-[10px] text-slate-500 italic">Dynamic Rule</p>
                </div>
            </div>
        </section>
    );
}
