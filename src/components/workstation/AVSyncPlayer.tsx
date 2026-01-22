"use client";

import { useState, useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from "react";
import WaveSurfer from "wavesurfer.js";
import { PlayerControls } from "./PlayerControls";
import { useMutation, useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";

interface AVSyncPlayerProps {
    episodeId?: Id<"episodes">;
    versionId?: Id<"versions">; // [NEW] Context
    videoUrl: string;
    waveformUrl?: string | null; // [NEW] Pre-computed peaks URL
    onTimeUpdate?: (time: number) => void;
    comments?: any[]; // Keep any for now to avoid specific type dependency, or define stricter
    title?: string;
    onReady?: () => void;
}

export interface AVSyncPlayerRef {
    seekTo: (time: number) => void;
}

const AVSyncPlayer = forwardRef<AVSyncPlayerRef, AVSyncPlayerProps>(({ episodeId, versionId, videoUrl, waveformUrl, onTimeUpdate, comments = [], title, onReady }, ref) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [hasMounted, setHasMounted] = useState(false);
    const [duration, setDuration] = useState(0);
    const [isWaveformReady, setIsWaveformReady] = useState(false); // [NEW]

    // Callback Refs to force re-render when elements are ready
    const [container, setContainer] = useState<HTMLDivElement | null>(null);
    const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null);
    const videoContainerRef = useRef<HTMLDivElement>(null);

    const waveSurferRef = useRef<WaveSurfer | null>(null);

    // Convex Mutations
    const generateS3UploadUrl = useAction(api.actions.files.generateS3UploadUrl);
    const saveWaveform = useMutation(api.episodes.saveWaveform);
    const saveWaveformVersion = useMutation(api.versions.saveWaveform);

    // Client-side guard & Immediate Ready
    useEffect(() => {
        setHasMounted(true);
        if (onReady) setTimeout(onReady, 0);
    }, []);

    useImperativeHandle(ref, () => ({
        seekTo: (time: number) => {
            if (videoElement) {
                videoElement.currentTime = time;
            }
        }
    }));

    // --- MANUAL WAVESURFER INITIALIZATION ---
    useEffect(() => {
        if (!container || !videoElement || !videoUrl) return;

        let ws: WaveSurfer | null = null;
        let isDestroyed = false;

        const initTimer = setTimeout(async () => {
            if (isDestroyed) return;

            if (waveSurferRef.current) {
                waveSurferRef.current.destroy();
                waveSurferRef.current = null;
            }

            console.log("[AVSyncPlayer] Initializing WaveSurfer...");

            let preComputedPeaks = undefined;
            if (waveformUrl) {
                try {
                    const response = await fetch(waveformUrl);
                    if (response.ok) {
                        const json = await response.json();
                        preComputedPeaks = json.data || json;
                    }
                } catch (err) {
                    console.error("[AVSyncPlayer] Failed to load peaks:", err);
                }
            }

            ws = WaveSurfer.create({
                container: container,
                media: videoElement,
                url: videoUrl,
                peaks: preComputedPeaks,
                fetchParams: {
                    mode: 'cors',
                    credentials: 'omit',
                },
                waveColor: "rgba(255, 255, 255, 0.4)",
                progressColor: "#3C8CE7",
                height: 120,
                barWidth: 4,
                barGap: 3,
                barRadius: 4,
                fillParent: true,
                interact: true,
                cursorColor: "#3C8CE7",
                cursorWidth: 2,
                normalize: true,
            });

            ws.on('ready', async (d) => {
                setIsWaveformReady(true); // [NEW] Trigger Ready State

                const vidDuration = videoElement?.duration;
                if (vidDuration && vidDuration > 0 && vidDuration !== Infinity) {
                    setDuration(vidDuration);
                } else {
                    setDuration(d);
                }

                if (!waveformUrl && ws) {
                    const peaks = ws.exportPeaks();

                    if (peaks && (peaks.length > 0 || (peaks[0] && peaks[0].length > 0))) {
                        try {
                            const { uploadUrl, publicUrl } = await generateS3UploadUrl({
                                contentType: "application/json",
                                fileType: "json",
                            });

                            const result = await fetch(uploadUrl, {
                                method: "PUT",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ data: peaks }),
                            });

                            if (result.ok) {
                                if (versionId) {
                                    await saveWaveformVersion({ versionId, waveformUrl: publicUrl });
                                } else if (episodeId) {
                                    await saveWaveform({ episodeId, waveformUrl: publicUrl });
                                }
                            }
                        } catch (err) {
                            console.error("Failed to save waveform:", err);
                        }
                    }
                }
            });
            ws.on('error', (e) => {
                console.error("[WaveSurfer] ERROR:", e);
                setIsWaveformReady(true); // Ensure we unblock even on error
            });

            waveSurferRef.current = ws;

        }, 500);

        return () => {
            isDestroyed = true;
            clearTimeout(initTimer);
            if (ws) ws.destroy();
            if (waveSurferRef.current) waveSurferRef.current.destroy();
        };
    }, [container, videoElement, videoUrl, waveformUrl, episodeId, versionId]);

    const onTimeUpdateNative = () => {
        if (!videoElement) return;
        if (onTimeUpdate) onTimeUpdate(videoElement.currentTime);
    };

    useEffect(() => {
        let rafId: number;
        const loop = () => {
            if (videoElement && !videoElement.paused && !videoElement.ended) {
                if (onTimeUpdate) onTimeUpdate(videoElement.currentTime);
                rafId = requestAnimationFrame(loop);
            }
        };
        if (isPlaying) {
            rafId = requestAnimationFrame(loop);
        }
        return () => {
            if (rafId) cancelAnimationFrame(rafId);
        };
    }, [isPlaying, videoElement, onTimeUpdate]);

    const handleTogglePlay = async () => {
        if (!videoElement) return;
        if (isPlaying) {
            videoElement.pause();
        } else {
            try {
                await videoElement.play();
            } catch (e: any) {
                if (e.name !== 'AbortError') {
                    console.error("[AVSyncPlayer] Playback Error:", e);
                }
            }
        }
    };

    const handleSeek = (time: number) => {
        if (videoElement) {
            videoElement.currentTime = time;
        }
    };

    const handleVolumeChange = (vol: number) => {
        if (videoElement) {
            videoElement.volume = vol;
        }
    };

    const handleSkip = (seconds: number) => {
        if (!videoElement) return;
        videoElement.currentTime = Math.min(Math.max(videoElement.currentTime + seconds, 0), videoElement.duration);
    };

    const handleFullscreen = () => {
        if (videoContainerRef.current) {
            if (!document.fullscreenElement) {
                videoContainerRef.current.requestFullscreen();
            } else {
                document.exitFullscreen();
            }
        }
    };

    if (!hasMounted) return <div className="w-full aspect-video bg-white/5 animate-pulse rounded-3xl" />;

    return (
        <div className="flex flex-col gap-6 w-full group/player">
            <div
                ref={videoContainerRef}
                className="relative w-full aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl border border-white/5 group relative"
            >
                <video
                    ref={setVideoElement}
                    src={videoUrl}
                    className="w-full h-full object-contain bg-black"
                    playsInline
                    crossOrigin="anonymous"
                    onTimeUpdate={onTimeUpdateNative}
                    onEnded={() => setIsPlaying(false)}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    onLoadedMetadata={(e) => {
                        const d = e.currentTarget.duration;
                        if (d && d > 0 && d !== Infinity) {
                            setDuration(d);
                        }
                    }}
                />

                <div className="absolute bottom-6 left-0 right-0 z-30 transition-opacity duration-300 opacity-0 group-hover/player:opacity-100">
                    <PlayerControls
                        isPlaying={isPlaying}
                        currentTime={videoElement?.currentTime || 0}
                        duration={duration}
                        volume={videoElement?.volume || 1}
                        title={title}
                        onTogglePlay={handleTogglePlay}
                        onSeek={handleSeek}
                        onVolumeChange={handleVolumeChange}
                        onSkipForward={() => handleSkip(10)}
                        onSkipBack={() => handleSkip(-10)}
                        onFullscreen={handleFullscreen}
                    />
                </div>
            </div>

            {/* Waveform */}
            <div className="glass-panel rounded-3xl p-8 border border-white/5 bg-[#1a0e26]/60 backdrop-blur-xl relative overflow-hidden">

                {/* [NEW] NEURAL SCANNING LOADING OVERLAY */}
                <div className={`absolute inset-0 z-50 bg-[#1a0e26] flex flex-col items-center justify-center transition-opacity duration-1000 ${isWaveformReady ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                    <div className="flex items-center gap-4">
                        <div className="size-3 rounded-full bg-[#3C8CE7] animate-ping" />
                        <span className="text-xs font-bold uppercase tracking-[0.3em] text-[#3C8CE7] animate-pulse shadow-blue-500/50">Scanning Audio Waveform...</span>
                    </div>
                </div>

                <div className="flex items-center gap-3 mb-6">
                    <div className={`size-2 rounded-full ${isPlaying ? 'bg-emerald-400 animate-pulse' : 'bg-white/20'}`} />
                    <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-white/40">Master Audio Track</h3>
                </div>

                <div ref={setContainer} className="w-full h-[120px] relative">
                    {hasMounted && duration > 0 && comments.map((comment) => {
                        const leftPercent = (comment.timestamp / duration) * 100;
                        if (leftPercent < 0 || leftPercent > 100) return null;

                        return (
                            <div
                                key={comment._id}
                                className="absolute top-0 bottom-0 pointer-events-none z-20"
                                style={{ left: `${leftPercent}%` }}
                            >
                                <div className="relative h-full -ml-[1px]">
                                    <div className="absolute inset-y-0 w-0.5 bg-[#ff3399] shadow-[0_0_15px_rgba(255,51,153,1)]"></div>
                                    <div className="absolute -top-1 -left-[3px] size-2 bg-[#ff3399] rounded-full"></div>
                                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 flex flex-col items-center">
                                        <div className="size-8 rounded-full border-2 border-[#ff3399] overflow-hidden shadow-lg shadow-[#ff3399]/30 relative z-10 bg-black">
                                            <img
                                                alt={comment.user.name}
                                                src={comment.user.avatar}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[6px] border-t-[#ff3399] -mt-1"></div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
});

AVSyncPlayer.displayName = "AVSyncPlayer";
export default AVSyncPlayer;
