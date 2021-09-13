import { Application, ListenOptions, ListenOptionsTls } from 'https://deno.land/x/oak@v7.7.0/mod.ts';
import { config } from 'https://deno.land/x/dotenv@v2.0.0/mod.ts';
import apiRouter from './routers/api.ts';

const app = new Application();
const env = config({safe: true});
const port: number = parseInt(env.PORT);

app.use(apiRouter.routes());
app.use(apiRouter.allowedMethods());

app.use(async (ctx, next) => {
    if (ctx.request.method === 'GET') {
        if (ctx.request.url.pathname === '/edit.html') {
            if (ctx.request.headers.get('Authorization')?.split(' ')[1] !== env.LOGIN) {
                ctx.response.status = 401;
                ctx.response.headers.set('WWW-Authenticate', 'Basic realm="HejPanel Login"');
                return;
            }         
        }
    }
    await next();
});

Deno.mkdir('db').catch(() => {});

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

let settings: ListenOptions = {
    port: port
}

if (env.HTTPS_CERTFILELOCATION !== null) {
    // Convert to ListnOptionsTls, I didn't find any other way
    settings = (settings as ListenOptions) as ListenOptionsTls;
    settings.secure = true;
    settings.certFile = env.HTTPS_CERTFILELOCATION;
    settings.keyFile = env.HTTPS_KEYFILELOCATION;
}

await app.listen(settings);
