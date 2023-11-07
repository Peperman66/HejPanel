import {Router} from "../deps.ts";
import { assert } from '../deps.ts';
import {decode} from '../deps.ts';

import {UpdateLunchData} from '../handlers/lunch.ts';
import {UpdateWeatherData} from '../handlers/weather.ts';
import {SaveEventData} from '../handlers/events.ts';
import {SaveMediaData} from '../handlers/media.ts';

import { handleWs, broadcastReloadMessage, broadcastLunchDataMessage, broadcastMediaDataMessage, broadcastEventDataMessage, broadcastWeatherDataMessage } from "../handlers/websockets.ts";
import { getMediaData } from "../handlers/db.ts";

import {controller} from '../index.ts';

const login = Deno.env.get("LOGIN");
assert(login != undefined);

const apiRouter = new Router();
apiRouter
    .get('/api/ws', ctx => {
        const sock = ctx.upgrade();
        handleWs(sock, ctx.request.ip);
    })
    .post('/api/events', async (ctx) => {
        if (ctx.request.headers.get('Authorization')?.split(' ')[1] !== login) {
            ctx.response.status = 401;
            ctx.response.headers.set('WWW-Authenticate', 'Basic realm="HejPanel Login"');
        } else {
            await ctx.request.body({type: "json"}).value
                .then(result => SaveEventData(result))
                .then(() => {
                    ctx.response.status = 204;
                    broadcastEventDataMessage();
                })
                .catch((err) => {
                    ctx.response.status = 500;
                    console.log(err);
                });
        }
    })
    .post('/api/media', async (ctx) => {
        if (ctx.request.headers.get('Authorization')?.split(' ')[1] !== login) {
            ctx.response.status = 401;
            ctx.response.headers.set('WWW-Authenticate', 'Basic realm="HejPanel Login"');
        } else {
            await ctx.request.body({type: "json", limit: 104652900}).value
                .then(result => SaveMediaData(result))
                .then(() => {
                    ctx.response.status = 204;
                    broadcastMediaDataMessage();
                })
                .catch((err) => {
                    ctx.response.status = 500;
                    console.log(err);
                });
        }
    })
    .get('/api/media/:imageHash', async ctx => {
        const imageHash = ctx.params.imageHash;
        console.log(`Sending image for hash ${imageHash}!`)
        const imageData = await getMediaData(imageHash);
        if (imageData === null) {
            ctx.response.status = 404;
        } else {
            ctx.response.headers.set('Content-Type', 'image/png');
            ctx.response.headers.set('Cache-Control', `public, max-age=${60*60}`) //1 hour
            ctx.response.body = imageData.data.buffer;
            ctx.response.status = 200;
        }
    })
    .post('/api/reload', ctx => {
        if (ctx.request.headers.get('Authorization')?.split(' ')[1] !== login) {
            ctx.response.status = 401;
            ctx.response.headers.set('WWW-Authenticate', 'Basic realm="HejPanel Login"');
        } else {
            broadcastReloadMessage();
            ctx.response.status = 204;
        }
    })
    .post('/api/updatelunch', ctx => {
        if (ctx.request.headers.get('Authorization')?.split(' ')[1] !== login) {
            ctx.response.status = 401;
            ctx.response.headers.set('WWW-Authenticate', 'Basic realm="HejPanel Login"');
        } else {
            UpdateLunchData()
            .then(() => {
                broadcastLunchDataMessage();
            })
            ctx.response.status = 204;
        }
    })
    .post('/api/updateweather', ctx => {
        if (ctx.request.headers.get('Authorization')?.split(' ')[1] !== login) {
            ctx.response.status = 401;
            ctx.response.headers.set('WWW-Authenticate', 'Basic realm="HejPanel Login"');
        } else {
            UpdateWeatherData()
            .then(() => {
                broadcastWeatherDataMessage();
            })
            ctx.response.status = 204;
        }
    })
    .post('/api/shutdown', ctx => {
        if (ctx.request.headers.get('Authorization')?.split(' ')[1] !== login) {
            ctx.response.status = 401;
            ctx.response.headers.set('WWW-Authenticate', 'Basic realm="HejPanel Login"');
        } else {
            ctx.response.status = 204;
            controller.abort();
        }
    })



export default apiRouter;
