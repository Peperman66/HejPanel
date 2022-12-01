import { Application, ListenOptions, ListenOptionsTls, assert, config} from './deps.ts';
import apiRouter from './routers/api.ts';

await config({export: true});

const app = new Application();
const port: number = parseInt(Deno.env.get("PORT") || "80");

export const controller = new AbortController();
const signal = controller.signal;

app.use(apiRouter.routes());
app.use(apiRouter.allowedMethods());

assert(Deno.env.get("LOGIN") !== undefined);

app.use(async (ctx, next) => {
    if (ctx.request.method === 'GET') {
        if (ctx.request.url.pathname === '/edit.html') {
            if (ctx.request.headers.get('Authorization')?.split(' ')[1] !== Deno.env.get("LOGIN")) {
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

let settings: ListenOptions = {
    port: port,
    signal: signal
}

if (Deno.env.get("TLS_CERTFILELOCATION") !== undefined) {
    // Convert to ListenOptionsTls, I didn't find any other way
    settings = (settings as ListenOptions) as ListenOptionsTls;
    settings.secure = true;
    const certFile = Deno.env.get("TLS_CERTFILELOCATION");
    const keyFile = Deno.env.get("TLS_KEYFILELOCATION");
    assert(certFile != undefined);
    assert(keyFile != undefined);
    settings.certFile = certFile;
    settings.keyFile = keyFile;
}

await app.listen(settings);
Deno.exit();
