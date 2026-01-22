"use node";

import { action } from "../_generated/server";
import { v } from "convex/values";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Re-usable S3 Client setup
const s3Client = new S3Client({
    region: process.env.AWS_REGION!,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
});

export const generateS3UploadUrl = action({
    args: {
        contentType: v.string(), // e.g. "video/mp4"
        fileType: v.union(v.literal("video"), v.literal("image"), v.literal("audio"), v.literal("json")), // Folder organization helper
    },
    handler: async (ctx, args) => {
        // 1. Validate Env
        const bucketName = process.env.AWS_BUCKET_NAME;
        if (!bucketName) throw new Error("AWS_BUCKET_NAME is not set");

        // 2. Generate Key
        const timestamp = Date.now();
        const rand = Math.random().toString(36).substring(7);
        const folderMap: Record<string, string> = {
            video: "videos",
            audio: "audios",
            image: "images",
            json: "data"
        };
        const folder = folderMap[args.fileType] || "others";
        const key = `${folder}/${timestamp}-${rand}`; // e.g. "videos/170000000-xyz123"
        // Note: Client will need to append extension if they want, or we trust Content-Type.
        // Actually, best practice is to include extension in key if possible, but for simplicity let's stick to unique IDs 
        // OR rely on browser to handle mime types. 
        // Let's keep it simple: "videos/TIMESTAMP-RANDOM" and allow any extension.

        // 3. Command
        const command = new PutObjectCommand({
            Bucket: bucketName,
            Key: key,
            ContentType: args.contentType,
            // ACL: "public-read", // REMOVED: User chose "Bucket Policy" approach, so no ACL needed per object.
        });

        // 4. Generate URL
        const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

        // 5. Construct Public URL (Assuming Standard Virtual Hosted style or simple path style if region issues)
        // Standard: https://BUCKET.s3.REGION.amazonaws.com/KEY
        const publicUrl = `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

        return {
            uploadUrl,
            publicUrl,
            key,
        };
    },
});

export const deleteS3Files = action({
    args: {
        keys: v.array(v.string())
    },
    handler: async (ctx, args) => {
        if (args.keys.length === 0) return;

        const { DeleteObjectsCommand } = await import("@aws-sdk/client-s3");

        await s3Client.send(new DeleteObjectsCommand({
            Bucket: process.env.AWS_BUCKET_NAME!,
            Delete: {
                Objects: args.keys.map(key => ({ Key: key })),
                Quiet: true, // Only report errors
            },
        }));

        console.log(`[S3] Deleted ${args.keys.length} files:`, args.keys);
    }
});
