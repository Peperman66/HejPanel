import { Application } from 'https://deno.land/x/oak/mod.ts';
import { config } from 'https://deno.land/x/dotenv/mod.ts';

const app = new Application();
const port: number = parseInt(config({ safe: true }).PORT);

app.use(async (ctx) => {
    await ctx.send({
        root: `${Deno.cwd()}/static`,
        index: 'index.html'
    });
});

await app.listen({ port: port });
