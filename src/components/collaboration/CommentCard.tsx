import React, { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import { useUserRole } from '../../hooks/useUserRole';

interface CommentCardProps {
    comment: any;
    onSeek: (time: number) => void;
    onReply: (parentId: Id<"comments">) => void;
    onEdit: (commentId: Id<"comments">, newText: string) => void;
    onDelete: (commentId: Id<"comments">) => void;
    onResolve: (commentId: Id<"comments">) => void;
    isThreadView?: boolean;
    isRevisionMode?: boolean;
    isHighlighted?: boolean; // [NEW]
}

export function CommentCard({ comment, onSeek, onReply, onEdit, onDelete, onResolve, isThreadView = false, isRevisionMode = false, isHighlighted = false }: CommentCardProps) {
    const { isAdmin } = useUserRole();
    const toggleLike = useMutation(api.comments.toggleLike);
    const [isEditing, setIsEditing] = useState(false);
    const [editText, setEditText] = useState(comment.text);

    const timeAgo = (date: number) => {
        const seconds = Math.floor((Date.now() - date) / 1000);
        if (seconds < 60) return "JUST NOW";
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}M AGO`;
        const hours = Math.floor(minutes / 60);
        return `${hours}H AGO`;
    };

    const handleSaveEdit = () => {
        if (editText.trim() !== comment.text) {
            onEdit(comment._id, editText);
        }
        setIsEditing(false);
    };

    const handleCancelEdit = () => {
        setEditText(comment.text);
        setIsEditing(false);
    };

    // Styling: "Bubble" Design
    const isMe = comment.user.name === "Me";
    const role = comment.user.role || (isAdmin ? 'admin' : 'client'); // Fallback for legacy
    const isClient = role === 'client';
    const accentColor = isClient ? 'text-[#33bbff]' : 'text-[#ff3399]';
    const borderColor = isClient ? 'border-[#33bbff]/50' : 'border-[#ff3399]/50';
    const glowColor = isClient ? 'shadow-[0_0_30px_rgba(51,187,255,0.2)]' : 'shadow-[0_0_30px_rgba(255,51,153,0.2)]';
    const bgTint = isClient ? 'bg-[#33bbff]/10' : 'bg-[#ff3399]/10';

    // Styling: "Technical Audit" Design - Larger & Interactive
    return (
        <div
            onClick={() => onSeek(comment.timestamp)}
            className={`p-5 rounded-2xl border transition-all w-full cursor-pointer duration-500
                ${isHighlighted
                    ? `${bgTint} ${borderColor} ${glowColor}`
                    : 'bg-white/5 border-white/5 hover:border-white/10 hover:bg-white/10'}
                ${comment.isResolved ? 'opacity-50 hover:opacity-100' : 'opacity-100'}
            `}
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                    <div className={`size-8 rounded-xl bg-cover border shadow-sm ${isClient ? 'border-[#33bbff]/30 shadow-[#33bbff]/20' : 'border-[#ff3399]/30 shadow-[#ff3399]/20'}`} style={{
                        backgroundImage: `url(${comment.user.avatar || `https://ui-avatars.com/api/?name=${comment.user.name}&background=random`})`
                    }}></div>
                    <div>
                        <span className="text-xs font-bold text-white tracking-wide block">{comment.user.name}</span>
                        <span className={`text-[9px] uppercase tracking-wider font-bold ${accentColor} opacity-80`}>
                            {isClient ? 'Client' : 'Engineer'}
                        </span>
                    </div>
                    {comment.isResolved && (
                        <span className="text-[9px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded font-black uppercase tracking-wider">
                            Resolved
                        </span>
                    )}
                </div>
                {isMe ? (
                    <span className="text-[10px] font-mono text-primary bg-primary/10 px-2 py-1 rounded-md font-bold shadow-sm shadow-primary/5">
                        {timeAgo(comment._creationTime)}
                    </span>
                ) : (
                    <span className="text-[10px] font-mono text-white/40 bg-white/5 px-2 py-1 rounded-md">
                        {timeAgo(comment._creationTime)}
                    </span>
                )}
            </div>

            {/* Content or Edit Mode */}
            {isEditing ? (
                <div className="flex flex-col gap-3" onClick={(e) => e.stopPropagation()}>
                    <textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="w-full bg-black/20 border border-white/10 rounded-xl p-4 text-sm text-white focus:outline-none focus:border-primary/50 min-h-[80px]"
                        autoFocus
                    />
                    <div className="flex items-center gap-2 justify-end mt-1">
                        <button onClick={handleCancelEdit} className="text-[10px] font-bold text-white/40 hover:text-white uppercase tracking-widest px-2">CANCEL</button>
                        <button onClick={handleSaveEdit} className="text-[10px] font-bold text-primary hover:text-primary/80 uppercase tracking-widest bg-primary/10 px-3 py-1.5 rounded-lg border border-primary/20">SAVE</button>
                    </div>
                </div>
            ) : (
                <p className="text-[13px] text-white/70 leading-relaxed font-normal whitespace-pre-wrap">
                    {comment.text}
                </p>
            )}

            {/* Actions Footer */}
            {!isEditing && (
                <div className={`mt-4 flex gap-3 items-center border-t border-white/5 pt-3 transition-opacity ${isRevisionMode ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                    {/* Like Button */}
                    <button
                        onClick={(e) => { e.stopPropagation(); toggleLike({ commentId: comment._id }); }}
                        className={`text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 py-1 px-2 rounded-lg hover:bg-white/5 transition-colors ${comment.likes > 0 ? 'text-primary' : 'text-white/30 hover:text-white'}`}
                    >
                        {comment.likes > 0 && <span className="material-symbols-outlined text-[12px]">favorite</span>}
                        {comment.likes > 0 ? comment.likes : 'LIKE'}
                    </button>



                    {/* Hide Reply if in Revision Mode (unless Admin) */}
                    {(!isRevisionMode || isAdmin) && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onReply(comment._id); }}
                            className="text-[10px] font-bold text-white/30 hover:text-white uppercase tracking-widest hover:bg-white/5 py-1 px-2 rounded-lg transition-colors"
                        >
                            REPLY
                        </button>
                    )}

                    {isMe && (
                        <>
                            {(!isRevisionMode || isAdmin) && (
                                <button onClick={(e) => { e.stopPropagation(); setIsEditing(true); }} className="text-[10px] font-bold text-white/30 hover:text-white uppercase tracking-widest hover:bg-white/5 py-1 px-2 rounded-lg transition-colors">EDIT</button>
                            )}

                            {/* [MODIFIED] Only Admins can resolve */}
                            {isAdmin && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); onResolve(comment._id); }}
                                    className={`text-[10px] font-bold uppercase tracking-widest py-1 px-2 rounded-lg transition-colors ${comment.isResolved ? 'text-emerald-400 hover:text-white hover:bg-emerald-500/20' : 'text-white/30 hover:text-emerald-400 hover:bg-emerald-500/10'}`}
                                >
                                    {comment.isResolved ? "UNRESOLVE" : "RESOLVE"}
                                </button>
                            )}

                            {(!isRevisionMode || isAdmin) && (
                                <button onClick={(e) => { e.stopPropagation(); onDelete(comment._id); }} className="text-[10px] font-bold text-white/30 hover:text-red-400 uppercase tracking-widest hover:bg-red-500/10 py-1 px-2 rounded-lg transition-colors">DELETE</button>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
