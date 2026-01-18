import React, { useState } from 'react';

interface DeleteEpisodeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    episodeTitle: string;
}

export function DeleteEpisodeModal({ isOpen, onClose, onConfirm, episodeTitle }: DeleteEpisodeModalProps) {
    const [isChecked, setIsChecked] = useState(false);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            {/* Friction-Based Safety Modal */}
            <div className="relative w-full max-w-[520px] rounded-sm overflow-hidden flex flex-col shadow-2xl bg-[#141414]/95 backdrop-blur-xl border border-white/5">

                {/* Red Top-Border Accent (Safety Signal) */}
                <div className="absolute top-0 left-0 w-full h-[3px] bg-red-600"></div>

                {/* Content Container */}
                <div className="px-8 pt-10 pb-4">

                    {/* Icon & Header */}
                    <div className="flex flex-col items-center text-center">
                        <div className="mb-6 flex items-center justify-center size-14 rounded-full bg-red-600/10 text-red-500 border border-red-500/20">
                            <span className="material-symbols-outlined !text-3xl">warning</span>
                        </div>
                        <h1 className="text-white tracking-tight text-[28px] font-bold leading-tight pb-3">
                            Delete Podcast Episode?
                        </h1>
                    </div>

                    {/* Body Text */}
                    <div className="text-center">
                        <p className="text-gray-400 text-base font-normal leading-relaxed pb-6 px-4">
                            You are about to delete <span className="text-white font-semibold">'{episodeTitle}'</span>.
                            This will permanently remove all audio files, show notes, and metadata from our servers.
                        </p>
                    </div>

                    {/* Friction Checkbox Area */}
                    <div className="bg-black/40 border border-white/5 rounded-lg p-5 mb-8">
                        <div className="px-4">
                            <label className="flex items-center gap-x-4 cursor-pointer group">
                                <input
                                    className="h-6 w-6 rounded border-white/20 border-2 bg-transparent text-emerald-500 checked:bg-emerald-500 checked:border-emerald-500 focus:ring-emerald-500/40 focus:ring-offset-0 focus:outline-none transition-all cursor-pointer accent-emerald-500"
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={(e) => setIsChecked(e.target.checked)}
                                />
                                <p className="text-white/80 text-sm md:text-base font-medium leading-normal group-hover:text-white transition-colors">
                                    I understand this cannot be undone
                                </p>
                            </label>
                        </div>
                    </div>

                    {/* Action Footer */}
                    <div className="flex flex-col-reverse sm:flex-row gap-3 justify-center pt-2">
                        <button
                            onClick={onClose}
                            className="flex-1 flex min-w-[140px] cursor-pointer items-center justify-center rounded h-12 px-5 bg-white/5 hover:bg-white/10 text-white text-base font-bold leading-normal tracking-[0.015em] transition-colors border border-white/10"
                        >
                            <span className="truncate">Keep Episode</span>
                        </button>

                        <button
                            onClick={onConfirm}
                            disabled={!isChecked}
                            className={`flex-1 flex min-w-[140px] items-center justify-center rounded h-12 px-5 text-white text-base font-bold leading-normal tracking-[0.015em] shadow-lg shadow-red-600/20 transition-all ${isChecked
                                    ? 'bg-red-600 hover:brightness-110 active:scale-[0.98] cursor-pointer'
                                    : 'bg-red-600/50 opacity-50 cursor-not-allowed'
                                }`}
                        >
                            <span className="truncate">Permanently Delete</span>
                        </button>
                    </div>
                </div>

                {/* Subtle Metadata Footer */}
                <div className="px-8 py-4 border-t border-white/5 text-center">
                    <p className="text-[10px] uppercase tracking-[0.1em] text-white/30 font-bold">
                        Action logged by System Administrator • Session ID: 49201-MEL
                    </p>
                </div>
            </div>
        </div>
    );
}
