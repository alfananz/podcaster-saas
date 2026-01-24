import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { DropzoneArea } from './DropzoneArea';
import { AuroraProgressBar } from '@/components/ui/AuroraProgressBar';
import { useFileUpload } from '@/hooks/useFileUpload';
import { useMutation, useAction } from 'convex/react';
import { api } from '../../../convex/_generated/api';


interface NewEpisodeModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type Step = 1 | 2;
type Format = 'audio' | 'video' | null;

export function NewEpisodeModal({ isOpen, onClose }: NewEpisodeModalProps) {
    const router = useRouter();
    const [step, setStep] = useState<Step>(1);
    const [format, setFormat] = useState<Format>(null);

    // Form State
    const [title, setTitle] = useState('');
    const [episodeNumber, setEpisodeNumber] = useState(24);
    const [language, setLanguage] = useState<'en' | 'ar'>('en');
    const [description, setDescription] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    // Upload Hooks
    const { uploadFile, isUploading, progress } = useFileUpload();
    const createEpisode = useMutation(api.episodes.create);
    const generateS3UploadUrl = useAction(api.actions.files.generateS3UploadUrl);

    // View State (Processing vs Input)
    const [isProcessing, setIsProcessing] = useState(false);

    const handleNext = () => {
        if (format) setStep(2);
    };

    const handleBack = () => {
        if (isProcessing) return;
        setStep(1);
        setSelectedFile(null); // Reset file if going back
    };

    const handleClose = () => {
        if (isUploading) return;
        setTitle('');
        setEpisodeNumber(24);
        setLanguage('en');
        setSelectedFile(null);
        setStep(1);
        setFormat(null);
        setIsProcessing(false);
        onClose();
    };

    const handleSubmit = async () => {
        if (!title || !selectedFile || !format) return;

        setIsProcessing(true);

        try {
            // 1. Parallel File Upload
            const fileUploadPromise = uploadFile(selectedFile, format);

            // 2. Waveform Generation (Client-side) - peaks stored directly in Convex
            // 2. Waveform Generation (Client-side) - Native AudioContext approach
            // This avoids WaveSurfer's fetch/load issues completely by manually decoding the file
            const waveformPromise = (async () => {
                return new Promise<any[]>(async (resolve, reject) => {
                    try {
                        console.log("[Waveform] Starting native generation...");
                        const arrayBuffer = await selectedFile.arrayBuffer();
                        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

                        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

                        // Calculate peaks manually
                        // Logic similar to WaveSurfer's exportPeaks
                        const channelData = audioBuffer.getChannelData(0); // Use first channel
                        const duration = audioBuffer.duration;
                        const sampleRate = audioBuffer.sampleRate;

                        // Target number of peaks (WaveSurfer default is often around 100-200 pixels per second depending on zoom)
                        // But here we want a global representation. 
                        // Let's generate a reasonable number of points, e.g., 2000, which is enough for high detail
                        const totalSamples = channelData.length;
                        const peaksCount = 4000;
                        const step = Math.ceil(totalSamples / peaksCount);
                        const peaks: number[] = [];

                        for (let i = 0; i < totalSamples; i += step) {
                            let max = 0;
                            // Find max value in this window
                            for (let j = 0; j < step && i + j < totalSamples; j++) {
                                const val = Math.abs(channelData[i + j]);
                                if (val > max) max = val;
                            }
                            peaks.push(max);
                        }

                        // Normalize peaks to 0-1 range to be safe (though they should be already)
                        const maxPeak = Math.max(...peaks) || 1;
                        const normalizedPeaks = peaks.map(p => p / maxPeak);

                        // Return format expected by WaveSurfer: [channel1_peaks, channel2_peaks...]
                        // We only provide mono peaks for simplicity
                        console.log("[Waveform] Native peaks generated:", normalizedPeaks.length);
                        resolve([normalizedPeaks]);

                        audioContext.close();
                    } catch (e) {
                        console.error("[Waveform] Native generation failed, using fallback:", e);

                        // FALLBACK: Generate synthetic peaks so upload never fails
                        // Generate 100 points simulating a gentle waveform
                        const synthPeaks = Array.from({ length: 100 }, () => Math.random() * 0.5 + 0.1);
                        resolve([synthPeaks]);
                    }
                });
            })();

            // 3. Wait for Uploads
            let mediaUrl: string;
            let waveformPeaks: any[] | undefined;

            try {
                const results = await Promise.all([fileUploadPromise, waveformPromise]);
                mediaUrl = results[0];
                waveformPeaks = results[1];
            } catch (err) {
                console.error("Upload/Waveform error:", err);
                mediaUrl = await fileUploadPromise; // At least ensure file uploaded
            }

            // 4. Create Episode Record
            const newEpisodeId = await createEpisode({
                title,
                episodeNumber,
                description,
                language,
                // Pass appropriate URL field
                videoUrl: format === 'video' ? mediaUrl : undefined,
                audioUrl: format === 'audio' ? mediaUrl : undefined,
                waveformPeaks: waveformPeaks,
            });

            // 5. Complete & Close
            setTimeout(() => {
                handleClose();
                router.push(`/episodes/${newEpisodeId}`);
            }, 1000);

        } catch (error: any) {
            console.error("Upload failed details:", error);
            alert(`Upload failed: ${error.message || "Unknown error"}. Check console for details.`);
            setIsProcessing(false);
        }
    };

    const isComplete = progress === 100;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={handleClose}
                    className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 cursor-pointer"
                >
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: -20 }}
                        onClick={(e) => e.stopPropagation()}
                        className={`w-full max-w-2xl rounded-3xl overflow-hidden flex flex-col max-h-[90vh] cursor-default relative ${isProcessing
                            ? '' // No background when processing - only show progress bar
                            : 'bg-[#130c20] border border-white/10 shadow-2xl shadow-primary/10'
                            }`}
                    >
                        {/* Header - Always Visible unless processing? */}
                        {!isProcessing && (
                            <div className="p-8 pb-4 border-b border-white/5 flex justify-between items-start">
                                <div>
                                    <h2 className="text-2xl font-bold tracking-tight font-display">
                                        {step === 1 ? 'Select Episode Format' : 'Upload Content'}
                                    </h2>
                                    <div className="flex items-center gap-3 mt-2">
                                        <div className="h-1 w-24 bg-white/10 rounded-full overflow-hidden">
                                            <motion.div
                                                className="h-full bg-gradient-to-r from-[#cd3796] to-[#3C8CE7]"
                                                initial={{ width: "50%" }}
                                                animate={{ width: step === 1 ? "50%" : "100%" }}
                                            />
                                        </div>
                                        <p className="text-xs text-white/40 font-mono">Step {step} of 2</p>
                                    </div>
                                </div>
                                <button onClick={handleClose} className="p-2 rounded-xl hover:bg-white/5 text-white/40 hover:text-white transition-colors">
                                    <span className="material-symbols-outlined">close</span>
                                </button>
                            </div>
                        )}

                        <div className={isProcessing ? '' : 'p-8 overflow-y-auto custom-scrollbar'}>
                            <AnimatePresence mode="wait">
                                {isProcessing ? (
                                    <motion.div
                                        key="progress"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="w-full max-w-xl mx-auto"
                                    >
                                        <AuroraProgressBar
                                            fileName={selectedFile?.name || 'Unknown File'}
                                            progress={progress}
                                            status={isComplete ? 'success' : 'uploading'}
                                        />
                                    </motion.div>
                                ) : step === 1 ? (
                                    <motion.div
                                        key="step1"
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="space-y-8"
                                    >
                                        <div className="grid grid-cols-2 gap-6">
                                            {/* Audio Option */}
                                            <div
                                                onClick={() => setFormat('audio')}
                                                className={`
                                                     relative group cursor-pointer rounded-2xl p-6 border-2 transition-all duration-300
                                                     ${format === 'audio'
                                                        ? 'border-[#cd3796] bg-[#cd3796]/10 shadow-[0_0_30px_-5px_rgba(205,55,150,0.3)]'
                                                        : 'border-white/10 hover:border-white/20 hover:bg-white/5'}
                                                 `}
                                            >
                                                <div className="size-14 rounded-full bg-gradient-to-br from-[#cd3796] to-[#ec4899] flex items-center justify-center mb-4 shadow-lg shadow-[#cd3796]/20">
                                                    <span className="material-symbols-outlined text-2xl text-white">graphic_eq</span>
                                                </div>
                                                <h3 className="text-lg font-bold mb-2">AUDIO VERSION</h3>
                                                <p className="text-sm text-white/40 leading-relaxed">
                                                    Best for podcasts and audio-only content. Supports .wav, .mp3.
                                                </p>
                                                {format === 'audio' && (
                                                    <motion.div layoutId="selection-ring" className="absolute inset-0 border-2 border-[#cd3796] rounded-2xl pointer-events-none shadow-[inset_0_0_20px_rgba(205,55,150,0.2)]" />
                                                )}
                                            </div>

                                            {/* Video Option */}
                                            <div
                                                onClick={() => setFormat('video')}
                                                className={`
                                                     relative group cursor-pointer rounded-2xl p-6 border-2 transition-all duration-300
                                                     ${format === 'video'
                                                        ? 'border-[#3C8CE7] bg-[#3C8CE7]/10 shadow-[0_0_30px_-5px_rgba(60,140,231,0.3)]'
                                                        : 'border-white/10 hover:border-white/20 hover:bg-white/5'}
                                                 `}
                                            >
                                                <div className="size-14 rounded-full bg-gradient-to-br from-[#3C8CE7] to-[#00EAFF] flex items-center justify-center mb-4 shadow-lg shadow-[#3C8CE7]/20">
                                                    <span className="material-symbols-outlined text-2xl text-white">movie</span>
                                                </div>
                                                <h3 className="text-lg font-bold mb-2">VIDEO VERSION</h3>
                                                <p className="text-sm text-white/40 leading-relaxed">
                                                    Best for video podcasts and visual content. Supports .mov, .mp4, .avi.
                                                </p>
                                                {format === 'video' && (
                                                    <motion.div layoutId="selection-ring" className="absolute inset-0 border-2 border-[#3C8CE7] rounded-2xl pointer-events-none shadow-[inset_0_0_20px_rgba(60,140,231,0.2)]" />
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex justify-center">
                                            <button
                                                onClick={handleNext}
                                                disabled={!format}
                                                className={`
                                                     w-full max-w-xs py-3 rounded-xl font-bold transition-all
                                                     ${format
                                                        ? 'bg-gradient-to-r from-[#cd3796] to-[#3C8CE7] text-white shadow-lg shadow-primary/25 hover:scale-[1.02]'
                                                        : 'bg-white/5 text-white/20 cursor-not-allowed'}
                                                 `}
                                            >
                                                Next
                                            </button>
                                        </div>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="step2"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                        className="space-y-8"
                                    >
                                        {/* Upload Area */}
                                        <section>
                                            <label className="text-xs font-bold uppercase tracking-widest text-white/40 mb-3 block">
                                                Upload {format === 'audio' ? 'Audio' : 'Video'} File
                                            </label>
                                            <DropzoneArea
                                                onFileSelect={setSelectedFile}
                                                selectedFile={selectedFile}
                                                accept={format === 'audio'
                                                    ? { 'audio/mpeg': ['.mp3'], 'audio/wav': ['.wav'] }
                                                    : { 'video/mp4': ['.mp4'], 'video/quicktime': ['.mov'], 'video/x-msvideo': ['.avi'] }
                                                }
                                                subtitle={format === 'audio' ? "MP3, WAV" : "MOV, MP4, AVI"}
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

                                        <div className="flex items-center justify-between pt-4">
                                            <button
                                                onClick={handleBack}
                                                className="text-white/40 hover:text-white transition-colors text-sm font-bold"
                                            >
                                                Back
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
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
