"use client";

import React from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

export default function RevisionQueuePage() {
    const revisions = useQuery(api.revisions.listOpen);

    // Metrics
    const openTicketCount = revisions?.length || 0;
    const resolvedToday = 8; // Mocked for now as per design
    const avgResponseTime = "1.4h"; // Mocked

    return (
        <DashboardLayout>
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight text-white">Revision Queue</h2>
                        <p className="text-white/50 text-sm mt-1">Manage active engineering tickets and feedback cycles.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all border border-white/5">
                            <span className="material-symbols-outlined text-[18px]">filter_list</span>
                            Filters
                        </button>
                    </div>
                </div>

                {/* Metrics Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                    <div className="glass p-6 rounded-xl border-l-4 border-l-primary relative overflow-hidden group">
                        <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <span className="material-symbols-outlined text-[80px]">confirmation_number</span>
                        </div>
                        <p className="text-white/40 text-sm font-medium mb-1">Open Tickets</p>
                        <div className="flex items-baseline gap-2">
                            <h3 className="text-4xl font-bold text-white">{openTicketCount}</h3>
                            <span className="text-xs font-bold text-primary">+2% new</span>
                        </div>
                    </div>
                    <div className="glass p-6 rounded-xl border-l-4 border-l-cyan-400 relative overflow-hidden group">
                        <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <span className="material-symbols-outlined text-[80px]">schedule</span>
                        </div>
                        <p className="text-white/40 text-sm font-medium mb-1">Avg. Response</p>
                        <div className="flex items-baseline gap-2">
                            <h3 className="text-4xl font-bold text-white">{avgResponseTime}</h3>
                            <span className="text-xs font-bold text-emerald-400">Stable</span>
                        </div>
                    </div>
                    <div className="glass p-6 rounded-xl border-l-4 border-l-emerald-400 relative overflow-hidden group">
                        <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <span className="material-symbols-outlined text-[80px]">task_alt</span>
                        </div>
                        <p className="text-white/40 text-sm font-medium mb-1">Resolved Today</p>
                        <div className="flex items-baseline gap-2">
                            <h3 className="text-4xl font-bold text-white">{resolvedToday}</h3>
                            <span className="text-xs font-bold text-orange-400">-1% diff</span>
                        </div>
                    </div>
                </div>

                {/* Section Header */}
                <div className="flex items-center justify-between mb-4 px-2">
                    <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-white/50">Active Revisions</h3>
                    <span className="text-[10px] text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">LIVE FEED</span>
                </div>

                {/* Revision List */}
                <div className="space-y-4">
                    {!revisions ? (
                        <div className="text-center py-10 text-white/50">Loading revisions...</div>
                    ) : revisions.length === 0 ? (
                        <div className="text-center py-10 text-white/50">No open revisions found.</div>
                    ) : (
                        revisions.map((revision) => (
                            <div key={revision._id} className="glass rounded-xl p-4 flex flex-col md:flex-row gap-6 items-center transition-all hover:translate-x-1 hover:border-primary/30 group border border-white/5">
                                <div className="relative shrink-0">
                                    <div
                                        className="aspect-video w-[180px] bg-black/40 rounded-lg bg-cover bg-center overflow-hidden border border-white/5"
                                        style={{ backgroundImage: `url("${revision.episode?.imageUrl || ''}")` }}
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                                    </div>
                                    {/* Fresh Status Dot */}
                                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full border-2 border-background-dark shadow-[0_0_8px_#ff33bb]"></div>
                                </div>

                                <div className="flex-1 min-w-0 w-full">
                                    <div className="flex items-center gap-2 mb-1">
                                        <div
                                            className="size-5 rounded-full bg-cover"
                                            style={{ backgroundImage: `url("${revision.author.avatar}")` }}
                                        ></div>
                                        <span className="text-xs font-bold text-white/40">{revision.author.name}</span>
                                        <span className="text-[10px] text-white/60">• {revision.formattedDate}</span>
                                    </div>

                                    <h4 className="text-lg font-bold text-white leading-tight mb-2 group-hover:text-primary transition-colors">
                                        {revision.episode?.title || "Untitled Episode"}
                                    </h4>
                                    <p className="text-sm text-white/40 line-clamp-1 mb-3 font-light leading-relaxed max-w-xl">
                                        {revision.note}
                                    </p>

                                    <div className="flex gap-2">
                                        <div className="flex items-center gap-1.5 rounded-lg bg-primary/10 px-2.5 py-1 border border-primary/20">
                                            <span className="material-symbols-outlined text-primary text-[14px]">confirmation_number</span>
                                            <span className="text-primary text-[11px] font-bold tracking-wide">TICKET</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="shrink-0 flex flex-col items-end gap-3 w-full md:w-auto">
                                    <Link href={`/episodes/${revision.episodeId}`}>
                                        <button className="h-10 px-6 w-full md:w-auto rounded-lg gradient-btn text-white text-xs font-bold tracking-widest uppercase shadow-lg shadow-primary/20 transition-transform active:scale-95 hover:brightness-110">
                                            Enter Studio
                                        </button>
                                    </Link>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Pagination/Load More Footer */}
                <div className="mt-10 flex justify-center">
                    <button className="flex items-center gap-2 text-white/50 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest px-8 py-3 rounded-xl border border-white/5 hover:bg-white/5">
                        <span className="material-symbols-outlined text-[18px]">expand_more</span>
                        Load More Tickets
                    </button>
                </div>
            </div>
        </DashboardLayout>
    );
}
