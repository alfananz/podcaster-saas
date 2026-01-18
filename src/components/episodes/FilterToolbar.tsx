"use client";
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: (string | undefined | null | false)[]) {
    return twMerge(clsx(inputs));
}

interface FilterToolbarProps {
    filter: 'all' | 'processing' | 'action_required' | 'published';
    setFilter: (filter: 'all' | 'processing' | 'action_required' | 'published') => void;
}

export function FilterToolbar({ filter, setFilter }: FilterToolbarProps) {
    return (
        <div className="w-full glass-panel flex flex-col md:flex-row items-center justify-between gap-4 p-2 pr-2 md:pl-2 bg-white/5 backdrop-blur-3xl rounded-2xl border border-white/10">
            <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 w-full md:w-auto scrollbar-hide">
                <button
                    onClick={() => setFilter('all')}
                    className={cn(
                        "px-6 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all",
                        filter === 'all' ? "bg-white/10 text-white shadow-lg shadow-white/5" : "text-white/40 hover:text-white hover:bg-white/5"
                    )}
                >
                    All
                </button>
                <div className="w-px h-6 bg-white/5 mx-2 hidden md:block"></div>
                <button
                    onClick={() => setFilter('processing')}
                    className={cn(
                        "px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-colors flex items-center gap-3",
                        filter === 'processing' ? "text-purple-400 bg-purple-500/10" : "text-white/60 hover:text-white hover:bg-white/5"
                    )}
                >
                    <span className={cn("size-2 rounded-full bg-purple-500", filter === 'processing' && "animate-pulse box-shadow-purple-500/70")}></span>
                    Processing
                </button>
                <button
                    onClick={() => setFilter('action_required')}
                    className={cn(
                        "px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-colors flex items-center gap-3",
                        filter === 'action_required' ? "text-red-400 bg-red-500/10" : "text-white/60 hover:text-white hover:bg-white/5"
                    )}
                >
                    <span className="size-2 rounded-full bg-primary"></span>
                    Action Required
                </button>
                <button
                    onClick={() => setFilter('published')}
                    className={cn(
                        "px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-colors flex items-center gap-3",
                        filter === 'published' ? "text-[#0bda87] bg-[#0bda87]/10" : "text-white/60 hover:text-white hover:bg-white/5"
                    )}
                >
                    <span className="size-2 rounded-full bg-[#0bda87]"></span>
                    Published
                </button>
            </div>

            <div className="relative w-full md:w-96 group">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-white transition-colors text-[20px]">
                    search
                </span>
                <input
                    className="w-full bg-black/20 hover:bg-black/30 focus:bg-black/40 border border-white/5 focus:border-white/10 rounded-xl pl-12 pr-4 py-3 text-sm text-white focus:ring-0 placeholder:text-white/20 transition-all outline-none"
                    placeholder="Search episodes..."
                    type="text"
                />
            </div>
        </div>
    );
}
