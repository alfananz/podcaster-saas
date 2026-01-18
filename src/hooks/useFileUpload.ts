import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

export function useFileUpload() {
    const [isUploading, setIsUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const generateUploadUrl = useMutation(api.files.generateUploadUrl);

    const uploadFile = async (file: File) => {
        setIsUploading(true);
        setProgress(0);

        try {
            // 1. Get URL from Convex
            const postUrl = await generateUploadUrl();

            // 2. Upload with tracking
            const storageId = await new Promise<string>((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhr.open("POST", postUrl);
                xhr.setRequestHeader("Content-Type", file.type);

                xhr.upload.onprogress = (event) => {
                    if (event.lengthComputable) {
                        const percentage = Math.round((event.loaded / event.total) * 100);
                        setProgress(percentage);
                    }
                };

                xhr.onload = () => {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        const response = JSON.parse(xhr.responseText);
                        resolve(response.storageId);
                    } else {
                        reject(xhr.statusText);
                    }
                };

                xhr.onerror = () => reject(xhr.statusText);
                xhr.send(file);
            });

            setIsUploading(false);
            return storageId;
        } catch (error) {
            setIsUploading(false);
            setProgress(0);
            throw error;
        }
    };

    return { uploadFile, isUploading, progress };
}
