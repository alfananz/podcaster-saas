import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DropzoneArea } from './DropzoneArea';
import { AuroraProgressBar } from '@/components/ui/AuroraProgressBar';
import { useFileUpload } from '@/hooks/useFileUpload';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';

interface NewEpisodeModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type ModalView = 'form' | 'progress';

export function NewEpisodeModal({ isOpen, onClose }: NewEpisodeModalProps) {
    const [view, setView] = useState<ModalView>('form');
    const [title, setTitle] = useState('');
    const [episodeNumber, setEpisodeNumber] = useState(24);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const { uploadFile, isUploading, progress } = useFileUpload();
    const createEpisode = useMutation(api.episodes.create);

    const handleSubmit = async () => {
        if (!title || !selectedFile) return;

        setView('progress');

        try {
            // 1. Upload File
            const storageId = await uploadFile(selectedFile);

            // 2. Create Episode Record (Triggers background processing)
            await createEpisode({
                title,
                episodeNumber,
                storageId: storageId as any,
            });

            // 4. Complete & Close (small delay to show success state)
            setTimeout(() => {
                handleClose();
            }, 1000);

        } catch (error) {
            console.error("Upload failed:", error);
            // Revert view on error (improvement: show error state)
            setView('form');
        }
    };

    const handleClose = () => {
        if (isUploading) return;
        setTitle('');
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
                                        <section className="grid grid-cols-3 gap-6">
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
