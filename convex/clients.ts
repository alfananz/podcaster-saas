import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUser } from "./users";

// [QUERY] List all clients with their episode counts
export const listClientsWithStats = query({
    args: { token: v.optional(v.string()) },
    handler: async (ctx, args) => {
        // 1. Permission Gate: Admin Only
        const identity = await ctx.auth.getUserIdentity();
        let isAdmin = false;

        // Check standard auth
        if (identity) {
            // Assuming "admin" role might be in custom claims or we check strict subject logic
            // But since users.ts is the source of truth, we should match identity subject to a user?
            // For now, let's rely on getAuthUser if identity is missing OR if we want to confirm role from DB.
            // Actually, if identity exists, it might be an admin from an external provider. 
            // But the prompt context implies custom auth via users table is the main way.
        }

        // Check Custom Auth (since users.ts exists and we likely use tokens)
        const user = await getAuthUser(ctx, { token: args.token });
        if (user && user.role === "admin") {
            isAdmin = true;
        }

        // Throw if not authorized
        if (!isAdmin) {
            throw new Error("Unauthorized: Admin access required");
        }

        // 2. Fetch all clients
        // We do not have a role index, so we filter.
        const clients = await ctx.db
            .query("users")
            // .withIndex("by_email") // Iterate all users and filter.
            .filter((q) => q.eq(q.field("role"), "client"))
            .collect();

        // 3. Aggregate Episode Counts
        const aggregated = await Promise.all(clients.map(async (client) => {
            // Count episodes where authorId matches client ID
            // Note: authorId is a string. client._id is ID.
            const stats = await ctx.db
                .query("episodes")
                .withIndex("by_author", (q) => q.eq("authorId", client._id)) // String comparison works for IDs
                .collect();

            return {
                ...client,
                episodeCount: stats.length,
                // Mock storage usage for now as requested
                storageUsed: Math.floor(Math.random() * 50) + "GB",
                projectCount: stats.length // Redundant but fits UI props often
            };
        }));

        return aggregated;
    },
});

// [MUTATION] Invite a new client
export const inviteClient = mutation({
    args: {
        name: v.string(),
        email: v.string(),
        temporaryPassword: v.string(), // We set this initially
        token: v.optional(v.string()), // Admin token for auth
    },
    handler: async (ctx, args) => {
        // 1. Auth Check
        const user = await getAuthUser(ctx, { token: args.token });
        if (!user || user.role !== "admin") {
            throw new Error("Unauthorized: Admin access required");
        }

        // 2. Check for Duplicate Email
        const existing = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", args.email))
            .unique();

        if (existing) {
            throw new Error("User with this email already exists.");
        }

        // 3. Create User
        const userId = await ctx.db.insert("users", {
            name: args.name,
            email: args.email,
            password: args.temporaryPassword, // Simple auth
            role: "client",
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${args.name.replace(" ", "")}`,
        });

        return { success: true, userId };
    },
});
