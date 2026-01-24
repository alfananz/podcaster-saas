import React, { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { useUserRole } from '../../hooks/useUserRole';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import { AnimatePresence, motion } from 'framer-motion';
import { CommentCard } from './CommentCard';

// Helper utility
function cn(...classes: any[]) {
    return classes.filter(Boolean).join(" ");
}

const formatTime = (seconds: number) => {
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min < 10 ? '0' : ''}${min}:${sec < 10 ? '0' : ''}${sec}`;
};

// [NEW] Recursive Tree Data Structure
export type CommentNode = {
    _id: Id<"comments">;
    text: string;
    user: { name: string; avatar: string };
    creationTime: number;
    formattedTime: string; // pre-calc helper
    data: any; // original object
    children: CommentNode[];
};

interface ThreadNodeProps {
    node: CommentNode;
    depth: number;
    activeReplyId: Id<"comments"> | null;
    onReply: (id: Id<"comments">) => void;
    newCommentText: string;
    setNewCommentText: (text: string) => void;
    onCreate: (parentId: Id<"comments">) => void;
    onSeek: (time: number) => void;
    onEdit: (commentId: Id<"comments">, newText: string) => void;
    onDelete: (commentId: Id<"comments">) => void;
    onResolve: (commentId: Id<"comments">) => void;
    isRevisionMode?: boolean; // [NEW]
    highlightedCommentId?: Id<"comments"> | null; // [NEW]
}

// Extracted Component to prevent re-definition on render
const ThreadNode = React.memo(({
    node,
    depth,
    activeReplyId,
    onReply,
    newCommentText,
    setNewCommentText,
    onCreate,
    onSeek,
    onEdit,
    onDelete,
    onResolve,
    isRevisionMode = false, // [NEW]
    highlightedCommentId // [NEW]
}: ThreadNodeProps) => {
    // Styling Logic
    const isHighlighted = highlightedCommentId === node._id;
    const isDimmed = !!highlightedCommentId && !isHighlighted;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`flex flex-col gap-3 relative transition-all duration-500 ${isDimmed ? 'opacity-30 scale-95 blur-[1px]' : ''} ${isHighlighted ? 'scale-105 z-10' : ''}`}
        >
            {/* The Card */}
            <CommentCard
                comment={node.data}
                onSeek={onSeek}
                onReply={() => onReply(node._id)}
                onEdit={onEdit}
                onDelete={onDelete}
                onResolve={onResolve}
                isRevisionMode={isRevisionMode}
                isHighlighted={isHighlighted} // [NEW]
            />

            {/* Reply Input (Attached immediately below parent if active) */}
            {activeReplyId === node._id && (
                <div className={cn("animate-in slide-in-from-top-1", depth > 0 ? "pl-0" : "pl-4")}>
                    <div className="relative flex items-center bg-white/[0.05] border border-white/10 rounded-lg p-1">
                        <textarea
                            autoFocus
                            className="w-full bg-transparent border-none focus:ring-0 text-[13px] text-white placeholder:text-white/40 resize-none p-2 pr-10 min-h-[40px] appearance-none focus:outline-none placeholder:italic"
                            placeholder={`Reply to ${node.user.name}...`}
                            rows={1}
                            value={newCommentText}
                            onChange={(e) => setNewCommentText(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), onCreate(node._id))}
                        />
                        <button
                            onClick={() => onCreate(node._id)}
                            className="absolute right-1 p-2 text-[#ff3399] hover:scale-110 transition-transform"
                        >
                            <span className="material-symbols-outlined text-[20px]">send</span>
                        </button>
                    </div>
                </div>
            )}

            {/* Children - Recursion */}
            {node.children.length > 0 && (
                <div className="flex flex-col gap-3 pl-4 relative ml-2">
                    {/* Thread Line - Visual Guide */}
                    <div className="absolute left-0 top-0 bottom-4 w-px bg-white/10"></div>

                    {node.children.map(child => (
                        <ThreadNode
                            key={child._id}
                            node={child}
                            depth={depth + 1}
                            activeReplyId={activeReplyId}
                            onReply={onReply}
                            newCommentText={newCommentText}
                            setNewCommentText={setNewCommentText}
                            onCreate={onCreate}
                            onSeek={onSeek}
                            onEdit={onEdit}
                            onDelete={onDelete}
                            onResolve={onResolve}
                            isRevisionMode={isRevisionMode} // [NEW] Recurse
                            highlightedCommentId={highlightedCommentId} // [NEW] Pass down
                        />
                    ))}
                </div>
            )}
        </motion.div>
    );
});

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
    const [showCompleteConfirmation, setShowCompleteConfirmation] = useState(false); // [NEW]

    const handleConfirmComplete = async () => {
        if (!activeRevisionBatch) return;
        await completeRevision({ batchId: activeRevisionBatch._id, episodeId });
        setShowCompleteConfirmation(false);
    };

    // [NEW] Logic to highlight comment based on playback
    const highlightedCommentId = React.useMemo(() => {
        if (!comments) return null;
        // Find comments within +/- 2 seconds of currentTime
        const tolerance = 2000; // 2 seconds? wait, comments vary.
        // Timestamp in comments might be number (seconds?).
        // In CommentCard: onSeek(comment.timestamp).
        // let's assume `c.timestamp` is seconds. (formatTime takes seconds).

        const candidates = comments.filter(c => Math.abs(c.timestamp - currentTime) < 1.5); // 1.5s window
        if (candidates.length === 0) return null;

        // Pick closest
        candidates.sort((a, b) => Math.abs(a.timestamp - currentTime) - Math.abs(b.timestamp - currentTime));
        return candidates[0]._id as Id<"comments">;
    }, [comments, currentTime]);

    const commentTree = React.useMemo(() => {
        if (!comments) return [];

        // 1. Map all to nodes
        const nodeMap = new Map<string, CommentNode>();
        comments.forEach(c => {
            // Safe user extraction because schema was flattened
            // @ts-ignore
            const user = c.user || { name: c.name, avatar: c.avatar, role: c.role };

            nodeMap.set(c._id, {
                _id: c._id,
                text: c.text,
                user: user,
                creationTime: c._creationTime,
                formattedTime: formatTime(c.timestamp), // This formatTime is for the SEEK TIMESTAMP, not creation date.
                data: c,
                children: []
            });
        });

        // 2. Build Tree
        const roots: CommentNode[] = [];
        // Filter based on activeRevisionBatch if needed...
        // For now, consistent with previous logic:
        comments.forEach(c => {
            // Logic filter:
            let include = true;
            if (activeRevisionBatch) {
                if (c.revisionBatchId !== activeRevisionBatch._id) include = false;
            }

            if (include) {
                const node = nodeMap.get(c._id)!;
                if (c.parentId && nodeMap.has(c.parentId)) {
                    nodeMap.get(c.parentId)!.children.push(node);
                    // We sort children by time immediately
                    nodeMap.get(c.parentId)!.children.sort((a, b) => a.creationTime - b.creationTime);
                } else {
                    roots.push(node);
                }
            }
        });

        // 3. Sort Roots (Newest First)
        roots.sort((a, b) => b.creationTime - a.creationTime);
        return roots;
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
                role: isAdmin ? "admin" : "client", // [NEW]
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



    const isRevisionMode = !!activeRevisionBatch && activeRevisionBatch.versionId === versionId;
    const isPendingRevisionLock = !!activeRevisionBatch && activeRevisionBatch.versionId !== versionId;

    // [NEW] Fetch pending version details for the lock screen
    // [NEW] Fetch pending version details for the lock screen
    const pendingVersion = useQuery(api.versions.get,
        (isPendingRevisionLock && activeRevisionBatch?.versionId) ? { versionId: activeRevisionBatch.versionId } : "skip"
    );

    if (isPendingRevisionLock) {
        return (
            <section className="w-full h-full pl-5 pt-8 pb-4">
                <div className="w-full h-full rounded-xl flex flex-col items-center justify-center p-8 relative overflow-hidden">
                    {/* Background decoration */}
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-blue-500/5 pointer-events-none opacity-50" />

                    <div className="relative z-10 flex flex-col items-center text-center gap-4">
                        <div className="relative">
                            <div className="absolute inset-0 bg-purple-500/20 blur-xl rounded-full animate-pulse" />
                            <span className="material-symbols-outlined text-[48px] text-purple-200 relative z-10">pending_actions</span>
                        </div>

                        <h3 className="text-xl font-bold text-white tracking-tight mt-2">Revision in Progress</h3>
                        <p className="text-sm text-white/50 max-w-[280px] leading-relaxed">
                            A revision ticket is currently open on a previous version ({pendingVersion?.name || "..."}).
                            <br /><br />
                            Please wait for the current revision to be completed before adding new comments.
                        </p>
                    </div>
                </div>
            </section>
        );
    }

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
                            {isRevisionMode ? "THIS IS WHAT WE'RE WORKING ON NOW" : "COMMENTS & NOTES"}
                        </p>
                    </div>

                    <div className="flex items-center gap-1">
                        <button
                            onClick={isRevisionMode ? undefined : handleClearAll}
                            disabled={isRevisionMode}
                            className={`p-2 transition-colors rounded-full group relative ${isRevisionMode ? 'text-white/5 cursor-not-allowed' : 'text-white/20 hover:text-red-400 hover:bg-white/5'}`}
                            title={isRevisionMode ? "Cannot clear during active revision" : "Clear All"}
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
                {(!isRevisionMode || isAdmin) && !isLocked && (
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
                    {commentTree.length === 0 && (
                        <div className="text-center py-8 text-white/20 italic text-sm">
                            {isRevisionMode ? "All tasks completed!" : "No notes yet. Add one above."}
                        </div>
                    )}

                    <AnimatePresence mode="popLayout">
                        {commentTree.map((node) => (
                            <ThreadNode
                                key={node._id}
                                node={node}
                                depth={0}
                                activeReplyId={activeReplyId}
                                onReply={setActiveReplyId}
                                newCommentText={newCommentText}
                                setNewCommentText={setNewCommentText}
                                onCreate={handleCreate}
                                onSeek={onSeek}
                                onEdit={handleEdit}
                                onDelete={handleDelete}
                                onResolve={handleResolve}
                                isRevisionMode={isRevisionMode} // [NEW] Pass top level
                                highlightedCommentId={highlightedCommentId} // [NEW]
                            />
                        ))}
                    </AnimatePresence>
                </div>

                {/* Footer: Complete Button (Only for Revision Mode) */}
                {isRevisionMode && isAdmin && (
                    <div className="p-4 border-t border-red-500/10 bg-red-900/5 backdrop-blur-sm">
                        <button
                            onClick={() => setShowCompleteConfirmation(true)}
                            className="w-full py-3 rounded-lg bg-green-500/20 hover:bg-green-500/30 border border-green-500/50 text-green-400 text-xs font-bold tracking-[0.2em] uppercase transition-all flex items-center justify-center gap-2 group shadow-[0_0_20px_rgba(34,197,94,0.1)] hover:shadow-[0_0_30px_rgba(34,197,94,0.2)]"
                        >
                            <span className="material-symbols-outlined group-hover:scale-110 transition-transform text-[18px]">check_circle</span>
                            Mark Revision Complete
                        </button>
                    </div>
                )}
            </div>

            {/* Confirmation Modal */}
            <AnimatePresence>
                {showCompleteConfirmation && (
                    <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4">
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowCompleteConfirmation(false)}
                            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                        />

                        {/* Modal */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            className="relative bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl overflow-hidden"
                        >
                            {/* Decorative Glow */}
                            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500/50 to-emerald-500/50" />
                            <div className="absolute -top-20 -left-20 w-40 h-40 bg-green-500/20 rounded-full blur-3xl pointer-events-none" />

                            <h3 className="text-lg font-bold text-white mb-2 relative z-10">Complete Revision?</h3>
                            <p className="text-sm text-white/60 mb-6 leading-relaxed relative z-10">
                                This will notify the client that all tasks in this revision batch have been completed.
                            </p>

                            <div className="flex gap-3 relative z-10">
                                <button
                                    onClick={() => setShowCompleteConfirmation(false)}
                                    className="flex-1 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-xs font-bold tracking-wider uppercase transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleConfirmComplete}
                                    className="flex-1 py-2.5 rounded-lg bg-green-500 hover:bg-green-400 text-black text-xs font-bold tracking-wider uppercase transition-colors shadow-lg shadow-green-500/20"
                                >
                                    Yes, Complete
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </section>
    );
}
