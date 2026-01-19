import React from 'react';
import { useRouter } from 'next/navigation';

interface ProcessingScreenProps {
    stage: string;
    progress?: number;
    title: string;
}

export function ProcessingScreen({ stage, progress, title }: ProcessingScreenProps) {
    const router = useRouter();

    // Map internal stage to user-facing labels and descriptions
    const getStageInfo = (stage: string) => {
        switch (stage) {
            case 'queued':
                return {
                    label: 'IN QUEUE',
                    desc: 'Your episode is waiting for an available processor.',
                    icon: 'hourglass_empty',
                    color: 'text-white/50'
                };
            case 'transcribing':
                return {
                    label: 'TRANSCRIBING AUDIO',
                    desc: 'Our AI is listening to every word and identifying speakers.',
                    icon: 'hearing',
                    color: 'text-[#ff4db5]'
                };
            case 'enriching':
                return {
                    label: 'GENERATING ENRICHMENT',
                    desc: 'Creating show notes, chapters, and SEO tags.',
                    icon: 'auto_awesome',
                    color: 'text-[#3C8CE7]'
                };
            case 'failed':
                return {
                    label: 'PROCESSING FAILED',
                    desc: 'Something went wrong. Please try re-uploading.',
                    icon: 'error',
                    color: 'text-red-500'
                };
            default:
                return {
                    label: 'PROCESSING',
                    desc: ' preparing your workstation...',
                    icon: 'pending',
                    color: 'text-white'
                };
        }
    };

    const info = getStageInfo(stage);

    return (
        <div className="flex flex-col items-center justify-center h-screen w-full bg-[#0a0612] relative overflow-hidden">
            {/* Background Ambience */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px] pointer-events-none animate-pulse"></div>

            <div className="relative z-10 flex flex-col items-center gap-8 max-w-lg text-center p-12 rounded-3xl border border-white/5 bg-white/[0.02] backdrop-blur-xl shadow-2xl">

                {/* Icon Circle */}
                <div className={`size-24 rounded-full border-4 border-white/5 flex items-center justify-center bg-[#111317] shadow-[0_0_40px_-10px_rgba(0,0,0,0.5)] ${stage === 'failed' ? 'border-red-500/20' : 'animate-pulse'}`}>
                    <span className={`material-symbols-outlined text-[40px] ${info.color} ${stage !== 'failed' && 'animate-spin-slow'}`}>
                        {info.icon}
                    </span>
                </div>

                <div className="space-y-3">
                    <h2 className="text-3xl font-black text-white tracking-tight">{title}</h2>
                    <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 ${info.color}`}>
                        <span className="size-2 rounded-full bg-current animate-pulse"></span>
                        <span className="text-xs font-bold tracking-[0.2em] uppercase">{info.label}</span>
                    </div>
                </div>

                <p className="text-white/60 text-sm font-medium leading-relaxed max-w-[300px]">
                    {info.desc}
                </p>

                {/* Progress Bar (Fake or Real if available) */}
                <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden relative mt-4">
                    {stage === 'queued' && <div className="absolute inset-0 bg-white/20 w-1/3 animate-loading-bar"></div>}
                    {stage === 'transcribing' && <div className="absolute inset-0 bg-[#ff4db5] w-2/3 animate-loading-bar"></div>}
                    {stage === 'enriching' && <div className="absolute inset-0 bg-[#3C8CE7] w-full animate-loading-bar shadow-[0_0_15px_#3C8CE7]"></div>}
                </div>

                <p className="text-[10px] text-white/30 font-mono mt-2 uppercase tracking-widest">
                    Do not close this tab
                </p>

                {stage === 'failed' && (
                    <button onClick={() => router.push('/dashboard')} className="mt-8 px-8 py-3 bg-white/10 hover:bg-white/20 text-white text-xs font-bold uppercase tracking-widest rounded-lg transition-colors">
                        Return to Dashboard
                    </button>
                )}
            </div>
        </div>
    );
}
