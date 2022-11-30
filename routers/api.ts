import {Router} from "../deps.ts";
import { assert } from '../deps.ts';
import {config} from "../deps.ts";

import {GetLunchData, UpdateLunchData} from '../handlers/lunch.ts';
import {GetWeatherData, UpdateWeatherData} from '../handlers/weather.ts';
import {GetEventData, SaveEventData} from '../handlers/events.ts';
import {GetMediaData, SaveMediaData} from '../handlers/media.ts';

import {CallOnSetTime} from '../libs/time_call.ts'
import {controller} from '../index.ts';

const login = Deno.env.get("LOGIN");
assert(login != undefined);
const sockets = new Map<string, WebSocket>();

const apiRouter = new Router();
apiRouter
    .get('/api/ws', ctx => {
        const sock = ctx.upgrade();
        console.log("Incomming websocket request! IP: " + ctx.request.ip);
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
    .post('/api/updatelunch', ctx => {
        if (ctx.request.headers.get('Authorization')?.split(' ')[1] !== login) {
            ctx.response.status = 401;
            ctx.response.headers.set('WWW-Authenticate', 'Basic realm="HejPanel Login"');
        } else {
            UpdateLunchData()
            .then(() => {
                sockets.forEach(sock => sendLunchData(sock));
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
                sockets.forEach(sock => sendWeatherData(sock));
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

function handleWs(sock: WebSocket) {
    const socketId = crypto.randomUUID();

    sock.onopen = () => {
        if (sockets.size == 0) {
            startPingLoop();
        }
        sockets.set(socketId, sock);
        console.log("New connection! Connections: " + sockets.size);
        sendLunchData(sock);
        sendWeatherData(sock);
        sendEventData(sock);
        sendMediaData(sock);
    }

    sock.onmessage = (e) => {
        console.log(e.data);
    }

    sock.onclose = () => {
        sockets.delete(socketId);
        console.log("Connection closed! Connections: " + sockets.size);
        if (sockets.size == 0) {
            stopPingLoop();
        }
    }
}

async function sendLunchData(sock: WebSocket) {
    sock.send(JSON.stringify({
        type: 'lunch',
        data: await GetLunchData()
    }));
}

async function sendWeatherData(sock: WebSocket) {
    sock.send(JSON.stringify({
        type: 'weather',
        data: await GetWeatherData()
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

let connection;

function startPingLoop() {
    connection = setInterval(doPing, 30000);
}

function doPing() {
    sockets.forEach(sock => {
        sock.send(JSON.stringify({type: "ping"}));
    })
}

function stopPingLoop() {
    clearInterval(connection);
}

function sendWeatherDataToAll() {
    sockets.forEach(sock => sendWeatherData(sock));
    CallOnSetTime(sendWeatherDataToAll, 30*60*1000) // 30 minutes
}
setInterval(() => {sockets.forEach(sock => sendLunchData(sock))},6*60*60*1000); //every 6 hours
sendWeatherDataToAll();

export default apiRouter;
