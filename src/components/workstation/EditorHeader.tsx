"use client";

import { useRouter } from 'next/navigation';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';

import { useState } from 'react';
import { DeleteEpisodeModal } from '../modals/DeleteEpisodeModal';

import { ApproveEpisodeModal } from '../modals/ApproveEpisodeModal';

interface EditorHeaderProps {
    episodeId: Id<"episodes">;
    title: string;
    season?: string;
    episodeNumber?: string;
    status: 'processing' | 'action_required' | 'completed';
    processingStage?: 'queued' | 'transcribing' | 'enriching' | 'completed' | 'failed' | 'revision_requested';
    hasOpenRevision?: boolean;
    hasComments?: boolean; // [NEW]
    onRequestChanges: () => void;
}

export function EditorHeader({ episodeId, title, season = "Season 1", episodeNumber = "Episode 1", status, processingStage, hasOpenRevision, hasComments = false, onRequestChanges }: EditorHeaderProps) {
    const router = useRouter();
    const removeEpisode = useMutation(api.episodes.remove);
    const approveEpisode = useMutation(api.episodes.approve);

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);

    const handleDeleteClick = () => {
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        await removeEpisode({ episodeId });
        router.push('/episodes');
    };

    const confirmApprove = async () => {
        await approveEpisode({ episodeId });
        setIsApproveModalOpen(false);
    };

    // Determine Logic for "In Review" vs "Error"
    const isInReview = status === 'action_required' && processingStage === 'completed';
    const isError = status === 'action_required' && processingStage === 'failed';
    const isApproved = status === 'completed';

    const isRequestChangesDisabled = hasOpenRevision || !hasComments || isApproved;

    return (
        <header className="h-20 border-b border-white/5 flex items-center bg-black/20 backdrop-blur-md sticky top-0 z-10 w-full">
            {/* LEFT COLUMN: Title & Status - Matches Main Workspace Width */}
            <div className="flex-1 pl-8 flex items-center gap-6">
                <div className="flex flex-col">
                    <div className="flex items-center gap-3">
                        <h2 className="text-xl font-bold tracking-tight text-white">{title}</h2>
                        {status === 'processing' && (
                            <span className="px-2.5 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-[10px] font-bold text-purple-400 uppercase tracking-wider animate-pulse">Processing</span>
                        )}

                        {/* Error State */}
                        {isError && (
                            <span className="px-2.5 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-[10px] font-bold text-red-400 uppercase tracking-wider">Action Required</span>
                        )}

                        {/* In Review State (Success Pipeline) */}
                        {isInReview && (
                            <span className="px-2.5 py-0.5 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-[10px] font-bold text-yellow-500 uppercase tracking-wider">In Review</span>
                        )}

                        {status === 'completed' && (
                            <span className="px-2.5 py-0.5 rounded-full bg-[#0bda87]/10 border border-[#0bda87]/20 text-[10px] font-bold text-[#0bda87] uppercase tracking-wider">Ready to Publish</span>
                        )}
                    </div>
                </div>
            </div>

            {/* RIGHT COLUMN: Action Buttons - Matches Sidebar Width */}
            <div className="w-1/3 min-w-[400px] border-l border-white/5 flex items-center justify-between px-4 mt-4 gap-2">
                {/* Delete Button */}
                <button
                    onClick={handleDeleteClick}
                    className="flex-1 flex items-center justify-center h-10 px-2 rounded-full bg-transparent hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-all duration-300 ease-out gap-2"
                    title="Delete Episode"
                >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                    <span className="whitespace-nowrap text-[10px] font-bold uppercase tracking-wider">
                        Delete
                    </span>
                </button>

                {/* Request Changes Button */}
                <button
                    onClick={isRequestChangesDisabled ? undefined : onRequestChanges}
                    disabled={isRequestChangesDisabled}
                    className={`flex-1 flex items-center justify-center h-10 px-2 rounded-full border transition-all duration-300 ease-out gap-2
                        ${isRequestChangesDisabled
                            ? 'bg-transparent border-white/5 text-white/30 cursor-not-allowed'
                            : 'bg-transparent hover:bg-[#ff3399]/10 border-[#ff3399]/20 text-[#ff3399] hover:text-white hover:shadow-[0_0_20px_rgba(255,51,153,0.4)]'
                        }
                    `}
                    title={
                        isApproved ? "Episode is locked"
                            : hasOpenRevision ? "Review in progress"
                                : !hasComments ? "Add comments to request changes"
                                    : "Request Changes"
                    }
                >
                    <span className="material-symbols-outlined text-[18px]">
                        {hasOpenRevision ? 'hourglass_top' : isApproved ? 'lock' : 'edit_note'}
                    </span>
                    <span className="whitespace-nowrap text-[10px] font-bold uppercase tracking-wider">
                        {hasOpenRevision ? 'Pending' : 'Request Changes'}
                    </span>
                </button>

                {/* Approve Button */}
                {!isApproved ? (
                    <button
                        onClick={() => setIsApproveModalOpen(true)}
                        className="flex-1 flex items-center justify-center h-10 px-2 rounded-full bg-transparent hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 hover:text-white transition-all duration-300 ease-out hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] gap-2"
                        title="Approve & Lock Episode"
                    >
                        <span className="material-symbols-outlined text-[18px]">check_circle</span>
                        <span className="whitespace-nowrap text-[10px] font-bold uppercase tracking-wider">
                            Approve
                        </span>
                    </button>
                ) : (
                    <div className="flex-1 flex items-center justify-center h-10 px-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 gap-2 cursor-default">
                        <span className="material-symbols-outlined text-[18px]">lock</span>
                        <span className="whitespace-nowrap text-[10px] font-bold uppercase tracking-wider">
                            Locked
                        </span>
                    </div>
                )}
            </div>
            <DeleteEpisodeModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={confirmDelete}
                episodeTitle={title}
            />
            <ApproveEpisodeModal
                isOpen={isApproveModalOpen}
                onClose={() => setIsApproveModalOpen(false)}
                onConfirm={confirmApprove}
                episodeTitle={title}
            />
        </header>
    );
}
