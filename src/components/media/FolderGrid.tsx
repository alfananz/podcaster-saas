import Link from 'next/link';
import React from 'react';

interface Episode {
    _id: string;
    title: string;
    date: string;
    // files_count to be handled or mocked
}

interface FolderGridProps {
    episodes: Episode[];
}

export function FolderGrid({ episodes }: FolderGridProps) {
    // If no episodes, show mockup or empty
    const displayEpisodes = episodes?.length ? episodes : [
        { _id: '1', title: 'Future of AI Creative Tools', date: '2h ago', count: 24 },
        { _id: '2', title: 'Decentralized Content Hubs', date: '1d ago', count: 18 },
        { _id: '3', title: 'Mastering the Aurora Studio', date: '4d ago', count: 56 },
        { _id: '4', title: 'Web3 Podcasting 101', date: '1w ago', count: 12 },
        { _id: '5', title: 'Special Guest Interview', date: '2w ago', count: 8 },
    ];

    return (
        <section>
            <h3 className="text-sm font-bold tracking-wide mb-4 px-2">Episode Folders</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {displayEpisodes.map((ep: any, i: number) => (
                    <Link href={`/media/folder/${ep._id}`} key={ep._id}>
                        <div className="group bg-media-surface/50 p-4 rounded-xl border border-white/5 hover:border-media-primary transition-all cursor-pointer">
                            <div className="flex justify-between items-start mb-4">
                                <span
                                    className={`material-symbols-outlined text-3xl ${i === 0 ? 'text-media-primary' : 'text-slate-400'}`}
                                    style={{ fontVariationSettings: "'FILL' 1" }}
                                >
                                    folder
                                </span>
                                <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase ${i === 0 ? 'bg-media-primary/20 text-media-primary' : 'bg-white/10 text-slate-400'}`}>
                                    {ep.count || (2 + i * 3)} Assets
                                </span>
                            </div>
                            <p className="text-[11px] font-bold leading-tight group-hover:text-media-primary transition-colors line-clamp-2 min-h-[2.5em]">
                                {ep.title}
                            </p>
                            <p className="text-[9px] text-slate-500 mt-1 uppercase tracking-tighter">Modified {new Date(ep.date).toLocaleDateString()}</p>
                        </div>
                    </Link>
                ))}
            </div>
        </section>
    );
}
