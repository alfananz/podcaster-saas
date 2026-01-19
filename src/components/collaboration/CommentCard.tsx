import React, { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';

interface CommentCardProps {
    comment: any;
    onSeek: (time: number) => void;
    onReply: (parentId: Id<"comments">) => void;
    onEdit: (commentId: Id<"comments">, newText: string) => void;
    onDelete: (commentId: Id<"comments">) => void;
    isThreadView?: boolean;
}

export function CommentCard({ comment, onSeek, onReply, onEdit, onDelete, isThreadView = false }: CommentCardProps) {
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

    // Styling constants derived from the "Minimalist Pro" design
    const isMe = comment.user.name === "Me"; // Mock logic for "Me" styling

    return (
        <div className={`flex flex-col gap-1.5 pl-4 transition-all ${isMe
            ? 'border-l-[2px] border-[#ff3399] bg-[#ff3399]/5 py-2 -mx-2 px-4 rounded-r-lg'
            : 'border-l-[2px] border-white/20 hover:border-white/40'
            }`}>
            {/* Header: Name + Time */}
            <div className="flex items-center justify-between">
                <span className={`text-xs font-bold tracking-wide ${isMe ? 'text-[#ff3399]' : 'text-white'}`}>
                    {comment.user.name.toUpperCase()}
                </span>
                <span className="text-[10px] text-white/30 font-medium">{timeAgo(comment._creationTime)}</span>
            </div>

            {/* Content or Edit Mode */}
            {isEditing ? (
                <div className="flex flex-col gap-2 mt-1">
                    <textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded p-2 text-[13px] text-white focus:outline-none focus:border-[#ff3399]/50"
                        rows={3}
                        autoFocus
                    />
                    <div className="flex items-center gap-2 justify-end">
                        <button
                            onClick={handleCancelEdit}
                            className="text-[10px] text-white/40 hover:text-white uppercase tracking-wider font-bold px-2"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSaveEdit}
                            className="text-[10px] bg-[#ff3399]/20 text-[#ff3399] hover:bg-[#ff3399]/40 border border-[#ff3399]/20 px-3 py-1 rounded uppercase tracking-wider font-bold transition-colors"
                        >
                            Save
                        </button>
                    </div>
                </div>
            ) : (
                <p className="text-[13px] leading-relaxed text-white/70 font-light whitespace-pre-wrap">
                    {comment.text}
                </p>
            )}

            {/* Actions Footer */}
            {!isEditing && (
                <div className="flex items-center gap-4 mt-1">
                    {/* Like Button */}
                    <button
                        onClick={() => toggleLike({ commentId: comment._id })}
                        className="flex items-center gap-1.5 group"
                    >
                        <span className={`material-symbols-outlined text-[16px] transition-colors ${comment.likes > 0 ? 'text-[#ff3399]' : 'text-white/30 group-hover:text-[#ff3399]'}`}>thumb_up</span>
                        <span className={`text-[11px] transition-colors ${comment.likes > 0 ? 'text-white' : 'text-white/30 group-hover:text-white'}`}>{comment.likes || 0}</span>
                    </button>

                    {/* Reply */}
                    {!isMe && (
                        <button onClick={() => onReply(comment._id)} className="text-[11px] text-white/30 hover:text-white font-medium transition-colors">REPLY</button>
                    )}

                    {/* Owner Actions */}
                    {isMe && (
                        <>
                            <button
                                onClick={() => setIsEditing(true)}
                                className="text-[11px] text-white/30 hover:text-white font-medium transition-colors"
                            >
                                EDIT
                            </button>
                            <button
                                onClick={() => onDelete(comment._id)}
                                className="text-[11px] text-white/30 hover:text-red-400 font-medium transition-colors"
                            >
                                DELETE
                            </button>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
