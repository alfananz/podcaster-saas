"use client";

import { useRouter } from 'next/navigation';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';

import { useState } from 'react';
import { DeleteEpisodeModal } from '../modals/DeleteEpisodeModal';

interface EditorHeaderProps {
    episodeId: Id<"episodes">;
    title: string;
    season?: string;
    episodeNumber?: string;
    status: 'processing' | 'action_required' | 'completed';
    processingStage?: 'queued' | 'transcribing' | 'enriching' | 'completed' | 'failed';
}

export function EditorHeader({ episodeId, title, season = "Season 1", episodeNumber = "Episode 1", status, processingStage }: EditorHeaderProps) {
    const router = useRouter();
    const removeEpisode = useMutation(api.episodes.remove);

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    const handleDeleteClick = () => {
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        await removeEpisode({ episodeId });
        router.push('/episodes');
    };

    // Determine Logic for "In Review" vs "Error"
    const isInReview = status === 'action_required' && processingStage === 'completed';
    const isError = status === 'action_required' && processingStage === 'failed';

    return (
        <header className="h-20 border-b border-white/5 flex items-center justify-between px-8 bg-black/20 backdrop-blur-md sticky top-0 z-10 w-full">
            <div className="flex items-center gap-6">
                <div className="flex flex-col">
                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1">
                        <span>Projects</span>
                        <span className="material-symbols-outlined text-[12px]">chevron_right</span>
                        <span>{season}</span>
                        <span className="material-symbols-outlined text-[12px]">chevron_right</span>
                        <span className="text-white/60">{episodeNumber}</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <h2 className="text-lg font-bold tracking-tight text-white">{title}</h2>
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
            <div className="flex items-center gap-3">
                <button
                    onClick={handleDeleteClick}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-red-500/20 bg-red-500/10 text-sm font-bold text-red-400 hover:bg-red-500/20 transition-all cursor-pointer"
                    title="Delete Episode"
                >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                </button>
                <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-white/10 bg-white/5 text-sm font-bold text-white hover:bg-white/10 transition-all cursor-pointer">
                    <span className="material-symbols-outlined text-[18px]">edit_note</span>
                    Request Changes
                </button>
                <button className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-bold shadow-lg shadow-emerald-500/20 hover:opacity-90 transition-all cursor-pointer">
                    <span className="material-symbols-outlined text-[18px]">check_circle</span>
                    Approve Episode
                </button>
            </div>
            <DeleteEpisodeModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={confirmDelete}
                episodeTitle={title}
            />
        </header>
    );
}
