
const { ConvexHttpClient } = require("convex/browser");
const { api } = require("./convex/_generated/api");

const client = new ConvexHttpClient("http://127.0.0.1:3210");

async function check() {
    try {
        console.log("Attempting to fetch users from 127.0.0.1:3210...");
        // accessing internal query via http client is tricky if not exposed as query
        // let's try a public query or just checking if client throws immediately
        // Actually, let's use a simpler fetch to the root or basic endpoint
        const response = await fetch("http://127.0.0.1:3210/version");
        console.log("Local response status:", response.status);
    } catch (e) {
        console.log("Local connection failed:", e.message);
    }
}

check();
