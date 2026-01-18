import { query } from "./_generated/server";

export const stats = query({
    args: {},
    handler: async (ctx) => {
        const assets = await ctx.db.query("assets").collect();

        let video = 0;
        let audio = 0;
        let projectAssets = 0;

        for (const asset of assets) {
            if (asset.type === "video") {
                video += asset.size;
            } else if (asset.type === "audio") {
                audio += asset.size;
            } else {
                projectAssets += asset.size;
            }
        }

        return {
            video,
            audio,
            assets: projectAssets,
        };
    },
});
