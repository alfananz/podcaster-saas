import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const login = mutation({
    args: {
        username: v.string(),
        password: v.string(),
    },
    handler: async (ctx, args) => {
        const user = await ctx.db
            .query("users")
            .withIndex("by_username_password", (q) =>
                q.eq("username", args.username).eq("password", args.password)
            )
            .first();

        return user ? user._id : null;
    },
});

export const seed = mutation({
    args: {},
    handler: async (ctx) => {
        const existingAdmin = await ctx.db
            .query("users")
            .withIndex("by_username", (q) => q.eq("username", "admin"))
            .first();

        if (!existingAdmin) {
            await ctx.db.insert("users", {
                name: "Admin User",
                username: "admin",
                password: "admin",
                role: "admin",
                avatar: "https://ui-avatars.com/api/?name=Admin+User&background=random",
            });
        }

        const existingClient = await ctx.db
            .query("users")
            .withIndex("by_username", (q) => q.eq("username", "client"))
            .first();

        if (!existingClient) {
            await ctx.db.insert("users", {
                name: "Client User",
                username: "client",
                password: "client",
                role: "client",
                avatar: "https://ui-avatars.com/api/?name=Client+User&background=0D8ABC&color=fff",
            });
        }

        return "Seeding complete";
    },
});
