import { query } from "./_generated/server";

export const checkEnv = query({
    args: {},
    handler: async (ctx) => {
        return {
            HAS_JWT_PRIVATE_KEY: !!process.env.JWT_PRIVATE_KEY,
            HAS_JWKS: !!process.env.JWKS,
            JWT_PRIVATE_KEY_LENGTH: process.env.JWT_PRIVATE_KEY?.length,
            JWKS_LENGTH: process.env.JWKS?.length,
        };
    },
});
