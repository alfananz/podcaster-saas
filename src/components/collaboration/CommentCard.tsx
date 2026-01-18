import React, { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';

interface CommentCardProps {
    comment: any;
    onSeek: (time: number) => void;
    onReply: (parentId: Id<"comments">) => void;
    isThreadView?: boolean;
}

export function CommentCard({ comment, onSeek, onReply, isThreadView = false }: CommentCardProps) {
    const toggleLike = useMutation(api.comments.toggleLike);
    const resolve = useMutation(api.comments.resolve);

    const timeAgo = (date: number) => {
        const seconds = Math.floor((Date.now() - date) / 1000);
        if (seconds < 60) return "JUST NOW";
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}M AGO`;
        const hours = Math.floor(minutes / 60);
        return `${hours}H AGO`;
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

            {/* Content */}
            <p className="text-[13px] leading-relaxed text-white/70 font-light">
                {comment.text}
            </p>

            {/* Actions Footer */}
            <div className="flex items-center gap-4 mt-1">
                {/* Like Button */}
                <button
                    onClick={() => toggleLike({ commentId: comment._id })}
                    className="flex items-center gap-1.5 group"
                >
                    <span className={`material-symbols-outlined text-[16px] transition-colors ${comment.likes > 0 ? 'text-[#ff3399]' : 'text-white/30 group-hover:text-[#ff3399]'}`}>thumb_up</span>
                    <span className={`text-[11px] transition-colors ${comment.likes > 0 ? 'text-white' : 'text-white/30 group-hover:text-white'}`}>{comment.likes || 0}</span>
                </button>

                {/* Reply / Edit Button */}
                {!isMe && (
                    <button
                        onClick={() => onReply(comment._id)}
                        className="text-[11px] text-white/30 hover:text-white font-medium transition-colors"
                    >
                        REPLY
                    </button>
                )}
                {isMe && (
                    <button className="text-[11px] text-white/30 hover:text-white font-medium transition-colors">EDIT</button>
                )}
            </div>
        </div>
    );
}
