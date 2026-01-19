import { createPortal } from 'react-dom';
import React, { useState, useEffect } from 'react';

interface RequestChangesModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (feedback: string) => void;
}

export function RequestChangesModal({ isOpen, onClose, onSubmit }: RequestChangesModalProps) {
    const [mounted, setMounted] = useState(false);
    const [feedback, setFeedback] = useState("");

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    const handleSubmit = () => {
        if (!feedback.trim()) return;
        onSubmit(feedback);
        setFeedback(""); // Reset
    };

    if (!isOpen || !mounted) return null;

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
            {/* Obsidian Request Changes Modal */}
            <div className="obsidian-glass w-full max-w-[520px] rounded-xl overflow-hidden border border-white/5 flex flex-col relative shadow-2xl">
                {/* Simplified Header */}
                <div className="flex items-center justify-between px-8 pt-8 pb-4">
                    <div className="flex flex-col">
                        <h2 className="text-white text-2xl font-bold tracking-[0.1em] uppercase">Request Changes</h2>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="material-symbols-outlined text-[#ff4db5] text-xs" style={{ fontSize: '14px' }}>timer</span>
                            <p className="text-[#bc9aae] text-[10px] font-medium tracking-[0.2em] uppercase">Segment: --:--</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-white/40 hover:text-[#ff4db5] transition-all duration-300"
                    >
                        <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>close</span>
                    </button>
                </div>

                {/* Body Text / Instruction */}
                <div className="px-8 pb-2">
                    <p className="text-[#bc9aae] text-sm font-light leading-relaxed">
                        Provide precise instructions for the audio engineering team. Mention timestamp-specific adjustments or tonal corrections.
                    </p>
                </div>

                {/* Obsidian Textarea */}
                <div className="px-8 py-4">
                    <div className="relative group">
                        <textarea
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                            className="w-full min-h-[180px] bg-black/20 border border-transparent rounded-lg p-5 text-white placeholder:text-white/10 text-base font-normal leading-relaxed resize-none transition-all duration-300 neon-focus custom-scrollbar"
                            placeholder="e.g. Reduce the low-end frequency on the guest track during this transition..."
                        ></textarea>

                        {/* Decorative corner accents */}
                        <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-white/10 pointer-events-none"></div>
                        <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-white/10 pointer-events-none"></div>
                        <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-white/10 pointer-events-none"></div>
                        <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-white/10 pointer-events-none"></div>
                    </div>
                </div>

                {/* Metadata tags */}
                <div className="px-8 pb-8 flex gap-3">
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-white/5 bg-white/5">
                        <span className="material-symbols-outlined text-[14px] text-[#ff4db5]">equalizer</span>
                        <span className="text-[10px] uppercase tracking-widest text-white/60">Audio Fix</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-white/5 bg-white/5">
                        <span className="material-symbols-outlined text-[14px] text-[#ff4db5]">auto_fix</span>
                        <span className="text-[10px] uppercase tracking-widest text-white/60">High Priority</span>
                    </div>
                </div>

                {/* Full-Width Action Button */}
                <button
                    onClick={handleSubmit}
                    disabled={!feedback.trim()}
                    className="w-full py-6 bg-gradient-to-r from-[#ff4db5] to-[#c2185b] text-white text-sm font-bold tracking-[0.3em] uppercase hover:brightness-110 active:scale-[0.99] transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <span>Submit Revisions</span>
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>bolt</span>
                </button>
            </div>

            {/* Decorative Elements for Context - Only visible if we have space, currently implemented as per provided HTML but rendered within the portal */}
            <div className="fixed bottom-10 left-10 hidden xl:block opacity-20 pointer-events-none">
                <div className="text-xs tracking-[0.5em] uppercase text-white rotate-90 origin-left">
                    Revision Control v3.0 // Obsidian Variant
                </div>
            </div>
        </div>,
        document.body
    );
}
