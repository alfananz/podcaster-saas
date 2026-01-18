"use client";

import { use, useState, useRef } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import AVSyncPlayer, { AVSyncPlayerRef } from "@/components/workstation/AVSyncPlayer";
import { TranscriptPanel } from "@/components/workstation/TranscriptPanel";
import { ShowNotesPanel } from "@/components/workstation/ShowNotesPanel";
import { EditorHeader } from "@/components/workstation/EditorHeader";
import { CommentsSection } from "@/components/collaboration/CommentsSection";

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
    const [activeTab, setActiveTab] = useState<'transcript' | 'shownotes'>('transcript'); // TAB STATE
    const playerRef = useRef<AVSyncPlayerRef>(null);

    const handleSeek = (time: number) => {
        playerRef.current?.seekTo(time);
        // Also optimistic update (optional, AVSyncPlayer will update us back rapidly)
        setCurrentTime(time);
    };

    // 3. Debugging (Keep this to verify fix)
    console.log("--- DEBUG RENDER ---");
    console.log("Episode Loaded:", !!episode);
    console.log("Storage ID:", episode?.storageId);
    console.log("Video URL:", videoUrl);

    // 4. THE LOADING GATE
    if (episode === undefined || videoUrl === undefined) {
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

    if (videoUrl === null) {
        return (
            <DashboardLayout>
                <div className="flex h-screen items-center justify-center bg-[#0a0612] text-white/50">
                    Video URL not found. Storage ID: {episode?.storageId}
                </div>
            </DashboardLayout>
        );
    }

    if (episode === null) {
        return (
            <DashboardLayout>
                <div className="flex h-screen items-center justify-center bg-[#0a0612] text-white/50">
                    Episode not found.
                </div>
            </DashboardLayout>
        )
    }

    return (
        <DashboardLayout>
            {/* Note: DashboardLayout usually provides the sidebar. Content here is the "main" area. */}
            <div className="flex flex-col h-screen -m-6 md:-m-8 bg-[#0a0612] text-white overflow-hidden">
                {/* Header */}
                <EditorHeader
                    episodeId={episode._id}
                    title={episode.title}
                    status={episode.status}
                    processingStage={episode.processingStage}
                    season="Season 4" // Mock
                    episodeNumber="Episode 082" // Mock
                />

                <div className="grid grid-cols-1 lg:grid-cols-3 flex-1 min-h-0">
                    {/* Left: Player Area */}
                    <div className="lg:col-span-2 p-8 flex flex-col gap-8 bg-[#0a0612] overflow-y-auto">
                        {/* CRITICAL: The 'key' prop forces a full re-mount when videoUrl arrives */}
                        <AVSyncPlayer
                            ref={playerRef}
                            key={videoUrl!}
                            videoUrl={videoUrl!}
                            onTimeUpdate={setCurrentTime}
                            comments={comments || []}
                            title={episode.title}
                        />

                        {/* We pass fetched comments or empty array if loading */}
                        {comments && (
                            <CommentsSection
                                episodeId={episode._id}
                                currentTime={currentTime}
                                onSeek={handleSeek}
                                comments={comments}
                            />
                        )}
                    </div>

                    {/* Right: Sidebar Area */}
                    <div className="border-l border-white/5 bg-black/20 overflow-hidden h-full flex flex-col min-w-[400px]">
                        {/* Shared Header */}
                        <div className="flex border-b border-white/5 p-2 bg-black/20 shrink-0">
                            <button
                                onClick={() => setActiveTab('transcript')}
                                className="flex-1 py-4 text-xs font-bold uppercase tracking-widest text-white relative transition-colors hover:text-white/80"
                            >
                                <span className={activeTab === 'transcript' ? 'text-white' : 'text-white/30'}>Transcript</span>
                                {activeTab === 'transcript' && (
                                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-pink-500 rounded-full shadow-[0_0_10px_rgba(236,72,153,0.5)]"></div>
                                )}
                            </button>
                            <button
                                onClick={() => setActiveTab('shownotes')}
                                className="flex-1 py-4 text-xs font-bold uppercase tracking-widest text-white relative transition-colors hover:text-white/80"
                            >
                                <span className={activeTab === 'shownotes' ? 'text-white' : 'text-white/30'}>Show Notes</span>
                                {activeTab === 'shownotes' && (
                                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
                                )}
                            </button>
                            <button className="flex-1 py-4 text-xs font-bold uppercase tracking-widest text-white/30 hover:text-white transition-colors">Resources</button>
                        </div>

                        {/* Tab Content */}
                        <div className="flex-1 overflow-hidden relative">
                            {activeTab === 'transcript' ? (
                                <TranscriptPanel
                                    segments={(episode as any).segments || []}
                                    currentTime={currentTime}
                                    onSeek={handleSeek}
                                    className="h-full w-full border-none bg-transparent" // Pass className to strip defaults if needed
                                />
                            ) : (
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
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
