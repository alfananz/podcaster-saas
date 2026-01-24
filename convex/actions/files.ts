"use node";

import { action } from "../_generated/server";
import { v } from "convex/values";
import { S3Client, PutObjectCommand, DeleteObjectsCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Re-usable S3 Client setup
const s3Client = new S3Client({
    region: process.env.AWS_REGION!,
    endpoint: process.env.AWS_ENDPOINT, // Support custom endpoints (MinIO, R2, etc.)
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
    forcePathStyle: !!process.env.AWS_ENDPOINT, // Often needed for local/compat S3
});

export const generateS3UploadUrl = action({
    args: {
        contentType: v.string(),
        fileType: v.union(v.literal("video"), v.literal("image"), v.literal("audio"), v.literal("json")),
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
        const key = `${folder}/${timestamp}-${rand}`;

        // 3. Command
        const command = new PutObjectCommand({
            Bucket: bucketName,
            Key: key,
            ContentType: args.contentType,
        });

        // 4. Generate URL (Signed)
        const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

        // 5. Construct Public URL
        let publicUrl: string;
        if (process.env.AWS_ENDPOINT) {
            // Custom Endpoint (e.g. MinIO, R2)
            // Strategy: Use the endpoint + bucket + key
            // Note: R2/MinIO handling varies. Trying standard path style: endpoint/bucket/key
            const endpoint = process.env.AWS_ENDPOINT.replace(/\/$/, "");
            publicUrl = `${endpoint}/${bucketName}/${key}`;
        } else {
            // Standard AWS
            publicUrl = `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
        }

        console.log(`[Files] Generated config: Key=${key}, Endpoint=${process.env.AWS_ENDPOINT || 'Standard AWS'}`);

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
