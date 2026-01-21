import { useState } from 'react';
import Link from 'next/link';
import { ProcessingVisualizer } from './ProcessingVisualizer';

interface EpisodeProps {
    _id?: string;
    id?: string;
    title: string;
    guest?: string;
    date: string;
    status: 'processing' | 'action_required' | 'completed';
    processingStage?: string;
    videoUrl?: string;
    progress?: number;
    imageUrl: string;
    duration?: string;
    issues?: string;
    views?: string;
    description?: string;
    episodeNumber?: number;
}

interface EpisodeCardProps {
    episode: EpisodeProps;
    variant?: 'dashboard' | 'library';
}

export function EpisodeCard({ episode, variant = 'dashboard' }: EpisodeCardProps) {
    const { status, title, guest, date, progress, imageUrl, duration, issues, views, processingStage, episodeNumber, description } = episode;
    const episodeId = episode._id || episode.id;

    const isLibrary = variant === 'library';

    // [NEW] Duration State
    const [videoDuration, setVideoDuration] = useState<string | undefined>(duration !== "00:00" ? duration : undefined);

    const handleLoadedMetadata = (e: React.SyntheticEvent<HTMLVideoElement>) => {
        const seconds = e.currentTarget.duration;
        if (!isNaN(seconds) && seconds > 0) {
            const h = Math.floor(seconds / 3600);
            const m = Math.floor((seconds % 3600) / 60);
            const s = Math.floor(seconds % 60);
            const formatted = h > 0
                ? `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
                : `${m}:${s.toString().padStart(2, '0')}`;
            setVideoDuration(formatted);
        }
    };

    // Date Formatter
    const formatFriendlyDate = (dateStr: string) => {
        try {
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return dateStr;
            const datePart = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            const timePart = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
            return `${datePart} - ${timePart} GMT`;
        } catch (e) {
            return dateStr;
        }
    };

    const CardContent = (
        <div className={`glass p-6 rounded-3xl group cursor-pointer transition-all duration-500 relative
            ${status === 'processing' ? 'border-purple-500/50 shadow-[0_0_20px_rgba(168,85,247,0.2)]' : '' /* Glow Base */}
            ${status === 'action_required' ? 'border-red-500/20 hover:border-red-500/40' :
                status === 'completed' ? 'hover:border-green-500/40' :
                    'hover:border-primary/40'
            } ${isLibrary ? 'rounded-xl p-0 border-none bg-transparent hover:bg-transparent shadow-none' : ''}`}>

            {/* Processing Pulse Overlay for Border */}
            {!isLibrary && status === 'processing' && (
                <div className="absolute inset-0 rounded-3xl border border-purple-500/50 animate-pulse pointer-events-none shadow-[0_0_15px_rgba(168,85,247,0.4)]"></div>
            )}

            <div className={`relative w-full aspect-video ${isLibrary ? 'rounded-xl shadow-2xl border border-white/10 mb-3' : 'rounded-2xl mb-6'} overflow-hidden bg-white/5`}>

                {/* CONDITIONAL RENDER: Processing Visualizer or Video or Static Image */}
                {status === 'processing' && !episode.videoUrl ? (
                    <ProcessingVisualizer stage={processingStage} />
                ) : episode.videoUrl ? (
                    <div className="relative w-full h-full group/video">
                        <video
                            src={episode.videoUrl}
                            className="w-full h-full object-cover brightness-75 group-hover:brightness-100 transition-all duration-700"
                            muted
                            loop
                            playsInline
                            onLoadedMetadata={handleLoadedMetadata}
                            onMouseOver={(e) => e.currentTarget.play()}
                            onMouseOut={(e) => e.currentTarget.pause()}
                        />
                        {/* Play Overlay */}
                        <div className={`absolute inset-0 flex items-center justify-center pointer-events-none group-hover/video:opacity-0 transition-opacity duration-300`}>
                            <div className={`${isLibrary ? '' : 'size-16 rounded-full glass'} flex items-center justify-center text-white/80`}>
                                <span className={`material-symbols-outlined ${isLibrary ? 'text-5xl text-white' : 'text-3xl'}`}>
                                    {isLibrary ? 'play_circle' : 'play_arrow'}
                                </span>
                            </div>
                        </div>
                    </div>
                ) : (
                    <>
                        <img
                            className="w-full h-full object-cover brightness-75 group-hover:scale-105 transition-transform duration-700"
                            src={imageUrl}
                            alt={title}
                        />

                        {/* Play Overlay */}
                        <div className={`absolute inset-0 flex items-center justify-center ${isLibrary ? 'bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300' : ''}`}>
                            <div className={`${isLibrary ? '' : 'size-16 rounded-full glass'} flex items-center justify-center text-white/80 ${isLibrary ? '' : 'group-hover:scale-110 transition-transform'}`}>
                                <span className={`material-symbols-outlined ${isLibrary ? 'text-5xl text-white' : 'text-3xl'}`}>
                                    {isLibrary ? 'play_circle' : 'play_arrow'}
                                </span>
                            </div>
                        </div>
                    </>
                )}

                {/* Badges */}
                <div className={`absolute ${isLibrary ? 'top-3 left-3' : 'top-4 left-4'}`}>
                    {isLibrary ? (
                        // Library Badges
                        <>
                            {status === 'processing' && (
                                <div className="flex items-center gap-2 px-2 py-1 rounded bg-black/60 backdrop-blur-md border border-white/10">
                                    <span className="size-2 rounded-full bg-purple-500 animate-pulse box-shadow-purple-500/70"></span>
                                    <span className="text-[10px] font-bold uppercase tracking-wider">Processing</span>
                                </div>
                            )}
                            {status === 'action_required' && (
                                <div className="flex items-center gap-2 px-2 py-1 rounded bg-primary/90 backdrop-blur-md border border-white/10">
                                    <span className="material-symbols-outlined text-xs">warning</span>
                                    <span className="text-[10px] font-bold uppercase tracking-wider">Action Required</span>
                                </div>
                            )}
                            {status === 'completed' && (
                                <div className="flex items-center gap-2 px-2 py-1 rounded bg-green-500/90 backdrop-blur-md border border-white/10">
                                    <span className="text-[10px] font-bold uppercase tracking-wider">Published</span>
                                </div>
                            )}
                        </>
                    ) : (
                        // Dashboard Badges
                        <>
                            {status === 'processing' && (
                                episode.videoUrl ? (
                                    <span className="flex items-center gap-2 bg-primary/80 backdrop-blur-md px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">
                                        <span className="material-symbols-outlined text-[12px]">rate_review</span>
                                        Pending Review
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-2 bg-purple-500/80 backdrop-blur-md px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest animate-pulse">
                                        <span className="size-1.5 rounded-full bg-white"></span>
                                        Processing
                                    </span>
                                )
                            )}
                            {status === 'action_required' && (
                                <span className="flex items-center gap-2 bg-red-500/80 backdrop-blur-md px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">
                                    <span className="size-1.5 rounded-full bg-white"></span>
                                    Action Required
                                </span>
                            )}
                            {status === 'completed' && (
                                <span className="flex items-center gap-2 bg-[#0bda87]/80 backdrop-blur-md px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">
                                    <span className="material-symbols-outlined text-[12px]">check_circle</span>
                                    Completed
                                </span>
                            )}
                        </>
                    )}
                </div>

                {/* Library Duration Badge */}
                {isLibrary && videoDuration && (
                    <div className="absolute bottom-3 right-3 px-2 py-1 rounded bg-black/80 text-white text-[10px] font-bold">
                        {videoDuration}
                    </div>
                )}
            </div>

            <div className="space-y-4">
                <div>
                    <h4 className={`font-bold transition-colors ${status === 'action_required' ? 'group-hover:text-red-400' :
                        status === 'completed' ? 'group-hover:text-[#0bda87] library:group-hover:text-primary' :
                            'group-hover:text-primary'
                        } ${isLibrary ? 'text-white line-clamp-2 leading-tight' : 'text-xl line-clamp-1'}`}>
                        {episodeNumber !== undefined && <span className="text-white/50 mr-2">#{episodeNumber}</span>}
                        {title}
                    </h4>

                    {!isLibrary && (
                        <>
                            <p className="text-white/40 text-sm">
                                {formatFriendlyDate(date)}
                            </p>
                            {description && (
                                <p className="text-white/60 text-xs line-clamp-2 mt-2 font-medium">
                                    {description}
                                </p>
                            )}
                        </>
                    )}

                    {isLibrary && (
                        <div className="flex items-center justify-between mt-2">
                            <p className="text-white/40 text-xs font-medium">{status === 'processing' ? 'Uploading...' : formatFriendlyDate(date)}</p>
                            <p className="text-white/40 text-xs font-medium">{views || '0'} views</p>
                        </div>
                    )}
                </div>

                {!isLibrary && (
                    <>
                        {status === 'processing' && !episode.videoUrl && (
                            <div className="space-y-2">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-white/60">System Processing...</span>
                                    <span className="text-primary font-bold">{progress}%</span>
                                </div>
                                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                    <div className="h-full bg-primary rounded-full relative" style={{ width: `${progress}%` }}>
                                        <div className="absolute right-0 top-0 h-full w-2 bg-mello-blue progress-glow"></div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {status === 'action_required' && issues && (
                            <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-2xl">
                                <p className="text-xs text-red-200 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-sm">warning</span>
                                    {issues}
                                </p>
                            </div>
                        )}

                        {status === 'completed' && (
                            <div className="space-y-2">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-white/60">Ready to Publish</span>
                                    <span className="text-[#0bda87] font-bold">100%</span>
                                </div>
                                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                    <div className="h-full bg-[#0bda87] rounded-full" style={{ width: '100%' }}></div>
                                </div>
                                <div className="flex items-center gap-3 pt-2">
                                    <button className="flex-1 bg-white/5 hover:bg-white/10 text-xs font-bold py-2 rounded-xl transition-colors cursor-pointer">Download</button>
                                    <button className="flex-1 bg-white/5 hover:bg-white/10 text-xs font-bold py-2 rounded-xl transition-colors cursor-pointer">Publish</button>
                                </div>
                            </div>
                        )}

                        {(status === 'processing' || status === 'action_required') && (
                            <div className="flex items-center gap-4 text-xs text-white/50 pt-2">
                                {(videoDuration || duration) && <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">schedule</span> {videoDuration || duration || "00:00"}</span>}
                                {(status === 'action_required' || (status === 'processing' && episode.videoUrl)) && (
                                    <span className="flex items-center gap-1">
                                        <span className="material-symbols-outlined text-sm">history</span>
                                        Pending Review
                                    </span>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );

    if (episodeId) {
        return (
            <Link href={`/episodes/${episodeId}`}>
                {CardContent}
            </Link>
        );
    }

    return CardContent;
}
