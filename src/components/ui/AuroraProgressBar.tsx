"use client";
import React from 'react';

interface AuroraProgressBarProps {
    fileName: string;
    progress: number;
    status: 'uploading' | 'success' | 'error';
}

export function AuroraProgressBar({ fileName, progress, status }: AuroraProgressBarProps) {
    const isComplete = status === 'success' || progress === 100;

    return (
        <div className={`
            glass-panel p-8 rounded-xl border transition-all duration-500
            ${isComplete ? 'border-[#0bda87]/20 shadow-[0_0_30px_rgba(11,218,135,0.1)]' : 'border-[#00CCFF]/20'}
        `}>
            <div className="flex flex-col gap-6">
                <div className="flex justify-between items-end">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                            {isComplete ? (
                                <span className="material-symbols-outlined text-[#0bda87] text-sm">check_circle</span>
                            ) : (
                                <span className="material-symbols-outlined text-[#00CCFF] text-sm animate-pulse">movie</span>
                            )}
                            <p className="text-white text-lg font-medium truncate max-w-[300px]">{fileName}</p>
                        </div>
                        <p className={`text-sm font-normal ${isComplete ? 'text-[#0bda87]' : 'text-white/40'}`}>
                            {isComplete ? 'Processing Complete' : 'Uploading...'}
                        </p>
                    </div>
                    <p className={`text-3xl font-bold tracking-tighter ${isComplete ? 'text-[#0bda87]' : 'text-[#00CCFF]'}`}>
                        {Math.round(progress)}%
                    </p>
                </div>

                <div className="h-4 rounded-full overflow-hidden relative bg-[rgba(18,16,24,0.6)] shadow-inner border border-white/5">
                    <div
                        className={`h-full relative flex justify-end transition-all duration-300 ease-out ${isComplete ? 'bg-[#0bda87] shadow-[0_0_15px_rgba(11,218,135,0.4)]' : 'bg-gradient-to-r from-[#E02B90] to-[#00CCFF]'}`}
                        style={{ width: `${progress}%` }}
                    >
                        {/* The Leading Edge "Laser" - Only show when not complete */}
                        {!isComplete && (
                            <div className="h-full w-1 bg-white shadow-[0_0_15px_rgba(0,204,255,0.6),4px_0_8px_rgba(0,204,255,0.8)] z-10 absolute right-0" />
                        )}

                        {/* The Shimmer Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent w-full opacity-50" />
                    </div>
                </div>
            </div>
        </div>
    );
}
