import React from 'react';

interface Asset {
    _id: string;
    name: string;
    type: string;
    size: number;
    uploadedAt: number;
    metadata?: {
        resolution?: string;
        format?: string;
    };
}

interface RecentAssetsTableProps {
    assets: Asset[];
}

export function RecentAssetsTable({ assets }: RecentAssetsTableProps) {
    const formatSize = (bytes: number) => {
        if (bytes >= 1024 * 1024 * 1024) return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    const getIcon = (type: string) => {
        if (type === 'video') return 'play_circle';
        if (type === 'audio') return 'mic';
        return 'image';
    };

    const getColor = (type: string) => {
        if (type === 'video') return 'text-media-primary bg-media-primary/10';
        if (type === 'audio') return 'text-media-magenta bg-media-magenta/10';
        return 'text-media-yellow bg-media-yellow/10';
    };

    const displayAssets = assets?.length ? assets : [
        // Mock data if empty for visualization
        { _id: 'm1', name: 'Intro_Sequence_Final.mp4', type: 'video', size: 1200000000, uploadedAt: Date.now(), metadata: { resolution: '4K · 60fps', format: 'H.264' } },
        { _id: 'm2', name: 'Interview_Raw_Cleaned.wav', type: 'audio', size: 245000000, uploadedAt: Date.now(), metadata: { resolution: '24-bit', format: '48kHz' } },
        { _id: 'm3', name: 'Thumbnail_Main_V2.png', type: 'image', size: 12400000, uploadedAt: Date.now(), metadata: { resolution: '3840 x 2160', format: 'PNG' } },
    ];

    return (
        <section>
            <h3 className="text-sm font-bold tracking-wide mb-4 px-2">Recent Assets</h3>
            <div className="bg-media-surface rounded-xl overflow-hidden border border-white/5">
                <table className="w-full text-left text-xs">
                    <thead className="bg-white/5 text-slate-400 uppercase tracking-widest text-[9px]">
                        <tr>
                            <th className="px-6 py-4 font-bold">Preview</th>
                            <th className="px-6 py-4 font-bold">File Name</th>
                            <th className="px-6 py-4 font-bold">Type</th>
                            <th className="px-6 py-4 font-bold">Size</th>
                            <th className="px-6 py-4 font-bold hidden md:table-cell">Activity / Analytics</th>
                            <th className="px-6 py-4 font-bold text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {displayAssets.map((asset) => (
                            <tr key={asset._id} className="hover:bg-white/5 transition-colors group">
                                <td className="px-6 py-3">
                                    <div className={`size-10 rounded bg-media-bg-dark flex items-center justify-center overflow-hidden border border-white/10 relative group-hover:border-opacity-50 transition-colors`}>
                                        {asset.type === 'image' || asset.type === 'video' ? (
                                            <div className="w-full h-full bg-cover bg-center opacity-70" style={{ backgroundImage: 'url(https://placehold.co/100x100/1a1a1a/ffffff?text=IMG)' }}></div>
                                        ) : (
                                            <span className={`material-symbols-outlined ${asset.type === 'audio' ? 'text-media-magenta' : 'text-slate-400'}`}>{getIcon(asset.type)}</span>
                                        )}
                                        {asset.type === 'video' && <span className="material-symbols-outlined text-xs absolute text-white opacity-0 group-hover:opacity-100 transition-opacity">play_circle</span>}
                                    </div>
                                </td>
                                <td className="px-6 py-3">
                                    <p className="font-bold text-slate-100">{asset.name}</p>
                                    <p className="text-[10px] text-slate-500">{asset.metadata?.resolution || 'Unknown'} · {asset.metadata?.format || ''}</p>
                                </td>
                                <td className="px-6 py-3">
                                    <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold uppercase ${getColor(asset.type)}`}>
                                        {asset.type}
                                    </span>
                                </td>
                                <td className="px-6 py-3 text-slate-400 font-mono">{formatSize(asset.size)}</td>
                                <td className="px-6 py-3 hidden md:table-cell">
                                    {asset.type === 'video' ? (
                                        <div className="w-24 h-4 flex items-end gap-0.5">
                                            <div className="w-1 bg-media-primary/40 h-1"></div>
                                            <div className="w-1 bg-media-primary/40 h-2"></div>
                                            <div className="w-1 bg-media-primary h-4"></div>
                                            <div className="w-1 bg-media-primary h-3"></div>
                                        </div>
                                    ) : <span className="text-[10px] text-slate-500 italic">No interaction data</span>}
                                </td>
                                <td className="px-6 py-3 text-right">
                                    <button className="material-symbols-outlined text-slate-500 hover:text-white">more_vert</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </section>
    );
}
