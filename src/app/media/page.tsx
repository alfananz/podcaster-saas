"use client";

import React from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StorageRadar } from '@/components/media/StorageRadar';
import { ActivityHeatmap } from '@/components/media/ActivityHeatmap';
import { SmartCollections } from '@/components/media/SmartCollections';
import { FolderGrid } from '@/components/media/FolderGrid';
import { RecentAssetsTable } from '@/components/media/RecentAssetsTable';

export default function MediaLibraryPage() {
    const stats = useQuery(api.media.stats);
    const episodes = useQuery(api.episodes.list);
    const recentAssets = useQuery(api.assets.recent);

    return (
        <DashboardLayout>
            {/* HEADER */}
            <header className="flex items-center justify-between mb-8 pb-8 border-b border-white/5 z-10">
                <div className="flex items-center gap-6 flex-1">
                    <h2 className="text-2xl font-bold tracking-tight">Media Library</h2>
                    <div className="relative w-full max-w-md group hidden md:block">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-media-primary transition-colors">search</span>
                        <input className="w-full bg-white/5 border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm focus:ring-media-primary focus:border-media-primary placeholder:text-slate-500 transition-all outline-none" placeholder="Search by bitrate, length, or tag..." type="text" />
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex bg-white/5 p-1 rounded-lg mr-4 hidden sm:flex">
                        <button className="px-3 py-1 text-[10px] font-bold uppercase tracking-tighter rounded-md bg-media-surface text-media-primary shadow-sm">Comfortable</button>
                        <button className="px-3 py-1 text-[10px] font-bold uppercase tracking-tighter rounded-md text-slate-500 hover:text-white transition-colors">Compact</button>
                    </div>
                    <button className="p-2 text-slate-400 hover:text-white relative">
                        <span className="material-symbols-outlined">notifications</span>
                        <span className="absolute top-2 right-2 size-2 bg-media-magenta rounded-full"></span>
                    </button>
                    <div className="size-10 rounded-full bg-cover bg-center border-2 border-media-primary/20 md:hidden" data-alt="User profile avatar" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuAJJ6TIIeY4o_E58ZN6PsD8cP55TxPXqsWHwpdG4JLw0d7YWT_PsILzP-QgS9mDtBY285_WgMpeMhOHvmXXPyvlyF8sOYyOX7egYch3E-uoGRwbngm4YJDc8vzKhQeThjT9Gh4SESGq71JFvNH9z3W0nlZdPL6deXmUWUUPvU2dfu6c0Te_TnnWUlk3eHAyzFFLmGRfxvDer8QcaX1eoapP5tYFYVPzQbSGc0an6qIunLn6JLJ8c31VnaX2eq1SFXji311hJCdo6nx5')" }}></div>
                </div>
            </header>

            {/* SCROLLABLE AREA */}
            <div className="space-y-8 text-white font-display">
                {/* BENTO GRID DATA VISUALIZATION */}
                <section className="grid grid-cols-12 gap-6">
                    <StorageRadar
                        video={stats?.video || 820 * 1024 * 1024 * 1024}
                        audio={stats?.audio || 240 * 1024 * 1024 * 1024}
                        assets={stats?.assets || 140 * 1024 * 1024 * 1024}
                    />
                    <ActivityHeatmap />
                </section>

                {/* SMART COLLECTIONS HORIZONTAL */}
                <SmartCollections />

                {/* 5-COLUMN GRID EPISODE FOLDERS */}
                <FolderGrid episodes={episodes || []} />

                {/* RECENT ASSETS TABLE */}
                <RecentAssetsTable assets={recentAssets || []} />
            </div>
        </DashboardLayout>
    );
}
