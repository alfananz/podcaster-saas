import React, { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { useUserRole } from '../../hooks/useUserRole';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import { CommentCard } from './CommentCard';

interface CommentsSectionProps {
    episodeId: Id<"episodes">;
    versionId?: Id<"versions">; // [NEW] Link to specific version
    currentTime: number;
    onSeek: (time: number) => void;
    comments?: any[]; // Using any[] to match AVSyncPlayer for now, or use Doc<"comments">[]
    isLocked?: boolean;
}

export function CommentsSection({ episodeId, versionId, currentTime, onSeek, comments, isLocked = false }: CommentsSectionProps) {
    const createComment = useMutation(api.comments.create);
    const editComment = useMutation(api.comments.edit);
    const deleteComment = useMutation(api.comments.deleteComment);
    const resolveComment = useMutation(api.comments.resolve);
    const clearAll = useMutation(api.comments.clearAll);
    const completeRevision = useMutation(api.episodes.completeRevision);
    const activeRevisionBatch = useQuery(api.episodes.getActiveRevisionBatch, { episodeId });
    const { isAdmin } = useUserRole();

    const [newCommentText, setNewCommentText] = useState("");
    const [activeReplyId, setActiveReplyId] = useState<Id<"comments"> | null>(null);

    // Group comments into threads
    const threads = React.useMemo(() => {
        if (!comments) return { topLevel: [], replies: {} };
        const topLevel: any[] = [];
        const replies: Record<string, any[]> = {};

        comments.forEach(c => {
            if (c.parentId) {
                if (!replies[c.parentId]) replies[c.parentId] = [];
                replies[c.parentId].push(c);
            } else {
                // Filter for Revision Mode?
                // If activeRevisionBatch exists, frontend plan says "List all comments linked to this batchId"
                // But comments prop comes from parent which fetches ALL comments.
                // We should filter logic here.
                if (activeRevisionBatch) {
                    if (c.revisionBatchId === activeRevisionBatch._id) {
                        topLevel.push(c);
                    }
                } else {
                    // Normal Mode: Show all or just non-batched? 
                    // Usually "In Review" means we are working on them.
                    // For now show all in normal mode.
                    topLevel.push(c);
                }
            }
        });

        // Sort Top Level by Creation Time DESC (Newest First) per user request
        topLevel.sort((a, b) => b._creationTime - a._creationTime);
        Object.values(replies).forEach(arr => arr.sort((a, b) => a._creationTime - b._creationTime));

        return { topLevel, replies };
    }, [comments, activeRevisionBatch]);

    const handleCreate = async (parentId?: Id<"comments">) => {
        if (isLocked) return;
        if (!newCommentText.trim()) return;

        await createComment({
            episodeId,
            versionId, // [NEW] Pass versionId
            text: newCommentText,
            timestamp: currentTime,
            user: {
                name: "Me",
                avatar: "https://placehold.co/100x100/ec4899/ffffff?text=ME",
            },
            parentId
        });

        setNewCommentText("");
        setActiveReplyId(null);
    };

    const handleEdit = async (commentId: Id<"comments">, newText: string) => {
        if (isLocked) return;
        await editComment({ commentId, text: newText });
    };

    const handleDelete = async (commentId: Id<"comments">) => {
        if (isLocked) return;
        // Confirmation is annoying during dev/demos, removed for snapiness or use custom modal
        // keeping confirm for safety based on previous step
        if (confirm("Are you sure you want to delete this comment?")) {
            await deleteComment({ commentId });
        }
    };

    const handleResolve = async (commentId: Id<"comments">) => {
        if (isLocked) return;
        await resolveComment({ commentId });
    };

    const handleClearAll = async () => {
        if (isLocked) return;
        if (confirm("Are you sure you want to clear ALL comments? This cannot be undone.")) {
            await clearAll({ episodeId, versionId });
        }
    };

    const handleCompleteRevision = async () => {
        if (!activeRevisionBatch) return;
        await completeRevision({ batchId: activeRevisionBatch._id, episodeId });
    };

    if (!comments) return null;

    const formatTime = (seconds: number) => {
        const min = Math.floor(seconds / 60);
        const sec = Math.floor(seconds % 60);
        return `${min < 10 ? '0' : ''}${min}:${sec < 10 ? '0' : ''}${sec}`;
    };

    const isRevisionMode = !!activeRevisionBatch;

    return (

        <section className="w-full h-full pl-5 pt-8 pb-4">
            {/* Obsidian Glass Thread Popover */}
            {/* Obsidian Glass Thread Popover - Transparent Update */}
            <div className={`w-full h-full rounded-xl flex flex-col overflow-hidden relative transition-all duration-500
                ${isRevisionMode ? 'bg-red-500/10 border border-red-500/30 backdrop-blur-md' : 'bg-transparent'}
            `}>

                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4">
                    <div className="flex flex-col">
                        {isRevisionMode ? (
                            <div className="flex items-center gap-2 mb-1">
                                <span className="material-symbols-outlined text-red-500 animate-pulse text-[20px]">engineering</span>
                                <span className="text-red-400 font-bold uppercase tracking-widest text-xs">Revision Ticket</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <span className="text-[#ff3399] text-[22px] font-bold tracking-tighter tabular-nums">
                                    {formatTime(currentTime)}
                                </span>
                            </div>
                        )}
                        <p className="text-[11px] text-white/40 font-medium tracking-wide">
                            {isRevisionMode ? "TASKS & FEEDBACK" : "COMMENTS & NOTES"}
                        </p>
                    </div>

                    <div className="flex items-center gap-1">
                        <button
                            onClick={handleClearAll}
                            className="p-2 text-white/20 hover:text-red-400 transition-colors rounded-full hover:bg-white/5 group relative"
                            title="Clear"
                        >
                            <span className="material-symbols-outlined text-[20px]">delete_sweep</span>
                        </button>
                    </div>
                </div>

                {/* Revision Note */}
                {isRevisionMode && (
                    <div className="px-5 py-4 bg-red-500/5 border-b border-red-500/10">
                        <p className="text-xs text-red-200/80 uppercase tracking-widest mb-2 font-bold">Client Instructions</p>
                        <div className="text-sm text-white italic pl-3 border-l-2 border-red-500/50">
                            "{activeRevisionBatch?.note}"
                        </div>
                    </div>
                )}


                {/* Input Area (Top) */}
                {/* Input Area (Top) */}
                {!isRevisionMode && !isLocked && (
                    <div className="p-4">
                        <div className="relative flex items-center bg-white/5 border border-white/10 rounded-2xl px-2 py-1 focus-within:bg-white/10 focus-within:border-primary/50 transition-all duration-300">
                            <textarea
                                className="w-full bg-transparent border-none focus:ring-0 text-[13px] text-white placeholder:text-white/30 resize-none p-2 pr-10 appearance-none focus:outline-none placeholder:font-light"
                                placeholder="Add your comment here..."
                                rows={1}
                                value={newCommentText}
                                onChange={(e) => setNewCommentText(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey && !activeReplyId) {
                                        e.preventDefault();
                                        handleCreate();
                                    }
                                }}
                            />
                            <button
                                onClick={() => handleCreate()}
                                className="absolute right-0 p-2 text-[#ff3399] hover:scale-110 transition-transform"
                            >
                                <span className="material-symbols-outlined text-[20px]">send</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* Locked Banner */}
                {!isRevisionMode && isLocked && (
                    <div className="p-4">
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
                            <p className="text-white/40 text-xs font-mono uppercase tracking-widest flex items-center justify-center gap-2">
                                <span className="material-symbols-outlined text-[16px]">lock</span>
                                Episode Locked
                            </p>
                        </div>
                    </div>
                )}

                {/* Scrollable Comment Area */}
                <div className="flex-1 flex flex-col gap-6 p-5 pb-10 overflow-y-auto min-h-0 custom-scrollbar">
                    {threads.topLevel.length === 0 && (
                        <div className="text-center py-8 text-white/20 italic text-sm">
                            {isRevisionMode ? "All tasks completed!" : "No notes yet. Add one above."}
                        </div>
                    )}

                    {threads.topLevel.map((comment) => (
                        <div key={comment._id} className="flex flex-col gap-4">

                            <CommentCard
                                comment={comment}
                                onSeek={onSeek}
                                onReply={() => setActiveReplyId(comment._id)}
                                onEdit={handleEdit}
                                onDelete={handleDelete}
                                onResolve={handleResolve}
                            />

                            {/* Replies */}
                            {threads.replies[comment._id]?.map((reply) => (
                                <div key={reply._id} className="pl-6">
                                    <CommentCard
                                        comment={reply}
                                        onSeek={onSeek}
                                        onReply={() => setActiveReplyId(comment._id)}
                                        onEdit={handleEdit}
                                        onDelete={handleDelete}
                                        onResolve={handleResolve}
                                    />
                                </div>
                            ))}

                            {/* Reply Input */}
                            {activeReplyId === comment._id && (
                                <div className="pl-6 animate-in slide-in-from-top-2">
                                    <div className="relative flex items-center bg-white/[0.02] border border-white/10 rounded-lg p-1">
                                        <textarea
                                            autoFocus
                                            className="w-full bg-transparent border-none focus:ring-0 text-[13px] text-white placeholder:text-white/20 resize-none p-2 pr-10 min-h-[40px] appearance-none focus:outline-none"
                                            placeholder="Write a reply..."
                                            rows={1}
                                            value={newCommentText}
                                            onChange={(e) => setNewCommentText(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleCreate(comment._id))}
                                        />
                                        <button
                                            onClick={() => handleCreate(comment._id)}
                                            className="absolute right-1 p-2 text-[#ff3399] hover:scale-110 transition-transform"
                                        >
                                            <span className="material-symbols-outlined text-[20px]">send</span>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Footer: Complete Button (Only for Revision Mode) */}
                {isRevisionMode && isAdmin && (
                    <div className="p-4 border-t border-red-500/10 bg-red-900/5 backdrop-blur-sm">
                        <button
                            onClick={handleCompleteRevision}
                            className="w-full py-3 rounded-lg bg-green-500/20 hover:bg-green-500/30 border border-green-500/50 text-green-400 text-xs font-bold tracking-[0.2em] uppercase transition-all flex items-center justify-center gap-2 group shadow-[0_0_20px_rgba(34,197,94,0.1)] hover:shadow-[0_0_30px_rgba(34,197,94,0.2)]"
                        >
                            <span className="material-symbols-outlined group-hover:scale-110 transition-transform text-[18px]">check_circle</span>
                            Mark Revision Complete
                        </button>
                    </div>
                )}
            </div>
        </section>
    );
}
