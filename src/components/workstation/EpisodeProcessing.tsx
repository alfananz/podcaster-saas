import React from 'react';
import { useRouter } from 'next/navigation';

interface EpisodeProcessingProps {
    stage: string | undefined;
    progress?: number;
    title: string;
    isResuming?: boolean; // NEW: If true, we are just waiting for client hydration
}

export function EpisodeProcessing({ stage = 'queued', progress, title, isResuming = false }: EpisodeProcessingProps) {
    const router = useRouter();

    // 1. Calculate Progress
    const getProgress = (stage: string) => {
        switch (stage) {
            case 'uploading': return 10;
            case 'processing': return 30; // Video/Waveform
            case 'transcribing': return 60;
            case 'enriching': return 85;
            case 'completed': return 100;
            default: return 5; // Queued
        }
    };

    const currentProgress = getProgress(stage);

    // 2. Step Logic
    const steps = [
        { id: 'media', label: 'Process Media Assets', triggerStage: ['processing', 'transcribing', 'enriching', 'completed'] },
        { id: 'transcript', label: 'Transcribe Audio', triggerStage: ['transcribing', 'enriching', 'completed'] },
        { id: 'enrich', label: 'Generate Show Notes', triggerStage: ['enriching', 'completed'] },
        { id: 'complete', label: 'Finalize Workspace', triggerStage: ['completed'] }
    ];

    const getStepState = (stepId: string) => {
        // Simple linear progression check
        const stageOrder = ['queued', 'uploading', 'processing', 'transcribing', 'enriching', 'completed'];
        const currentIdx = stageOrder.indexOf(stage);

        // Define when each step starts being active
        const stepStartMap: Record<string, number> = {
            'media': 2, // processing
            'transcript': 3, // transcribing
            'enrich': 4, // enriching
            'complete': 5 // completed
        };

        const stepIdx = stepStartMap[stepId];

        if (currentIdx > stepIdx) return 'DONE';
        if (currentIdx === stepIdx) return 'ACTIVE';
        return 'PENDING';
    };

    return (
        <div className="flex flex-col items-center justify-center h-full w-full relative overflow-hidden font-display">
            {/* Background Ambience */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/2 left-1/2 w-[600px] h-[600px] bg-accent-pink/5 rounded-full blur-[100px] animate-aurora-blob"></div>
            </div>

            <div className="relative z-10 flex flex-col items-center gap-16 max-w-2xl w-full">

                {/* MODE A: WARM BOOT (Resuming/Spinning Up) */}
                {/* Simplified view for when we are just waiting for client hydration */}
                {isResuming ? (
                    <div className="flex flex-col items-center gap-6 animate-in fade-in zoom-in duration-500">
                        <div className="relative size-24 flex items-center justify-center">
                            <div className="absolute inset-0 rounded-full border border-white/5"></div>
                            <div className="size-16 border-4 border-mello-blue border-t-transparent rounded-full animate-spin"></div>
                            <span className="material-symbols-outlined text-2xl text-white/20 absolute">
                                bolt
                            </span>
                        </div>
                        <div className="text-center space-y-2">
                            <h3 className="text-2xl font-bold text-white tracking-tight">
                                Spinning up your episode...
                            </h3>
                            <p className="text-white/40 text-sm font-mono">
                                Loading high-fidelity assets
                            </p>
                        </div>
                    </div>
                ) : (
                    /* MODE B: COLD BOOT (Processing) */
                    /* Full detailed view for actual backend processing */
                    <>
                        {/* 1. Progress Ring Section */}
                        <div className="flex items-center justify-center gap-8">
                            {/* Ring Container */}
                            <div className="relative size-32 flex items-center justify-center">
                                <div className="absolute inset-0 rounded-full border border-white/5"></div>

                                {/* Rotating Gradient Border */}
                                <svg className="absolute inset-0 size-full -rotate-90" viewBox="0 0 100 100">
                                    <circle
                                        cx="50" cy="50" r="46"
                                        fill="none"
                                        stroke="#1a1c20"
                                        strokeWidth="6"
                                    />
                                    <circle
                                        cx="50" cy="50" r="46"
                                        fill="none"
                                        stroke="#ff4db5"
                                        strokeWidth="6"
                                        strokeDasharray="289" // 2 * pi * 46
                                        strokeDashoffset={289 - (289 * currentProgress / 100)}
                                        strokeLinecap="round"
                                        className="transition-all duration-1000 ease-out drop-shadow-[0_0_10px_rgba(255,77,181,0.5)]"
                                    />
                                </svg>

                                {/* Center Icon instead of text */}
                                <span className="material-symbols-outlined text-4xl text-white/20 animate-pulse">
                                    dns
                                </span>
                            </div>

                            {/* Text Content */}
                            <div className="flex flex-col gap-1">
                                <span className="text-7xl font-black text-white tracking-tighter tabular-nums drop-shadow-lg leading-none">
                                    {currentProgress}%
                                </span>
                                <span className="text-sm font-bold text-accent-pink uppercase tracking-[0.3em] animate-pulse pl-1">
                                    System Boot
                                </span>
                            </div>
                        </div>

                        {/* 2. Boot Sequence List (The Steps) */}
                        <div className="w-full max-w-md bg-white/[0.02] border border-white/5 rounded-2xl p-6 backdrop-blur-xl">
                            <div className="space-y-4">
                                {steps.map((step) => {
                                    const state = getStepState(step.id);
                                    const isDone = state === 'DONE';
                                    const isActive = state === 'ACTIVE';

                                    return (
                                        <div
                                            key={step.id}
                                            className={`
                                            flex items-center gap-4 p-4 rounded-xl border border-transparent transition-all duration-500
                                            ${isDone ? 'opacity-50' : ''}
                                            ${isActive ? 'opacity-100 border-accent-pink/30 bg-white/[0.02] shadow-[0_0_15px_rgba(249,41,150,0.1)]' : ''}
                                            ${!isDone && !isActive ? 'opacity-30' : ''}
                                        `}
                                        >
                                            {/* Icon Box */}
                                            <div className={`
                                            size-10 rounded-lg flex items-center justify-center transition-all duration-300
                                            ${isDone ? 'bg-success-green/20 text-success-green' : ''}
                                            ${isActive ? 'bg-accent-pink text-white animate-pulse' : ''}
                                            ${!isDone && !isActive ? 'bg-white/10 text-white/20' : ''}
                                        `}>
                                                <span className="material-symbols-outlined text-[20px]">
                                                    {isDone ? 'check_circle' : isActive ? 'memory' : 'radio_button_unchecked'}
                                                </span>
                                            </div>

                                            {/* Text Content */}
                                            <div className="flex-1">
                                                <h4 className={`text-sm font-bold tracking-tight ${isDone ? 'line-through text-white/50' : 'text-white'}`}>
                                                    {step.label}
                                                </h4>
                                                <p className={`text-[10px] font-mono mt-0.5 uppercase tracking-wider
                                                ${isDone ? 'text-success-green' : ''}
                                                ${isActive ? 'text-accent-pink' : ''}
                                                ${!isDone && !isActive ? 'text-white/30' : ''}
                                            `}>
                                                    Status: {isDone ? 'Complete' : isActive ? 'Processing...' : 'Waiting...'}
                                                </p>
                                            </div>

                                            {/* Active Spinner */}
                                            {isActive && (
                                                <div className="size-5 rounded-full border-2 border-white/10 border-t-accent-pink animate-spin"></div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Footer Quote / Tip */}
                        <p className="text-white/30 text-xs font-mono text-center max-w-sm animate-pulse">
                            "Initializing Mello Studio neural engine..."
                        </p>
                    </>
                )}

            </div>
        </div>
    );
}
