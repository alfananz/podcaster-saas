"use client";
import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

interface DropzoneAreaProps {
    onFileSelect: (file: File) => void;
    selectedFile: File | null;
}

export function DropzoneArea({ onFileSelect, selectedFile }: DropzoneAreaProps) {
    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            onFileSelect(acceptedFiles[0]);
        }
    }, [onFileSelect]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        maxFiles: 1,
        onDrop,
        accept: {
            'video/mp4': ['.mp4'],
            'video/quicktime': ['.mov'],
            'video/x-msvideo': ['.avi']
        }
    });

    return (
        <div
            {...getRootProps()}
            className={`
                border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all h-64 relative overflow-hidden
                ${isDragActive ? 'border-mello-blue bg-mello-blue/5' : 'border-white/20 hover:border-white/40 hover:bg-white/5'}
                ${selectedFile ? 'border-primary/50 bg-primary/5' : ''}
            `}
        >
            <input {...getInputProps()} />

            <div className="size-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                {selectedFile ? (
                    <span className="material-symbols-outlined text-3xl text-primary">movie</span>
                ) : (
                    <span className="material-symbols-outlined text-3xl text-white/60">cloud_upload</span>
                )}
            </div>

            {selectedFile ? (
                <div className="space-y-1">
                    <p className="font-bold text-white max-w-[200px] truncate">{selectedFile.name}</p>
                    <p className="text-xs text-white/40">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                </div>
            ) : isDragActive ? (
                <p className="text-mello-blue font-bold">Drop the files here ...</p>
            ) : (
                <div className="space-y-1">
                    <p className="font-bold text-white">Click to upload or drag and drop</p>
                    <p className="text-xs text-white/40">MP4, MOV, AVI (Max 2GB)</p>
                </div>
            )}
        </div>
    );
}
