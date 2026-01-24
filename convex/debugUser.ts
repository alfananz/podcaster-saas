import { query } from "./_generated/server";

export const listAll = query({
    args: {},
    handler: async (ctx) => {
        const users = await ctx.db.query("users").collect();
        return users.map(u => ({
            _id: u._id,
            name: u.name,
            email: u.email,
            role: u.role,
        }));
    },
});
