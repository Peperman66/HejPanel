import {Router} from 'https://deno.land/x/oak@v7.7.0/mod.ts';
import {
    WebSocket,
    isWebSocketCloseEvent,
    isWebSocketPongEvent,
} from 'https://deno.land/std@0.99.0/ws/mod.ts';
import { v4 } from 'https://deno.land/std@0.99.0/uuid/mod.ts';
import {GetLunchData} from '../handlers/lunch.ts';

const sockets = new Map<string, WebSocket>();

const apiRouter = new Router();
apiRouter
    .get('/api/ws', async (ctx) => {
        const sock = await ctx.upgrade();
        handleWs(sock);
    });

async function handleWs(sock: WebSocket) {
    const socketId = v4.generate();
    sockets.set(socketId, sock);

    sendLunchData(sock);

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

function sendLunchData(sock: WebSocket): void {
    sock.send(JSON.stringify({
        type: 'lunch',
        data: GetLunchData()
    }));
}

setInterval(() => {sockets.forEach(sock => sendLunchData(sock))},6*60*60*1000) //every 6 hours

export default apiRouter;
