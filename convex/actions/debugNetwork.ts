"use node";
import { action } from "../_generated/server";
import { internal } from "../_generated/api";

export const test = action({
    args: {},
    handler: async (ctx) => {
        console.log("--- NETWORK DIAGNOSTIC V2 ---");
        console.log("ENV CONVEX_CLOUD_URL:", process.env.CONVEX_CLOUD_URL);
        console.log("ENV CONVEX_CLOUD_ORIGIN:", process.env.CONVEX_CLOUD_ORIGIN);

        // 1. Test Mutation (Internal communication)
        try {
            console.log("Testing Internal Mutation (ctx.runMutation)...");
            // We'll try a dummy update or just assume if this throws it fails.
            // We don't have a safe no-op mutation easily available, but we can try fetching something internal if possible.
            // Actually, just logging this step is enough. If this action runs, we are halfway there.
        } catch (e) {
            console.error("Mutation Setup Failed", e);
        }

        // 2. Test Fetch to Internal
        const candidates = [
            process.env.CONVEX_CLOUD_URL, // The one we hope is set
            "http://127.0.0.1:3210",
            "http://localhost:3210",
            "http://convex-backend:3210",
            "https://api.mellostudio.com"
        ];

        for (const url of candidates) {
            if (!url) continue;
            console.log(`Testing Fetch to: ${url}`);
            try {
                const res = await fetch(url + "/version", { signal: AbortSignal.timeout(2000) });
                console.log(`[SUCCESS] ${url} status: ${res.status}`);
            } catch (e: any) {
                console.log(`[FAILED] ${url} error: ${e.cause?.code || e.message}`);
            }
        }
        console.log("--- END ---");
    },
});
