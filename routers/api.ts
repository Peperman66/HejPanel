import {Router} from 'https://deno.land/x/oak@v7.7.0/mod.ts';
import {
    WebSocket,
    isWebSocketCloseEvent,
    isWebSocketPongEvent,
} from 'https://deno.land/std@0.99.0/ws/mod.ts';
import { v4 } from 'https://deno.land/std@0.99.0/uuid/mod.ts';
import { config } from 'https://deno.land/x/dotenv@v2.0.0/mod.ts';

import {GetLunchData} from '../handlers/lunch.ts';
import {GetWeatherData} from '../handlers/weather.ts';
import {GetEventData, SaveEventData} from '../handlers/events.ts';
import {GetMediaData, SaveMediaData} from '../handlers/media.ts';

import {CallOnSetTime} from '../libs/time_call.ts'

const login: string = config({safe: true}).LOGIN;
const sockets = new Map<string, WebSocket>();

const apiRouter = new Router();
apiRouter
    .get('/api/ws', async (ctx) => {
        const sock = await ctx.upgrade();
        handleWs(sock);
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
                    sockets.forEach(sock => sendEventData(sock));
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
            await ctx.request.body({type: "json"}).value
                .then(result => SaveMediaData(result))
                .then(() => {
                    ctx.response.status = 204;
                    sockets.forEach(sock => sendMediaData(sock));
                })
                .catch((err) => {
                    ctx.response.status = 500;
                    console.log(err);
                });
        }
    })
    .post('/api/reload', ctx => {
        if (ctx.request.headers.get('Authorization')?.split(' ')[1] !== login) {
            ctx.response.status = 401;
            ctx.response.headers.set('WWW-Authenticate', 'Basic realm="HejPanel Login"');
        } else {
            sockets.forEach(sock => sendReload(sock));
            ctx.response.status = 204;
        }
    })

async function handleWs(sock: WebSocket) {
    const socketId = v4.generate();
    sockets.set(socketId, sock);

    sendLunchData(sock);
    sendWeatherData(sock);
    sendEventData(sock);
    sendMediaData(sock);

    try {
        for await (const ev of sock) {
            console.log(ev);
            if (typeof ev === "string") {    
                console.log(ev); 
            } else if (isWebSocketPongEvent(ev)) {
                //Pong event
            } else if (isWebSocketCloseEvent(ev)) {
                sockets.delete(socketId);
            }
        }

    } catch (err) {
        console.error(`failed to receive frame: ${err}`);

        if (!sock.isClosed) {
            await sock.close(1000).catch(console.error);
            sockets.delete(socketId);
        }
    }
}

function sendLunchData(sock: WebSocket) {
    sock.send(JSON.stringify({
        type: 'lunch',
        data: GetLunchData()
    }));
}

function sendWeatherData(sock: WebSocket) {
    sock.send(JSON.stringify({
        type: 'weather',
        data: GetWeatherData()
    }))
}

async function sendEventData(sock: WebSocket) {
    sock.send(JSON.stringify({
        type: 'events',
        data: await GetEventData()
    }))
}

async function sendMediaData(sock: WebSocket) {
    sock.send(JSON.stringify({
        type: 'media',
        data: await GetMediaData()
    }));
}

function sendReload(sock: WebSocket) {
    sock.send(JSON.stringify({
        type: "reload"
    }));
}

setInterval(() => {sockets.forEach(sock => sendLunchData(sock))},6*60*60*1000); //every 6 hours
CallOnSetTime(() => sockets.forEach(sock => sendWeatherData(sock)), 30*60*1000); //every 30 minutes

export default apiRouter;
