import React, { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import { CommentCard } from './CommentCard';

interface CommentsSectionProps {
    episodeId: Id<"episodes">;
    currentTime: number;
    onSeek: (time: number) => void;
    comments?: any[]; // Using any[] to match AVSyncPlayer for now, or use Doc<"comments">[]
}

export function CommentsSection({ episodeId, currentTime, onSeek, comments }: CommentsSectionProps) {
    // Removed internal useQuery(api.comments.list) as it passes via props now
    const createComment = useMutation(api.comments.create);

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
                topLevel.push(c);
            }
        });

        topLevel.sort((a, b) => a.timestamp - b.timestamp);
        Object.values(replies).forEach(arr => arr.sort((a, b) => a._creationTime - b._creationTime));

        return { topLevel, replies };
    }, [comments]);

    const handleCreate = async (parentId?: Id<"comments">) => {
        if (!newCommentText.trim()) return;

        await createComment({
            episodeId,
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

    if (!comments) return null;

    const formatTime = (seconds: number) => {
        const min = Math.floor(seconds / 60);
        const sec = Math.floor(seconds % 60);
        return `${min < 10 ? '0' : ''}${min}:${sec < 10 ? '0' : ''}${sec}`;
    };

    return (
        <section className="mt-8 w-full">
            {/* Obsidian Glass Thread Popover */}
            <div className="w-full rounded-xl flex flex-col overflow-hidden bg-[#1a1c20]/85 backdrop-blur-md border border-white/5 shadow-[0_0_40px_-10px_rgba(255,51,153,0.15)] relative">

                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                            {/* Live Timestamp (mocking the "01:24:05" style) */}
                            <span className="text-[#ff3399] text-[22px] font-bold tracking-tighter tabular-nums">
                                {formatTime(currentTime)}
                            </span>
                            {/* Optional Marker badge */}
                            {/* <span className="text-[10px] uppercase tracking-widest text-white/30 font-bold border border-white/10 px-1.5 py-0.5 rounded">Marker A</span> */}
                        </div>
                        <p className="text-[11px] text-white/40 font-medium tracking-wide">COMMENTS & NOTES</p>
                    </div>

                    <div className="flex items-center gap-1">
                        <button className="p-2 text-white/40 hover:text-[#ff3399] transition-colors group">
                            <span className="material-symbols-outlined text-[22px]">check_circle</span>
                        </button>
                    </div>
                </div>

                {/* Scrollable Comment Area */}
                <div className="flex flex-col gap-6 p-5 overflow-y-auto max-h-[450px] scrollbar-thin scrollbar-thumb-pink-500/30 scrollbar-track-transparent">
                    {threads.topLevel.length === 0 && (
                        <div className="text-center py-8 text-white/20 italic text-sm">
                            No notes yet. Add one below.
                        </div>
                    )}

                    {threads.topLevel.map((comment) => (
                        <div key={comment._id} className="flex flex-col gap-4">
                            {/* Timestamp Link for the Thread */}
                            <div className="flex items-center gap-2 opacity-50 hover:opacity-100 transition-opacity w-fit cursor-pointer" onClick={() => onSeek(comment.timestamp)}>
                                <span className="material-symbols-outlined text-[14px] text-[#ff3399]">timer</span>
                                <span className="text-[10px] font-mono text-[#ff3399]">{formatTime(comment.timestamp)}</span>
                            </div>

                            <CommentCard
                                comment={comment}
                                onSeek={onSeek}
                                onReply={() => setActiveReplyId(comment._id)}
                            />

                            {/* Replies */}
                            {threads.replies[comment._id]?.map((reply) => (
                                <div key={reply._id} className="pl-6">
                                    <CommentCard
                                        comment={reply}
                                        onSeek={onSeek}
                                        onReply={() => setActiveReplyId(comment._id)}
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

                {/* Input Footer (New Thread) */}
                <div className="p-4 border-t border-white/5 bg-white/[0.02]">
                    <div className="relative flex items-center">
                        <textarea
                            className="w-full bg-transparent border-none focus:ring-0 text-[13px] text-white placeholder:text-white/20 resize-none p-0 pr-10 appearance-none focus:outline-none placeholder:font-light"
                            placeholder="Add a technical note..."
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
            </div>
        </section>
    );
}
