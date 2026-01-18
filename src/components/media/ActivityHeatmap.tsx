import React from 'react';

export function ActivityHeatmap() {
    return (
        <div className="col-span-12 lg:col-span-8 bg-media-surface rounded-xl p-6 border border-white/5 inner-glow">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Asset Activity Heatmap</h3>
                <div className="flex gap-1">
                    <span className="size-2 rounded-sm bg-white/5"></span>
                    <span className="size-2 rounded-sm bg-media-primary/20"></span>
                    <span className="size-2 rounded-sm bg-media-primary/60"></span>
                    <span className="size-2 rounded-sm bg-media-primary"></span>
                </div>
            </div>
            <div className="flex flex-col gap-1.5">
                {/* Heatmap Rows */}
                <div className="flex gap-1.5 justify-between">
                    <div className="h-8 flex-1 bg-media-primary/10 rounded-sm"></div>
                    <div className="h-8 flex-1 bg-media-primary/30 rounded-sm"></div>
                    <div className="h-8 flex-1 bg-media-primary rounded-sm"></div>
                    <div className="h-8 flex-1 bg-media-primary/40 rounded-sm"></div>
                    <div className="h-8 flex-1 bg-white/5 rounded-sm"></div>
                    <div className="h-8 flex-1 bg-media-primary/10 rounded-sm"></div>
                    <div className="h-8 flex-1 bg-media-primary/80 rounded-sm"></div>
                    <div className="h-8 flex-1 bg-media-primary/20 rounded-sm"></div>
                    <div className="h-8 flex-1 bg-media-primary/10 rounded-sm"></div>
                    <div className="h-8 flex-1 bg-media-primary/60 rounded-sm"></div>
                    <div className="h-8 flex-1 bg-white/5 rounded-sm"></div>
                    <div className="h-8 flex-1 bg-media-primary rounded-sm"></div>
                </div>
                <div className="flex gap-1.5 justify-between">
                    <div className="h-8 flex-1 bg-white/5 rounded-sm"></div>
                    <div className="h-8 flex-1 bg-media-primary/10 rounded-sm"></div>
                    <div className="h-8 flex-1 bg-media-primary/20 rounded-sm"></div>
                    <div className="h-8 flex-1 bg-media-primary/5 rounded-sm"></div>
                    <div className="h-8 flex-1 bg-media-primary/30 rounded-sm"></div>
                    <div className="h-8 flex-1 bg-white/5 rounded-sm"></div>
                    <div className="h-8 flex-1 bg-media-primary/10 rounded-sm"></div>
                    <div className="h-8 flex-1 bg-media-primary/10 rounded-sm"></div>
                    <div className="h-8 flex-1 bg-media-primary/40 rounded-sm"></div>
                    <div className="h-8 flex-1 bg-media-primary/20 rounded-sm"></div>
                    <div className="h-8 flex-1 bg-media-primary/80 rounded-sm"></div>
                    <div className="h-8 flex-1 bg-media-primary rounded-sm"></div>
                </div>
                <div className="flex justify-between mt-2 px-1">
                    <span className="text-[8px] text-slate-500 font-mono">00:00</span>
                    <span className="text-[8px] text-slate-500 font-mono">06:00</span>
                    <span className="text-[8px] text-slate-500 font-mono">12:00</span>
                    <span className="text-[8px] text-slate-500 font-mono">18:00</span>
                    <span className="text-[8px] text-slate-500 font-mono">23:59</span>
                </div>
            </div>
        </div>
    );
}
