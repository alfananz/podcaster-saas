"use client";

import { use, useState, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import AVSyncPlayer, { AVSyncPlayerRef } from "@/components/workstation/AVSyncPlayer";
import { TranscriptPanel } from "@/components/workstation/TranscriptPanel";
import { ShowNotesPanel } from "@/components/workstation/ShowNotesPanel";
import { EditorHeader } from "@/components/workstation/EditorHeader";
import { CommentsSection } from "@/components/collaboration/CommentsSection";
import { RequestChangesModal } from "@/components/modals/RequestChangesModal";
import { RevisionHistory } from "@/components/workstation/RevisionHistory";
import { EpisodeProcessing } from "@/components/workstation/EpisodeProcessing";

export default function EpisodeDetailPage({ params }: { params: Promise<{ id: string }> }) {
    // 1. Unwrap Params (Next.js 16)
    const { id } = use(params);

    // 2. Fetch Data
    const episode = useQuery(api.episodes.get, { id: id as string }); // Id handling fixed in backend to string

    // 3. Fetch URL (Only run if we have a storageId)
    // Using explicit check to avoid undefined query
    const videoUrl = useQuery(api.files.getUrl,
        (episode && episode.storageId) ? { storageId: episode.storageId } : "skip"
    );

    const comments = useQuery(api.comments.list,
        episode ? { episodeId: episode._id } : "skip"
    );

    // 4. State Integration
    const [currentTime, setCurrentTime] = useState(0);
    const [activeTab, setActiveTab] = useState<'comments' | 'shownotes' | 'history'>('comments');
    const [isClientReady, setIsClientReady] = useState(false); // NEW: Client Readiness Gate
    const [isRevisionModalOpen, setIsRevisionModalOpen] = useState(false);
    const playerRef = useRef<AVSyncPlayerRef>(null);

    // Mutation
    const requestRevision = useMutation(api.episodes.requestRevision);

    const handleSeek = (time: number) => {
        playerRef.current?.seekTo(time);
        setCurrentTime(time);
    };

    const handleRequestRevision = async (feedback: string) => {
        if (!id) return;
        await requestRevision({ episodeId: id as Id<"episodes">, feedback });
        setIsRevisionModalOpen(false);
        console.log("Revision Requested:", feedback);
    };

    // 4. THE LOADING GATE
    if (episode === undefined) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-screen">
                    <div className="flex flex-col items-center gap-4">
                        <div className="size-8 border-4 border-mello-blue border-t-transparent rounded-full animate-spin" />
                        <p className="text-white/50 text-sm font-mono">Loading Media Assets...</p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    if (episode === null) {
        return (
            <DashboardLayout>
                <div className="flex h-full items-center justify-center bg-[#0a0612] text-white/50">
                    Episode not found.
                </div>
            </DashboardLayout>
        )
    }

    // PROCESSING GATE LOGIC (Backend + Client)
    const isBackendReady = episode.processingStage === 'completed' || episode.processingStage === 'revision_requested';
    // We show the overlay if the backend isn't ready OR if the client player hasn't reported ready yet.
    // Exception: If videoUrl is missing even if backend is ready, we might be stuck, but showOverlay handles covering it.
    const showOverlay = !isBackendReady || !isClientReady;

    return (
        <DashboardLayout>
            <div className="relative h-screen -m-6 md:-m-8 bg-[#0a0612] text-white overflow-hidden">

                {/* 1. LOADING OVERLAY (Absolute on top) */}
                <div
                    className={`absolute inset-0 z-50 bg-[#0a0612]/90 backdrop-blur-xl transition-opacity duration-700 ease-in-out ${showOverlay ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
                >
                    <EpisodeProcessing
                        stage={isBackendReady ? 'completed' : (episode.processingStage || 'queued')}
                        title={episode.title}
                        progress={isBackendReady ? 100 : episode.progress}
                        isResuming={isBackendReady} // If backend is ready, we are just resuming/hydrating client
                    />
                </div>

                {/* 2. MAIN WORKSTATION (Rendered conditionally) */}
                {/* We render the workstation IF isBackendReady is true so the Player can mount and load. */}
                {isBackendReady && (
                    <div className={`flex flex-col h-full w-full transition-opacity duration-1000 delay-300 ${isClientReady ? 'opacity-100' : 'opacity-0'}`}>
                        {/* Header */}
                        <EditorHeader
                            episodeId={episode._id}
                            title={episode.title}
                            status={episode.status}
                            processingStage={episode.processingStage}
                            season="Season 4"
                            episodeNumber="Episode 082"
                            onRequestChanges={() => setIsRevisionModalOpen(true)}
                        />

                        <div className="flex-1 flex overflow-hidden">
                            {/* LEFT COLUMN: Main Workstation */}
                            <section className="flex-1 flex flex-col p-6 gap-6 overflow-hidden min-w-0 border-r border-white/5">

                                {/* 1. Player & Waveform Container */}
                                <div className="flex flex-col gap-6 shrink-0">
                                    {videoUrl && (
                                        <AVSyncPlayer
                                            ref={playerRef}
                                            key={videoUrl}
                                            videoUrl={videoUrl}
                                            onTimeUpdate={setCurrentTime}
                                            comments={comments || []}
                                            title={episode.title}
                                            onReady={() => {
                                                console.log("AVSyncPlayer Ready: Lifting Pre-load Gate.");
                                                setIsClientReady(true);
                                            }}
                                        />
                                    )}
                                </div>

                                {/* 2. Live Transcript */}
                                <div className="glass-panel rounded-3xl flex-1 flex flex-col min-h-0 relative border border-white/5 bg-white/[0.02]">
                                    <div className="flex items-center justify-between p-6 border-b border-white/5">
                                        <div className="flex items-center gap-3">
                                            <span className="material-symbols-outlined text-primary">description</span>
                                            <span className="text-xs font-bold uppercase tracking-widest">Live Transcript</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Auto-Scroll</span>
                                            <div className="w-8 h-4 bg-primary/20 rounded-full relative p-0.5 border border-primary/30">
                                                <div className="size-2.5 bg-primary rounded-full absolute right-0.5"></div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex-1 overflow-hidden relative">
                                        <TranscriptPanel
                                            segments={(episode as any).segments || []}
                                            currentTime={currentTime}
                                            onSeek={handleSeek}
                                            className="h-full w-full border-none bg-transparent p-0"
                                        />
                                        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#0a0612] to-transparent pointer-events-none rounded-b-3xl"></div>
                                    </div>
                                </div>
                            </section>

                            {/* RIGHT COLUMN: Sidebar */}
                            <section className="w-1/3 border-l border-white/5 bg-black/40 backdrop-blur-3xl flex flex-col min-w-[400px]">
                                <div className="flex border-b border-white/5 p-2 bg-black/20">
                                    <button
                                        onClick={() => setActiveTab('comments')}
                                        className="flex-1 py-4 text-[11px] font-bold uppercase tracking-widest text-white relative transition-colors hover:text-white/80"
                                    >
                                        <span className={activeTab === 'comments' ? 'text-white' : 'text-white/30'}>Comments</span>
                                        {activeTab === 'comments' && (
                                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-primary rounded-full shadow-[0_0_10px_rgba(205,55,150,0.5)]"></div>
                                        )}
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('shownotes')}
                                        className="flex-1 py-4 text-[11px] font-bold uppercase tracking-widest text-white relative transition-colors hover:text-white/80"
                                    >
                                        <span className={activeTab === 'shownotes' ? 'text-white' : 'text-white/30'}>Show Notes</span>
                                        {activeTab === 'shownotes' && (
                                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-mello-blue rounded-full shadow-[0_0_10px_rgba(60,140,231,0.5)]"></div>
                                        )}
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('history')}
                                        className="flex-1 py-4 text-[11px] font-bold uppercase tracking-widest text-white relative transition-colors hover:text-white/80"
                                    >
                                        <span className={activeTab === 'history' ? 'text-white' : 'text-white/30'}>History</span>
                                        {activeTab === 'history' && (
                                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-[#ff4db5] rounded-full shadow-[0_0_10px_rgba(255,77,181,0.5)]"></div>
                                        )}
                                    </button>
                                </div>

                                <div className="flex-1 overflow-hidden relative bg-[#0a0612]/50">
                                    {activeTab === 'comments' && comments && (
                                        <CommentsSection
                                            episodeId={episode._id}
                                            currentTime={currentTime}
                                            onSeek={handleSeek}
                                            comments={comments}
                                        />
                                    )}
                                    {activeTab === 'shownotes' && (
                                        <ShowNotesPanel
                                            summary={episode.summary}
                                            aiSynopsis={episode.aiSynopsis}
                                            chapters={episode.chapters}
                                            resources={episode.resources}
                                            guestBio={episode.guestBio}
                                            keyTakeaways={episode.keyTakeaways}
                                            seoTags={episode.seoTags}
                                            onSeek={handleSeek}
                                        />
                                    )}
                                    {activeTab === 'history' && (
                                        <RevisionHistory
                                            episodeId={episode._id}
                                            onSeek={handleSeek}
                                        />
                                    )}
                                </div>
                            </section>
                        </div>
                    </div>
                )}
            </div>
            <RequestChangesModal
                isOpen={isRevisionModalOpen}
                onClose={() => setIsRevisionModalOpen(false)}
                onSubmit={handleRequestRevision}
            />
        </DashboardLayout>
    );
}
