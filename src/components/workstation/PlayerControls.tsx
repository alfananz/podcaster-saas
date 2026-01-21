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
                <div className="relative flex items-center justify-between px-1 h-10">

                    {/* Left: Volume Slider */}
                    <div
                        className="flex items-center gap-3 group/vol relative"
                        onMouseEnter={() => setIsHoveringVolume(true)}
                        onMouseLeave={() => setIsHoveringVolume(false)}
                    >
                        {/* Tooltip */}
                        <div className={`absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded text-[9px] font-bold text-white bg-white/10 backdrop-blur-md border border-white/10 transition-opacity whitespace-nowrappointer-events-none ${isHoveringVolume ? 'opacity-100' : 'opacity-0'}`}>
                            {Math.round(localVolume * 100)}%
                        </div>

                        <button onClick={() => onVolumeChange?.(localVolume === 0 ? 1 : 0)}>
                            <span className="material-symbols-outlined text-base text-white/60 group-hover/vol:text-white">
                                {localVolume === 0 ? 'volume_off' : localVolume < 0.5 ? 'volume_down' : 'volume_up'}
                            </span>
                        </button>

                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            value={localVolume}
                            onChange={(e) => {
                                const newVol = parseFloat(e.target.value);
                                setLocalVolume(newVol);
                                onVolumeChange?.(newVol);
                            }}
                            className="w-20 h-1 bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:box-shadow-[0_0_8px_rgba(255,255,255,0.5)] transition-all hover:h-1.5 focus:outline-none"
                            style={{
                                backgroundImage: `linear-gradient(to right, white ${localVolume * 100}%, rgba(255,255,255,0.1) ${localVolume * 100}%)`
                            }}
                        />
                    </div>

                    {/* Center: Play Button */}
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                        <button
                            onClick={onTogglePlay}
                            className="group relative flex size-10 items-center justify-center rounded-full border border-white/20 transition-all hover:border-[#ff6bb5]/50 hover:bg-[#ff6bb5]/10"
                        >
                            <span className={`material-symbols-outlined text-2xl transition-all group-hover:text-[#ff6bb5] ${isPlaying ? 'fill-1' : ''}`}>
                                {isPlaying ? 'pause' : 'play_arrow'}
                            </span>
                        </button>
                    </div>

                    {/* Right: Fullscreen */}
                    <div className="flex items-center gap-1">
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
