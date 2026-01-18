import React, { useRef, useState, useEffect } from 'react';

interface PlayerControlsProps {
    isPlaying: boolean;
    currentTime: number;
    duration: number;
    volume?: number;
    title?: string;
    onTogglePlay: () => void;
    onSeek: (time: number) => void;
    onVolumeChange?: (volume: number) => void;
    onSkipForward: () => void;
    onSkipBack: () => void;
    onFullscreen?: () => void;
}

export function PlayerControls({
    isPlaying,
    currentTime,
    duration,
    volume = 1,
    title = "Episode",
    onTogglePlay,
    onSeek,
    onVolumeChange,
    onSkipForward,
    onSkipBack,
    onFullscreen
}: PlayerControlsProps) {
    const progressBarRef = useRef<HTMLDivElement>(null);
    const volumeBarRef = useRef<HTMLDivElement>(null);
    const [localVolume, setLocalVolume] = useState(volume);
    const [isHoveringVolume, setIsHoveringVolume] = useState(false);

    // Format time MM:SS
    const formatTime = (time: number) => {
        if (!time || isNaN(time)) return "00:00";
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    };

    const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

    const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!progressBarRef.current || duration === 0) return;
        const rect = progressBarRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const width = rect.width;
        const newTime = (x / width) * duration;
        onSeek(Math.max(0, Math.min(newTime, duration)));
    };

    const handleVolumeClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!volumeBarRef.current || !onVolumeChange) return;
        const rect = volumeBarRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const width = rect.width;
        const newVolume = Math.max(0, Math.min(x / width, 1));
        setLocalVolume(newVolume);
        onVolumeChange(newVolume);
    };

    // Sync local volume if prop changes
    useEffect(() => {
        setLocalVolume(volume);
    }, [volume]);

    return (
        <div className="w-full max-w-2xl mx-auto px-4 pb-4">
            <div className="bg-[#0D0D14]/85 backdrop-blur-[16px] border border-white/[0.08] shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-xl p-3 flex flex-col gap-2">

                {/* Progress Bar Component */}
                <div className="flex flex-col gap-1 px-2 group/progress cursor-pointer" onClick={handleProgressClick}>
                    <div className="flex justify-between items-end mb-1">
                        <span className="text-[9px] font-medium tracking-widest uppercase text-white/40 truncate max-w-[200px]">{title}</span>
                        <span className="text-[10px] font-bold text-[#ff6bb5]">{formatTime(currentTime)} <span className="text-white/30 px-1">/</span> {formatTime(duration)}</span>
                    </div>
                    <div className="relative h-1 w-full rounded-full bg-white/10 overflow-hidden" ref={progressBarRef}>
                        {/* Cyan to Pink Gradient Progress */}
                        <div
                            className="h-full rounded-full relative"
                            style={{
                                width: `${progressPercentage}%`,
                                background: 'linear-gradient(90deg, #00FFFF 0%, #ff6bb5 100%)'
                            }}
                        >
                            <div className="absolute right-0 top-1/2 -translate-y-1/2 size-2.5 bg-white rounded-full shadow-[0_0_8px_#ff6bb5] opacity-0 group-hover/progress:opacity-100 transition-opacity"></div>
                        </div>
                    </div>
                </div>

                {/* Main Control Section */}
                <div className="flex items-center justify-between px-1">

                    {/* Left: Playback Controls */}
                    <div className="flex items-center gap-4">
                        <button onClick={onSkipBack} className="text-white/70 hover:text-white transition-colors">
                            <span className="material-symbols-outlined text-xl">skip_previous</span>
                        </button>

                        {/* Minimalist Outline Play Button */}
                        <button
                            onClick={onTogglePlay}
                            className="group relative flex size-10 items-center justify-center rounded-full border border-white/20 transition-all hover:border-[#ff6bb5]/50 hover:bg-[#ff6bb5]/10"
                        >
                            <span className={`material-symbols-outlined text-2xl transition-all group-hover:text-[#ff6bb5] ${isPlaying ? 'fill-1' : ''}`}>
                                {isPlaying ? 'pause' : 'play_arrow'}
                            </span>
                        </button>

                        <button onClick={onSkipForward} className="text-white/70 hover:text-white transition-colors">
                            <span className="material-symbols-outlined text-xl">skip_next</span>
                        </button>
                    </div>

                    {/* Middle: Volume Slider */}
                    <div
                        className="hidden md:flex items-center gap-3 group/vol relative"
                        onMouseEnter={() => setIsHoveringVolume(true)}
                        onMouseLeave={() => setIsHoveringVolume(false)}
                    >
                        {/* Tooltip */}
                        <div className={`absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded text-[9px] font-bold text-white bg-white/10 backdrop-blur-md border border-white/10 transition-opacity whitespace-nowrap ${isHoveringVolume ? 'opacity-100' : 'opacity-0'}`}>
                            {Math.round(localVolume * 100)}%
                        </div>

                        <button onClick={() => onVolumeChange?.(localVolume === 0 ? 1 : 0)}>
                            <span className="material-symbols-outlined text-base text-white/60 group-hover/vol:text-white">
                                {localVolume === 0 ? 'volume_off' : localVolume < 0.5 ? 'volume_down' : 'volume_up'}
                            </span>
                        </button>

                        <div
                            className="w-20 h-1 bg-white/10 rounded-full relative overflow-hidden cursor-pointer"
                            ref={volumeBarRef}
                            onClick={handleVolumeClick}
                        >
                            <div
                                className="absolute inset-y-0 left-0 bg-white/80 rounded-full"
                                style={{ width: `${localVolume * 100}%` }}
                            ></div>
                        </div>
                    </div>

                    {/* Right: Utility Controls */}
                    <div className="flex items-center gap-1">
                        {/* Settings with Tooltip */}
                        <div className="group/settings relative">
                            <button className="p-1.5 text-white/60 hover:text-white hover:rotate-45 transition-all">
                                <span className="material-symbols-outlined text-xl">settings</span>
                            </button>
                        </div>

                        <button className="p-1.5 text-white/60 hover:text-white transition-colors">
                            <span className="material-symbols-outlined text-xl">closed_caption</span>
                        </button>

                        <button className="p-1.5 text-white/60 hover:text-white transition-colors">
                            <span className="material-symbols-outlined text-xl">branding_watermark</span>
                        </button>

                        <button
                            onClick={onFullscreen}
                            className="ml-1 p-1.5 rounded-lg bg-[#ff6bb5]/10 text-[#ff6bb5] hover:bg-[#ff6bb5] hover:text-black transition-all"
                        >
                            <span className="material-symbols-outlined text-xl">fullscreen</span>
                        </button>
                    </div>
                </div>


            </div>
        </div>
    );
}
