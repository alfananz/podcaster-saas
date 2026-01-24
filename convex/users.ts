import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const current = query({
    args: { token: v.optional(v.string()) },
    handler: async (ctx, args) => {
        return await getAuthUser(ctx, { token: args.token });
    },
});

// Helper to get authenticated user by token
export const getAuthUser = async (ctx: any, args: { token?: string }) => {
    const token = args.token;
    if (!token) return null;

    const session = await ctx.db
        .query("sessions")
        .withIndex("by_token", (q: any) => q.eq("token", token))
        .unique();

    if (!session) return null;

    if (session.expiresAt < Date.now()) {
        return null; // Expired
    }

    return await ctx.db.get(session.userId);
};

export const login = mutation({
    args: {
        email: v.string(),
        password: v.string(),
    },
    handler: async (ctx, args) => {
        const user = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", args.email))
            .unique();

        if (!user || user.password !== args.password) {
            throw new Error("Invalid credentials");
        }

        const token = Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);
        const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000; // 30 days

        await ctx.db.insert("sessions", {
            userId: user._id,
            token,
            expiresAt,
        });

        return {
            token,
            user: {
                name: user.name,
                email: user.email,
                role: user.role,
                avatar: user.avatar,
            },
        };
    },
});

export const seedDefaultUsers = mutation({
    args: {},
    handler: async (ctx) => {
        const existingAdmin = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", "admin"))
            .unique();

        if (!existingAdmin) {
            await ctx.db.insert("users", {
                name: "Admin User",
                email: "admin",
                password: "admin123",
                role: "admin",
                avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Admin",
            });
        }

        const existingClient = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", "client"))
            .unique();

        if (!existingClient) {
            await ctx.db.insert("users", {
                name: "Client User",
                email: "client",
                password: "client123",
                role: "client",
                avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Client",
            });
        }

        // Create sadmin as well since it was mentioned in logs/history
        const existingSadmin = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", "sadmin"))
            .unique();

        if (!existingSadmin) {
            await ctx.db.insert("users", {
                name: "Super Admin",
                email: "sadmin",
                password: "sadmin123",
                role: "admin",
                avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sadmin",
            });
        }
    },
});

export const updatePassword = mutation({
    args: {
        currentPassword: v.string(),
        newPassword: v.string(),
        token: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        // 1. Authenticate
        const user = await getAuthUser(ctx, { token: args.token });
        if (!user) {
            throw new Error("Unauthorized");
        }

        // 2. Verify current password
        if (user.password !== args.currentPassword) {
            throw new Error("Incorrect current password");
        }

        // 3. Update password
        await ctx.db.patch(user._id, {
            password: args.newPassword,
        });

        return { success: true };
    },
});
