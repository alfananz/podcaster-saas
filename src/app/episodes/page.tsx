"use client";
import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { FilterToolbar } from "@/components/episodes/FilterToolbar";
import { EpisodeCard } from "@/components/dashboard/EpisodeCard";

// Specific override styles for this page
const pageStyles = `
  .font-public-sans {
    font-family: var(--font-public-sans), sans-serif;
  }
  .theme-override {
    --color-primary: #ea2a33;
  }
  .aurora-bg-episodes {
     background: radial-gradient(circle at 20% 30%, rgba(234, 42, 51, 0.15) 0%, transparent 40%),
                radial-gradient(circle at 80% 70%, rgba(139, 92, 246, 0.2) 0%, transparent 40%),
                radial-gradient(circle at 50% 50%, rgba(16, 14, 37, 1) 0%, rgba(22, 14, 37, 1) 100%);
     background-attachment: fixed;
  }
`;

import { useModal } from "@/context/ModalContext";

export default function EpisodesPage() {
    const [filter, setFilter] = useState<'all' | 'processing' | 'action_required' | 'published'>('all');
    const { openModal } = useModal();

    // Fetch from Convex
    // Fetch from Convex
    const episodes = useQuery(api.episodes.list);

    // Filter Logic
    const filteredEpisodes = (episodes || []).filter((ep) => {
        if (filter === 'all') return true;
        if (filter === 'published') return ep.status === 'completed';
        return ep.status === filter;
    });

    if (episodes === undefined) {
        return (
            <>
                <style jsx global>{pageStyles}</style>
                <div className="font-public-sans theme-override min-h-screen text-white aurora-bg-episodes">
                    <DashboardLayout>
                        {/* Header Skeleton */}
                        <div className="mb-8 flex items-center justify-between glass p-6 rounded-2xl border border-white/5 bg-background-dark/80 animate-pulse">
                            <div className="h-10 w-48 bg-white/5 rounded"></div>
                            <div className="h-10 w-32 bg-white/5 rounded"></div>
                        </div>

                        {/* Grid Skeleton */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {[1, 2, 3, 4, 5, 6].map((i) => (
                                <div key={i} className="glass p-6 rounded-3xl animate-pulse h-80 bg-white/5"></div>
                            ))}
                        </div>
                    </DashboardLayout>
                </div>
            </>
        )
    }

    return (
        <>
            <style jsx global>{pageStyles}</style>
            <div className="font-public-sans theme-override min-h-screen text-white aurora-bg-episodes">
                <DashboardLayout>
                    {/* Header */}
                    <header className="sticky top-0 z-40 mb-8 flex items-center justify-between glass p-6 rounded-2xl border border-white/5 bg-background-dark/80">
                        <div>
                            <h2 className="text-3xl font-black tracking-tight text-white flex items-center gap-2">
                                Episodes
                                <span className="text-white/20 text-xl font-normal self-end mb-1">{filteredEpisodes.length}</span>
                            </h2>
                            <p className="text-white/40 text-sm mt-1">Manage and organize your studio productions</p>
                        </div>
                        <button
                            onClick={openModal}
                            className="bg-gradient-to-r from-primary to-[#ff5c64] hover:brightness-110 text-white px-6 py-3 rounded-lg font-bold text-sm flex items-center gap-2 shadow-xl shadow-primary/20 transition-all active:scale-95 cursor-pointer"
                        >
                            <span className="material-symbols-outlined text-xl">add_circle</span>
                            New Episode
                        </button>
                    </header>

                    {/* Toolbar */}
                    <section className="mb-8">
                        <FilterToolbar filter={filter} setFilter={setFilter} />
                    </section>

                    {/* Episodes Grid */}
                    <section className="pb-12">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {filteredEpisodes.map((ep) => (
                                <EpisodeCard key={ep._id} episode={ep} />
                            ))}

                            {/* Placeholder/Empty State (Always show as last tile or if empty) */}
                            <div
                                onClick={openModal}
                                className="rounded-xl border border-dashed border-white/10 bg-white/2 flex flex-col items-center justify-center p-6 text-center group hover:bg-white/5 hover:border-white/20 transition-all min-h-[250px] cursor-pointer"
                            >
                                <div className="size-12 rounded-full bg-white/5 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                    <span className="material-symbols-outlined text-white/20">cloud_upload</span>
                                </div>
                                <p className="text-white/40 text-xs font-bold uppercase tracking-widest">Drop files to upload</p>
                            </div>
                        </div>
                    </section>
                </DashboardLayout>
            </div>
        </>
    );
}
