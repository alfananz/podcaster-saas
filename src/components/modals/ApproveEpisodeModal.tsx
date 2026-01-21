import { useRef, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Id } from "../../../convex/_generated/dataModel";

interface ApproveEpisodeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    episodeTitle: string;
}

export function ApproveEpisodeModal({ isOpen, onClose, onConfirm, episodeTitle }: ApproveEpisodeModalProps) {
    const dialogRef = useRef<HTMLDivElement>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const handleClickOutside = (event: MouseEvent) => {
            if (dialogRef.current && !dialogRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isOpen, onClose]);

    if (!isOpen || !mounted) return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                ref={dialogRef}
                className="w-full max-w-md bg-[#121214] border border-white/10 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden scale-in-center animate-in zoom-in-95 duration-200"
            >
                {/* Header */}
                <div className="p-6 pb-0">
                    <div className="size-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4">
                        <span className="material-symbols-outlined text-emerald-400 text-2xl">check_circle</span>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Approve Episode</h3>
                    <p className="text-white/60 text-sm leading-relaxed">
                        Are you sure you want to approve <span className="text-white font-bold">"{episodeTitle}"</span>?
                    </p>
                </div>

                {/* Warning Content */}
                <div className="p-6">
                    <div className="bg-yellow-500/5 border border-yellow-500/10 rounded-xl p-4 flex gap-3">
                        <span className="material-symbols-outlined text-yellow-500/80 shrink-0">lock</span>
                        <div className="space-y-1">
                            <p className="text-yellow-200/90 text-xs font-bold uppercase tracking-wider">This action locks the episode</p>
                            <p className="text-yellow-200/60 text-xs leading-relaxed">
                                Once approved, no further edits, comments, or revision requests can be made. The status will change to <span className="text-emerald-400">Ready to Publish</span>.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 pt-0 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-xs font-bold uppercase tracking-widest transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className="flex-1 px-4 py-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 hover:text-white text-xs font-bold uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(16,185,129,0.1)] hover:shadow-[0_0_30px_rgba(16,185,129,0.2)] flex items-center justify-center gap-2"
                    >
                        <span>Approve & Lock</span>
                        <span className="material-symbols-outlined text-base">lock</span>
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
