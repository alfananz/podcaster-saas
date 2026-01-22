import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useAction } from 'convex/react';
import { useUserRole } from '../../hooks/useUserRole';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';

interface VersionControllerProps {
    episodeId: Id<"episodes">;
    currentVersionId?: Id<"versions">; // The "Head" version
    selectedVersionId?: Id<"versions">; // The currently viewed version
    onVersionSelect: (versionId: Id<"versions">) => void;
}

export function VersionController({ episodeId, currentVersionId, selectedVersionId, onVersionSelect }: VersionControllerProps) {
    const { isAdmin } = useUserRole();
    const versions = useQuery(api.versions.list, { episodeId });
    const generateS3UploadUrl = useAction(api.actions.files.generateS3UploadUrl);
    const createVersion = useMutation(api.versions.create);

    const [isOpen, setIsOpen] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Close dropdown on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Helper to calculate status colors
    const getStatusColor = (status: string, isActive: boolean) => {
        if (isActive) return "text-primary border-primary/50 bg-primary/10";
        if (status === "active") return "text-accent-cyan border-accent-cyan/50 bg-accent-cyan/10"; // Using accent-cyan assuming it exists or blue
        if (status === "approved") return "text-emerald-400 border-emerald-400/50 bg-emerald-400/10";
        return "text-slate-500 border-white/10 bg-white/5";
    };

    // Find selected version object
    const selectedVersion = versions?.find(v => v._id === selectedVersionId);
    // Fallback display if no version selected (shouldn't happen if parent handles it right)
    const displayTitle = selectedVersion ? selectedVersion.name : "Versions";

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        setIsOpen(false); // Close menu
        try {
            // 1. Get URL
            const { uploadUrl, publicUrl } = await generateS3UploadUrl({
                contentType: file.type,
                fileType: "video",
            });

            // 2. Upload
            const result = await fetch(uploadUrl, {
                method: "PUT",
                headers: { "Content-Type": file.type },
                body: file,
            });

            if (!result.ok) throw new Error("Upload failed");

            // 3. Create Version
            const newVersionId = await createVersion({
                episodeId,
                videoUrl: publicUrl, // [NEW] S3 URL
                changeLog: `Uploaded via Version Controller`,
            });

            // 4. Auto-select new version
            onVersionSelect(newVersionId);

        } catch (error) {
            console.error("Upload failed", error);
            // Show error toast?
        } finally {
            setIsUploading(false);
            // Reset input
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    if (!versions) return <div className="h-8 w-24 bg-white/5 animate-pulse rounded-lg"></div>;

    return (
        <div className="relative" ref={dropdownRef}>
            {/* The Pill Selector */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                disabled={isUploading}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all hover:bg-white/10 ${selectedVersionId === currentVersionId
                    ? "border-primary/50 text-white bg-primary/5"
                    : "border-white/20 text-slate-300"
                    } ${isUploading ? "opacity-50 cursor-not-allowed" : ""}`}
            >
                {isUploading ? (
                    <span className="size-3 border-2 border-primary border-t-transparent rounded-full animate-spin"></span>
                ) : (
                    <span className="material-symbols-outlined text-[16px] text-primary">history</span>
                )}

                <span className="text-xs font-bold tracking-wide">
                    {isUploading ? "UPLOADING..." : displayTitle}
                    {selectedVersionId === currentVersionId && !isUploading && " (Latest)"}
                </span>
                <span className="material-symbols-outlined text-[14px] opacity-50">expand_more</span>
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute top-full mt-2 left-0 w-64 bg-[#0a0612] border border-white/10 rounded-xl shadow-2xl backdrop-blur-xl z-[100] overflow-hidden">
                    <div className="p-2 space-y-1 max-h-[300px] overflow-y-auto custom-scrollbar">
                        {versions.map((v) => {
                            const isCurrent = v._id === currentVersionId;
                            const isSelected = v._id === selectedVersionId;

                            return (
                                <button
                                    key={v._id}
                                    onClick={() => {
                                        onVersionSelect(v._id);
                                        setIsOpen(false);
                                    }}
                                    className={`w-full text-left p-3 rounded-lg flex items-center gap-3 transition-all ${isSelected ? "bg-white/10" : "hover:bg-white/5"
                                        }`}
                                >
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <span className={`text-xs font-bold ${isCurrent ? "text-primary" : "text-white"}`}>
                                                {v.name}
                                            </span>
                                            {isCurrent && (
                                                <span className="text-[9px] bg-primary/20 text-primary px-1.5 py-0.5 rounded uppercase font-bold">Latest</span>
                                            )}
                                        </div>
                                        <div className="text-[10px] text-slate-500 truncate">
                                            {new Date(v.uploadTime).toLocaleString()}
                                        </div>
                                    </div>
                                    {isSelected && <span className="material-symbols-outlined text-primary text-[16px]">check</span>}
                                </button>
                            );
                        })}

                        {versions.length === 0 && (
                            <div className="text-center p-4 text-xs text-slate-500 italic">No revisions yet.</div>
                        )}
                    </div>

                    {/* Upload Action */}
                    {isAdmin && (
                        <div className="p-2 border-t border-white/10 bg-white/[0.02]">
                            <button
                                onClick={handleUploadClick}
                                className="w-full py-2.5 rounded-lg bg-primary hover:bg-primary/90 text-white text-xs font-bold tracking-wider uppercase transition-colors flex items-center justify-center gap-2"
                            >
                                <span className="material-symbols-outlined text-[16px]">cloud_upload</span>
                                Upload New Version
                            </button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                accept="video/*"
                                className="hidden"
                            />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
