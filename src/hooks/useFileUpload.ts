import { useState } from "react";
import { useAction } from "convex/react";
import { api } from "../../convex/_generated/api";

export function useFileUpload() {
    const [isUploading, setIsUploading] = useState(false);
    const [progress, setProgress] = useState(0);

    // [NEW] Use Action instead of Mutation
    const generateS3UploadUrl = useAction(api.actions.files.generateS3UploadUrl);

    const uploadFile = async (file: File) => {
        setIsUploading(true);
        setProgress(0);

        try {
            // 1. Get S3 Signed URL
            const { uploadUrl, publicUrl } = await generateS3UploadUrl({
                contentType: file.type,
                fileType: "video", // Default to video for this hook, could be parametrized
            });

            // 2. Upload directly to S3
            await new Promise<void>((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhr.open("PUT", uploadUrl);
                xhr.setRequestHeader("Content-Type", file.type);

                xhr.upload.onprogress = (event) => {
                    if (event.lengthComputable) {
                        const percentage = Math.round((event.loaded / event.total) * 100);
                        setProgress(percentage);
                    }
                };

                xhr.onload = () => {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        resolve();
                    } else {
                        reject(new Error(`Upload failed: ${xhr.statusText}`));
                    }
                };

                xhr.onerror = () => reject(new Error("Network Error"));
                xhr.send(file);
            });

            setIsUploading(false);
            return publicUrl; // [NEW] Return the S3 Public URL instead of Storage ID
        } catch (error) {
            setIsUploading(false);
            setProgress(0);
            throw error;
        }
    };

    return { uploadFile, isUploading, progress };
}
