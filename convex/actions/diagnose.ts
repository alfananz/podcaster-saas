"use node";
import { action } from "../_generated/server";
import { v } from "convex/values";

export const test = action({
    args: {},
    handler: async (ctx) => {
        console.log("=== SELF-HOSTED DIAGNOSTICS ===");

        // 1. Environment Dump
        console.log("[ENV] INSTANCE_NAME:", process.env.INSTANCE_NAME);
        console.log("[ENV] CONVEX_CLOUD_URL:", process.env.CONVEX_CLOUD_URL);
        console.log("[ENV] CONVEX_CLOUD_ORIGIN:", process.env.CONVEX_CLOUD_ORIGIN);

        // 2. Connectivity Matrix
        const endpoints = [
            { name: "Local Loopback", url: "http://127.0.0.1:3210/version" },
            { name: "Docker Service", url: "http://convex-backend:3210/version" },
            { name: "Public URL", url: "https://api.mellostudio.com/version" },
            { name: "Public URL (HTTP)", url: "http://api.mellostudio.com/version" },
            { name: "Host Gateway", url: "http://172.17.0.1:3210/version" }
        ];

        for (const ep of endpoints) {
            console.log(`\nTesting: ${ep.name} (${ep.url})`);
            try {
                const t0 = performance.now();
                const res = await fetch(ep.url, { signal: AbortSignal.timeout(2000) });
                const t1 = performance.now();
                console.log(` > Status: ${res.status}`);
                console.log(` > Time: ${(t1 - t0).toFixed(2)}ms`);
                if (!res.ok) console.log(` > Text: ${await res.text().catch(() => 'no body')}`);
            } catch (e: any) {
                console.log(` > FAILED: ${e.cause?.code || e.message}`);
                if (e.cause) console.log(" > Cause:", e.cause);
            }
        }

        // 3. SSL Verify Test
        console.log("\nTesting Public URL with SSL Verification Disabled...");
        try {
            // Node.js specific: ignore SSL
            process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
            const res = await fetch("https://api.mellostudio.com/version", { signal: AbortSignal.timeout(2000) });
            console.log(` > Status: ${res.status}`);
        } catch (e: any) {
            console.log(` > FAILED: ${e.message}`);
        } finally {
            process.env.NODE_TLS_REJECT_UNAUTHORIZED = '1';
        }

        console.log("=== END DIAGNOSTICS ===");

        // 4. Manual Client Test (The Fix Verification)
        console.log("\nTesting Manual Client (http://127.0.0.1:3210)...");
        try {
            const { ConvexHttpClient } = await import("convex/browser");
            const client = new ConvexHttpClient("http://127.0.0.1:3210");
            const queryUrl = "http://127.0.0.1:3210/api/query";
            console.log(` > POST to ${queryUrl}`);
            const res = await fetch(queryUrl, {
                method: "POST",
                body: JSON.stringify({ path: "nonExistent", args: {} }),
                headers: { "Content-Type": "application/json" }
            });
            console.log(` > Status: ${res.status} (Expected 404 or 400 or 200, valid HTTP connectivity)`);
        } catch (e: any) {
            console.log(` > FAILED: ${e.message}`);
        }
    },
});
