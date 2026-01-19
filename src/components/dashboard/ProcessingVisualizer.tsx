import React from 'react';

interface ProcessingVisualizerProps {
    stage: string | undefined;
}

export function ProcessingVisualizer({ stage = 'queued' }: ProcessingVisualizerProps) {
    // 1. Calculate Active Step
    const getActiveStep = (currentStage: string) => {
        switch (currentStage) {
            case 'processing': return { label: 'Processing Media', subtext: 'Optimizing video & audio...' };
            case 'transcribing': return { label: 'Transcribing', subtext: 'AI speech-to-text running...' };
            case 'enriching': return { label: 'Enriching', subtext: 'Generating show notes...' };
            case 'completed': return { label: 'Finalizing', subtext: 'Wrapping up...' };
            case 'revision_requested': return { label: 'Revision', subtext: 'Waiting for feedback...' };
            default: return { label: 'Queued', subtext: 'Waiting for slot...' };
        }
    };

    const activeStep = getActiveStep(stage);

    // 2. Step Logic (Simplified for Card)
    const steps = [
        { id: 'media', label: 'Media', triggerStage: ['processing', 'transcribing', 'enriching', 'completed'] },
        { id: 'transcript', label: 'Transcription', triggerStage: ['transcribing', 'enriching', 'completed'] },
        { id: 'enrich', label: 'AI Magic', triggerStage: ['enriching', 'completed'] },
    ];

    const getStepState = (stepId: string) => {
        const stageOrder = ['queued', 'processing', 'transcribing', 'enriching', 'completed'];
        const currentIdx = stageOrder.indexOf(stage);

        const stepStartMap: Record<string, number> = {
            'media': 1,
            'transcript': 2,
            'enrich': 3,
        };

        const stepIdx = stepStartMap[stepId];

        if (currentIdx > stepIdx) return 'DONE';
        if (currentIdx === stepIdx) return 'ACTIVE';
        return 'PENDING';
    };

    return (
        <div className="absolute inset-0 bg-[#0c0c0d] flex flex-col items-center justify-center overflow-hidden">
            {/* Ambient Background */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(168,85,247,0.15),transparent_70%)] animate-pulse-slow"></div>

            {/* Animated Grid Overlay */}
            <div className="absolute inset-0 opacity-20"
                style={{
                    backgroundImage: 'linear-gradient(0deg, transparent 24%, rgba(255, 255, 255, .05) 25%, rgba(255, 255, 255, .05) 26%, transparent 27%, transparent 74%, rgba(255, 255, 255, .05) 75%, rgba(255, 255, 255, .05) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, rgba(255, 255, 255, .05) 25%, rgba(255, 255, 255, .05) 26%, transparent 27%, transparent 74%, rgba(255, 255, 255, .05) 75%, rgba(255, 255, 255, .05) 76%, transparent 77%, transparent)',
                    backgroundSize: '30px 30px'
                }}>
            </div>

            {/* Central Content */}
            <div className="relative z-10 flex flex-col items-center gap-3 w-full px-6">

                {/* Active Stage Icon/Spinner */}
                <div className="relative">
                    <div className="absolute inset-0 bg-purple-500 blur-xl opacity-20 animate-pulse"></div>
                    <div className="relative size-12 flex items-center justify-center rounded-full border border-white/10 bg-white/5 backdrop-blur-md">
                        <span className="material-symbols-outlined text-purple-400 animate-spin-slow text-2xl">
                            settings_motion_mode
                        </span>
                    </div>
                </div>

                {/* Text Update */}
                <div className="text-center space-y-1">
                    <h3 className="text-white font-bold tracking-tight text-lg animate-fade-in">
                        {activeStep.label}
                    </h3>
                    <p className="text-white/40 text-xs font-mono uppercase tracking-wider">
                        {activeStep.subtext}
                    </p>
                </div>

                {/* Micro Steps Progress */}
                <div className="flex items-center gap-1 mt-2">
                    {steps.map((step) => {
                        const state = getStepState(step.id);
                        const isDone = state === 'DONE';
                        const isActive = state === 'ACTIVE';

                        return (
                            <div key={step.id} className="flex flex-col items-center gap-1 group">
                                <div className={`h-1 w-8 rounded-full transition-all duration-500 ${isDone ? 'bg-green-500' :
                                        isActive ? 'bg-purple-500 animate-pulse' :
                                            'bg-white/10'
                                    }`}></div>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Scanline Effect */}
            <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(to_bottom,transparent_50%,rgba(0,0,0,0.3)_50%)] bg-[length:100%_4px] opacity-20"></div>
        </div>
    );
}
