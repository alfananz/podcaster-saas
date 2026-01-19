"use client";

import { use, useState, useRef, useEffect } from "react";
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
import { VersionController } from "@/components/workstation/VersionController"; // [NEW]

export default function EpisodeDetailPage({ params }: { params: Promise<{ id: string }> }) {
    // 1. Unwrap Params (Next.js 16)
    const { id } = use(params);

    // 2. Fetch Data
    const episode = useQuery(api.episodes.get, { id: id as string });

    // [NEW] Fetch Versions
    const versions = useQuery(api.versions.list, episode ? { episodeId: episode._id } : "skip");

    // 3. State Integration
    const [currentTime, setCurrentTime] = useState(0);
    const [activeTab, setActiveTab] = useState<'comments' | 'shownotes' | 'history'>('comments');
    const [isClientReady, setIsClientReady] = useState(false);
    const [isRevisionModalOpen, setIsRevisionModalOpen] = useState(false);
    // [NEW] Selected Version State
    const [selectedVersionId, setSelectedVersionId] = useState<Id<"versions"> | undefined>(undefined);
    // [NEW] Version Switching State
    const [isSwitchingVersion, setIsSwitchingVersion] = useState(false);

    const playerRef = useRef<AVSyncPlayerRef>(null);

    // [NEW] Effect to set default version when episode/versions load
    useEffect(() => {
        if (episode?.currentVersionId && !selectedVersionId) {
            setSelectedVersionId(episode.currentVersionId);
        } else if (versions && versions.length > 0 && !selectedVersionId && !episode?.currentVersionId) {
            // Fallback: If no currentVersionId set on episode, default to latest version if available
            setSelectedVersionId(versions[0]._id);
        }
    }, [episode, versions, selectedVersionId]);

    // [NEW] Derive Active Version Data
    const activeVersion = versions?.find(v => v._id === selectedVersionId);

    // Determine Storage ID: Favor selectedVersion, fallback to episode (legacy)
    const effectiveStorageId = activeVersion?.storageId || episode?.storageId;

    // 4. Fetch URL (Only run if we have a storageId)
    const videoUrl = useQuery(api.files.getUrl,
        effectiveStorageId ? { storageId: effectiveStorageId } : "skip"
    );

    const comments = useQuery(api.comments.list,
        episode ? { episodeId: episode._id, versionId: selectedVersionId } : "skip"
    );

    const activeRevision = useQuery(api.episodes.getActiveRevisionBatch,
        episode ? { episodeId: episode._id } : "skip"
    );

    // [NEW] Filter Active Revision Visibility
    // Only show the revision ticket if it belongs to the CURRENTLY selected version.
    // Legacy batches (undefined versionId) are shown on all versions (or you could restrict them).
    const visibleRevision = activeRevision && (
        !activeRevision.versionId || // Legacy: Show everywhere
        activeRevision.versionId === selectedVersionId // Strict: Match version
    ) ? activeRevision : null;

    // Mutation
    const requestRevision = useMutation(api.episodes.requestRevision);

    const handleSeek = (time: number) => {
        playerRef.current?.seekTo(time);
        setCurrentTime(time);
    };

    const handleRequestRevision = async (feedback: string) => {
        if (!id) return;
        try {
            await requestRevision({
                episodeId: id as Id<"episodes">,
                versionId: selectedVersionId, // [NEW] Pass version context
                feedback
            });
            setIsRevisionModalOpen(false);
            console.log("Revision Requested:", feedback);
        } catch (error: any) {
            console.error("Failed to request revision:", error);
            // Simple alert for now, or use a toast if available
            alert(error.message || "Failed to submit revision request.");
        }
    };

    // [NEW] Handle Version Switch
    const handleVersionSelect = (verId: Id<"versions">) => {
        if (verId === selectedVersionId) return;
        setIsSwitchingVersion(true);
        setSelectedVersionId(verId);
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

                {/* [NEW] VERSION SWITCHING OVERLAY */}
                <div
                    className={`absolute inset-0 z-[60] bg-black/80 backdrop-blur-md flex items-center justify-center transition-opacity duration-500 pointer-events-none ${isSwitchingVersion ? 'opacity-100' : 'opacity-0'}`}
                >
                    <div className="flex flex-col items-center gap-6">
                        <div className="relative size-16">
                            <div className="absolute inset-0 rounded-full border-4 border-white/10"></div>
                            <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
                            <div className="absolute inset-4 rounded-full border-4 border-accent-cyan/50 border-b-transparent animate-spin-reverse"></div>
                        </div>
                        <div className="flex flex-col items-center gap-1">
                            <h3 className="text-xl font-bold tracking-widest text-white uppercase">Loading Version</h3>
                            <p className="text-primary text-xs font-mono tracking-[0.2em] animate-pulse">Syncing Timeline Data...</p>
                        </div>
                    </div>
                </div>

                {/* 2. MAIN WORKSTATION (Rendered conditionally) */}
                {/* We render the workstation IF isBackendReady is true so the Player can mount and load. */}
                {isBackendReady && (
                    <div className={`flex flex-col h-full w-full transition-opacity duration-1000 delay-300 ${isClientReady ? 'opacity-100' : 'opacity-0'}`}>
                        {/* Header */}
                        <div className="relative z-20">
                            <EditorHeader
                                episodeId={episode._id}
                                title={episode.title}
                                status={episode.status}
                                processingStage={episode.processingStage}
                                season="Season 4"
                                episodeNumber="Episode 082"
                                hasOpenRevision={!!visibleRevision} // [MODIFIED] Use filtered revision
                                onRequestChanges={() => setIsRevisionModalOpen(true)}
                            />
                            {/* [NEW] Insert Version Controller into Header area or below it? 
                                Design says: "unified Version Controller sitting right above the video player."
                                But EditorHeader is top. Let's put it IN EditorHeader or just below.
                                Actually, user said "right above the video player". 
                                The video player is in the left column.
                            */}
                        </div>

                        <div className="flex-1 flex overflow-hidden">
                            {/* LEFT COLUMN: Main Workstation */}
                            <section className="flex-1 flex flex-col p-6 gap-6 overflow-hidden min-w-0 border-r border-white/5">

                                {/* 1. Player & Waveform Container */}
                                <div className="flex flex-col gap-6 shrink-0">
                                    {/* [NEW] Version Controller Bar */}
                                    <div className="flex items-center justify-between px-2">
                                        <VersionController
                                            episodeId={episode._id}
                                            currentVersionId={episode.currentVersionId}
                                            selectedVersionId={selectedVersionId}
                                            onVersionSelect={handleVersionSelect}
                                        />
                                        <div className="text-[10px] text-white/30 uppercase tracking-widest font-bold">
                                            {selectedVersionId === episode.currentVersionId ? "VIEWING LATEST" : "VIEWING OLDER VERSION"}
                                        </div>
                                    </div>

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
                                                setIsSwitchingVersion(false); // [NEW] Clear switching state
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
                                            versionId={selectedVersionId} // [NEW] Link comments to version
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
