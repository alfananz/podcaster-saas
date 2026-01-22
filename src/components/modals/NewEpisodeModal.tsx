import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { DropzoneArea } from './DropzoneArea';
import { AuroraProgressBar } from '@/components/ui/AuroraProgressBar';
import { useFileUpload } from '@/hooks/useFileUpload';
import { useMutation, useAction } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import WaveSurfer from 'wavesurfer.js';

interface NewEpisodeModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type ModalView = 'form' | 'progress';

export function NewEpisodeModal({ isOpen, onClose }: NewEpisodeModalProps) {
    const router = useRouter();
    const [view, setView] = useState<ModalView>('form');
    const [title, setTitle] = useState('');
    const [episodeNumber, setEpisodeNumber] = useState(24);
    const [language, setLanguage] = useState<'en' | 'ar'>('en');
    const [description, setDescription] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const { uploadFile, isUploading, progress } = useFileUpload();
    const createEpisode = useMutation(api.episodes.create);
    const generateS3UploadUrl = useAction(api.actions.files.generateS3UploadUrl);

    const handleSubmit = async () => {
        if (!title || !selectedFile) return;

        setView('progress');

        try {
            // 1. Parallel Execution setup
            const videoUploadPromise = uploadFile(selectedFile);

            // 2. Waveform Generation & Upload (Fire & Forget style relative to UI, but await relative to creation)
            const waveformPromise = (async () => {
                console.log("[Client] Generating waveform peaks...");
                const peaks = await new Promise<any[]>((resolve, reject) => {
                    const ws = WaveSurfer.create({
                        container: document.createElement('div'),
                        waveColor: 'white',
                    });
                    const url = URL.createObjectURL(selectedFile);
                    ws.load(url);
                    ws.on('ready', () => {
                        const start = Date.now();
                        const p = ws.exportPeaks(); // Default precision
                        console.log(`[Client] Peaks generated in ${Date.now() - start}ms`);
                        ws.destroy();
                        URL.revokeObjectURL(url);
                        resolve(p);
                    });
                    ws.on('error', (e) => reject(e));
                });

                const blob = new Blob([JSON.stringify({ data: peaks })], { type: 'application/json' });

                // [NEW] S3 Upload for Waveform
                const { uploadUrl, publicUrl } = await generateS3UploadUrl({
                    contentType: "application/json",
                    fileType: "json"
                });

                await fetch(uploadUrl, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: blob,
                });

                console.log("[Client] Waveform uploaded to S3:", publicUrl);
                return publicUrl;
            })();

            // 3. Wait for BOTH
            // Note: We use Promise.allSettled or just all. If waveform fails, we might still want to proceed? 
            // The user requested "ensure everything processes". So let's stick to Promise.all
            // But to be safe, we catch waveform errors specifically.

            let videoUrl;
            let waveformUrl;

            try {
                const results = await Promise.all([videoUploadPromise, waveformPromise]);
                videoUrl = results[0];
                waveformUrl = results[1];
            } catch (err) {
                console.warn("Waveform generation failed, proceeding with just video:", err);
                videoUrl = await videoUploadPromise; // Ensure video at least finishes
                // waveformId remains undefined
            }

            // 4. Create Episode Record
            const newEpisodeId = await createEpisode({
                title,
                episodeNumber,
                description,
                videoUrl: videoUrl, // [NEW] S3 URL
                language,
                waveformUrl: waveformUrl, // [NEW] S3 URL
            });

            // 5. Complete & Close
            setTimeout(() => {
                handleClose();
                router.push(`/episodes/${newEpisodeId}`);
            }, 1000);

        } catch (error) {
            console.error("Upload failed:", error);
            setView('form');
        }
    };

    const handleClose = () => {
        if (isUploading) return;
        if (isUploading) return;
        setTitle('');
        setEpisodeNumber(24);
        setLanguage('en');
        setSelectedFile(null);
        setView('form');
        onClose();
    };

    const isComplete = progress === 100;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleClose}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 cursor-pointer"
                    >
                        <AnimatePresence mode="wait">
                            {view === 'form' ? (
                                /* FORM VIEW */
                                <motion.div
                                    key="form"
                                    initial={{ scale: 0.95, opacity: 0, y: 20 }}
                                    animate={{ scale: 1, opacity: 1, y: 0 }}
                                    exit={{ scale: 0.95, opacity: 0, y: -20, transition: { duration: 0.2 } }}
                                    onClick={(e) => e.stopPropagation()}
                                    className="bg-[#130c20] w-full max-w-2xl rounded-3xl border border-white/10 shadow-2xl shadow-primary/10 overflow-hidden flex flex-col max-h-[90vh] cursor-default"
                                >
                                    {/* Header */}
                                    <div className="p-8 pb-4 flex items-center justify-between border-b border-white/5">
                                        <div>
                                            <h2 className="text-2xl font-bold tracking-tight font-display">New Episode</h2>
                                            <p className="text-white/40 text-sm mt-1">Upload your raw footage to begin processing</p>
                                        </div>
                                        <button
                                            onClick={handleClose}
                                            className="p-2 rounded-xl hover:bg-white/5 text-white/40 hover:text-white transition-colors"
                                        >
                                            <span className="material-symbols-outlined">close</span>
                                        </button>
                                    </div>

                                    {/* Scrollable Content */}
                                    <div className="p-8 space-y-8 overflow-y-auto custom-scrollbar">
                                        {/* Upload Area */}
                                        <section>
                                            <label className="text-xs font-bold uppercase tracking-widest text-white/40 mb-3 block">Source File</label>
                                            <DropzoneArea
                                                onFileSelect={setSelectedFile}
                                                selectedFile={selectedFile}
                                            />
                                        </section>

                                        {/* Meta Data Form */}
                                        <section className="grid grid-cols-4 gap-6">
                                            <div className="col-span-2 space-y-3">
                                                <label className="text-xs font-bold uppercase tracking-widest text-white/40 block">Episode Title</label>
                                                <input
                                                    type="text"
                                                    value={title}
                                                    onChange={(e) => setTitle(e.target.value)}
                                                    placeholder="e.g. The Future of AI Production"
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all font-medium"
                                                />
                                            </div>
                                            <div className="col-span-1 space-y-3">
                                                <label className="text-xs font-bold uppercase tracking-widest text-white/40 block">Language</label>
                                                <div className="relative">
                                                    <select
                                                        value={language}
                                                        onChange={(e) => setLanguage(e.target.value as 'en' | 'ar')}
                                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all font-medium appearance-none cursor-pointer"
                                                    >
                                                        <option value="en">English</option>
                                                        <option value="ar">Arabic</option>
                                                    </select>
                                                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none text-[18px]">expand_more</span>
                                                </div>
                                            </div>
                                            <div className="col-span-1 space-y-3">
                                                <label className="text-xs font-bold uppercase tracking-widest text-white/40 block">Episode #</label>
                                                <div className="relative">
                                                    <input
                                                        type="number"
                                                        value={episodeNumber}
                                                        onChange={(e) => setEpisodeNumber(parseInt(e.target.value))}
                                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white pl-10 focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all font-bold"
                                                    />
                                                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-primary text-[18px]">auto_awesome</span>
                                                </div>
                                            </div>
                                        </section>

                                        <section className="space-y-3">
                                            <label className="text-xs font-bold uppercase tracking-widest text-white/40 block">Production Notes</label>
                                            <textarea
                                                value={description}
                                                onChange={(e) => setDescription(e.target.value)}
                                                rows={3}
                                                placeholder="Add any specific instructions for the editors..."
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all resize-none text-sm"
                                            />
                                        </section>
                                    </div>

                                    {/* Footer */}
                                    <div className="p-6 bg-black/20 border-t border-white/5 flex items-center justify-end gap-4 mt-auto">
                                        <button
                                            onClick={handleClose}
                                            className="px-6 py-3 rounded-xl text-sm font-bold text-white/40 hover:text-white transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleSubmit}
                                            disabled={!selectedFile || !title}
                                            className={`
                                                px-8 py-3 rounded-xl bg-gradient-to-r from-[#cd3796] to-[#3C8CE7] text-white text-sm font-bold shadow-lg shadow-primary/25
                                                hover:opacity-90 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2
                                                disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed disabled:shadow-none
                                            `}
                                        >
                                            <span className="material-symbols-outlined text-[18px]">rocket_launch</span>
                                            Upload & Processing
                                        </button>
                                    </div>
                                </motion.div>
                            ) : (
                                /* PROGRESS VIEW */
                                <motion.div
                                    key="progress"
                                    initial={{ scale: 0.95, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0.95, opacity: 0 }}
                                    onClick={(e) => e.stopPropagation()}
                                    className="w-full max-w-xl cursor-default"
                                >
                                    <AuroraProgressBar
                                        fileName={selectedFile?.name || 'Unknown File'}
                                        progress={progress}
                                        status={isComplete ? 'success' : 'uploading'}
                                    />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
