"use client";

import { useState, useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from "react";
import WaveSurfer from "wavesurfer.js";
import { PlayerControls } from "./PlayerControls";
import { useMutation } from "convex/react";
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

    // Callback Refs to force re-render when elements are ready
    const [container, setContainer] = useState<HTMLDivElement | null>(null);
    const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null);
    const videoContainerRef = useRef<HTMLDivElement>(null); // [NEW] Video Wrapper

    const waveSurferRef = useRef<WaveSurfer | null>(null);

    // Convex Mutations
    const generateUploadUrl = useMutation(api.files.generateUploadUrl);
    const saveWaveform = useMutation(api.episodes.saveWaveform);
    const saveWaveformVersion = useMutation(api.versions.saveWaveform);

    // Client-side guard & Immediate Ready
    useEffect(() => {
        setHasMounted(true);
        // [OPTIMIZATION] - PREMIUM FEEL
        // Don't wait for video metadata or waveform to dismiss the global spinner.
        // Let the user into the UI immediately. The video player has its own buffering states if needed.
        if (onReady) setTimeout(onReady, 0);
    }, []);

    // Expose methods to parent
    useImperativeHandle(ref, () => ({
        seekTo: (time: number) => {
            if (videoElement) {
                videoElement.currentTime = time;
                // Optionally play if paused? For now just seek.
            }
        }
    }));

    // --- MANUAL WAVESURFER INITIALIZATION ---
    useEffect(() => {
        // 1. Wait for both Container AND Video Element
        if (!container || !videoElement || !videoUrl) return;

        let ws: WaveSurfer | null = null;
        let isDestroyed = false;

        // [OPTIMIZATION] Lazy Load Waveform
        // Delay waveform generation slightly to prioritize UI rendering and Video playback startup.
        const initTimer = setTimeout(async () => {
            if (isDestroyed) return;

            // 2. Destroy Prev Instance
            if (waveSurferRef.current) {
                waveSurferRef.current.destroy();
                waveSurferRef.current = null;
            }

            console.log("[AVSyncPlayer] Initializing WaveSurfer...");

            // 1. Fetch Peaks if URL exists
            let preComputedPeaks = undefined;
            if (waveformUrl) {
                try {
                    console.log("[AVSyncPlayer] Fetching pre-computed peaks from:", waveformUrl);
                    const response = await fetch(waveformUrl);
                    if (response.ok) {
                        const json = await response.json();
                        // WaveSurfer expects array of arrays (channels) or single array
                        preComputedPeaks = json.data || json;
                        console.log("[AVSyncPlayer] Loaded peaks successfully.");
                    }
                } catch (err) {
                    console.error("[AVSyncPlayer] Failed to load peaks:", err);
                }
            }

            // 2. Create New Instance linked to Video Element
            console.log("[AVSyncPlayer] Creating WaveSurfer instance linked to video element...");
            // Define fetch params to handle potential CORS/Auth issues with storage URLs
            ws = WaveSurfer.create({
                container: container,
                media: videoElement, // This is the MAGIC key. It binds WS to the video tag.
                url: videoUrl, // Pass URL directly here
                peaks: preComputedPeaks, // [OPTIMIZATION] INSTANT RENDER
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

            // 4. Attach Events
            ws.on('ready', async (d) => {
                const vidDuration = videoElement?.duration;
                if (vidDuration && vidDuration > 0 && vidDuration !== Infinity) {
                    console.log("[WaveSurfer] Ready. Using Native Video Duration:", vidDuration);
                    setDuration(vidDuration);
                } else {
                    console.log("[WaveSurfer] Ready. Using WS Duration:", d);
                    setDuration(d);
                }

                // [NEW] Persistent Waveform Logic
                // If we didn't load from a URL, we just generated them. Save them!
                if (!waveformUrl && ws) {
                    console.log("[WaveSurfer] Generated peaks locally. Saving to cloud...");
                    const peaks = ws.exportPeaks(); // Default settings (channels etc)

                    if (peaks && (peaks.length > 0 || (peaks[0] && peaks[0].length > 0))) {
                        // Async Upload
                        try {
                            const postUrl = await generateUploadUrl();
                            const result = await fetch(postUrl, {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify(peaks),
                            });

                            if (result.ok) {
                                const { storageId } = await result.json();
                                if (versionId) {
                                    await saveWaveformVersion({ versionId, storageId });
                                    console.log("Saved waveform to Version:", versionId);
                                } else if (episodeId) {
                                    await saveWaveform({ episodeId, storageId });
                                    console.log("Saved waveform to Episode:", episodeId);
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
            });

            // 5. Save Ref
            waveSurferRef.current = ws;

        }, 500); // 500ms delay to let the page breathe

        // Cleanup
        return () => {
            isDestroyed = true;
            clearTimeout(initTimer);
            if (ws) ws.destroy();
            if (waveSurferRef.current) waveSurferRef.current.destroy();
        };
    }, [container, videoElement, videoUrl, waveformUrl, episodeId, versionId]);

    // Sync Logic: Video -> Waveform (Native Event Helper)
    const onTimeUpdateNative = () => {
        if (!videoElement) return;
        if (onTimeUpdate) onTimeUpdate(videoElement.currentTime);
        // No manual sync needed! 'media' option handles it.
    };

    // --- HIGH FREQUENCY UPDATE LOOP (RAF) ---
    // Solves "Skipping Words" in Transcript by updating React state at 60fps instead of 4fps (native timeupdate)
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


    // --- CONTROLS HANDLERS ---
    const handleTogglePlay = () => {
        if (!videoElement) return;
        if (isPlaying) {
            videoElement.pause();
        } else {
            videoElement.play();
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
                {/* RAW HTML5 VIDEO */}
                <video
                    ref={setVideoElement} // Callback Ref
                    src={videoUrl}
                    className="w-full h-full object-contain bg-black"
                    // controls // REMOVED NATIVE CONTROLS
                    playsInline
                    crossOrigin="anonymous"
                    onTimeUpdate={onTimeUpdateNative}
                    onEnded={() => setIsPlaying(false)}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    onLoadedMetadata={(e) => {
                        const d = e.currentTarget.duration;
                        console.log("[AVSyncPlayer] Native Video Metadata Loaded. Duration:", d);
                        if (d && d > 0 && d !== Infinity) {
                            setDuration(d);
                        }
                        // OPTIMIZATION: Unblock the UI immediately when video metadata is known.
                        // Don't wait for the heavy waveform to decode.
                        // if (onReady) onReady(); // Removed as per instructions, onReady is called on mount
                    }}
                />

                {/* Custom Controls Overlay - Positioned at bottom */}
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
            <div className="glass-panel rounded-3xl p-8 border border-white/5 bg-[#1a0e26]/60 backdrop-blur-xl relative">
                <div className="flex items-center gap-3 mb-6">
                    <div className={`size-2 rounded-full ${isPlaying ? 'bg-emerald-400 animate-pulse' : 'bg-white/20'}`} />
                    <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-white/40">Master Audio Track</h3>
                </div>

                {/* Container Ref (State based) */}
                <div ref={setContainer} className="w-full h-[120px] relative">
                    {/* Markers Overlay */}
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
                                    {/* Vertical Line */}
                                    <div className="absolute inset-y-0 w-0.5 bg-[#ff3399] shadow-[0_0_15px_rgba(255,51,153,1)]"></div>

                                    {/* Top Dot */}
                                    <div className="absolute -top-1 -left-[3px] size-2 bg-[#ff3399] rounded-full"></div>

                                    {/* Avatar Tooltip */}
                                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 flex flex-col items-center">
                                        <div className="size-8 rounded-full border-2 border-[#ff3399] overflow-hidden shadow-lg shadow-[#ff3399]/30 relative z-10 bg-black">
                                            <img
                                                alt={comment.user.name}
                                                src={comment.user.avatar}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        {/* Triangle */}
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
