import { Application } from 'https://deno.land/x/oak@v7.7.0/mod.ts';
import { config } from 'https://deno.land/x/dotenv@v2.0.0/mod.ts';
import apiRouter from './routers/api.ts';

const app = new Application();
const port: number = parseInt(config({ safe: true }).PORT);
const login: string = config({safe: true}).LOGIN;

app.use(apiRouter.routes());
app.use(apiRouter.allowedMethods());

app.use(async (ctx, next) => {
    if (ctx.request.method === 'GET') {
        if (ctx.request.url.pathname === '/edit.html') {
            if (ctx.request.headers.get('Authorization')?.split(' ')[1] !== login) {
                ctx.response.status = 401;
                ctx.response.headers.set('WWW-Authenticate', 'Basic realm="HejPanel Login"');
                return;
            }         
        }
    }
    await next();
});

app.use(async (ctx, next) => {
    if (ctx.request.url.pathname.startsWith('/media/')) {
        await ctx.send({
            path: `${ctx.request.url.pathname.replace('/media/', '')}`,
            root: `${Deno.cwd()}/db/images/`
        });
    } else {
        await next();
    }
})

app.use(async (ctx) => {
    await ctx.send({
        root: `${Deno.cwd()}/static`,
        index: 'index.html'
    });
});

await app.listen({ port: port });
