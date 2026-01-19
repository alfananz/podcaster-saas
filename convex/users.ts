import { query } from "./_generated/server";

export const current = query({
    args: {},
    handler: async (ctx) => {
        // Mock user for development
        return {
            _id: "mock_user_id",
            name: "Admin User",
            role: "admin", // "admin" or "client"
            avatar: "https://ui-avatars.com/api/?name=Admin+User&background=random",
        };
    },
});
