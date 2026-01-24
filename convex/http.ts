import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";

const http = httpRouter();

http.route({
    path: "/debug-env",
    method: "GET",
    handler: httpAction(async (ctx, request) => {
        return new Response(JSON.stringify({
            SITE_URL: process.env.SITE_URL,
            CONVEX_SITE_URL: process.env.CONVEX_SITE_URL,
        }, null, 2), {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });
    }),
});

export default http;
