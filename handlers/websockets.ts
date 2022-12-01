import {GetLunchData} from './lunch.ts';
import {GetWeatherData} from './weather.ts';
import {GetEventData} from './events.ts';
import {GetMediaData} from './media.ts';

import {CallOnSetTime} from '../libs/time_call.ts';

type WebSocketData = {
    socket: WebSocket,
    ip: string,
    connections: Array<number>,
    didReceivePing: boolean
};

const broadcastChannel = new BroadcastChannel("refresh");

type MessageRefreshType = "lunch" | "weather" | "events" | "images" | "reload"

broadcastChannel.onmessage = (event: MessageEvent<MessageRefreshType>) => {
    if (event.data == "weather") {
        sockets.forEach(websocketData => 
            sendWeatherData(websocketData.socket)
        );
    } else if (event.data == "lunch") {
        sockets.forEach(websocketData => {
            sendLunchData(websocketData.socket);
        })
    } else if (event.data == "events") {
        sockets.forEach(websocketData => {
            sendEventData(websocketData.socket);
        })
    } else if (event.data == "images") {
        sockets.forEach(websocketData => {
            sendMediaData(websocketData.socket);
        })
    } else if (event.data == "reload") {
        sockets.forEach(websocketData => {
            sendReload(websocketData.socket);
        });
    }
}
const sockets = new Map<string, WebSocketData>();

let weatherConnection: number;
let lunchConnection: number;

export function handleWs(sock: WebSocket, ip: string) {
    const socketId = crypto.randomUUID();
    const websocketData: WebSocketData = {
        socket: sock,
        ip: ip,
        connections: [],
        didReceivePing: true
    }

    sock.onopen = () => {
        sockets.set(socketId, websocketData);
        console.log(`New connection!\nSocketId: ${socketId}\nIP: ${websocketData.ip}\nConnections: ${sockets.size}`);
        websocketData.connections.push(setInterval(() => sendPing(websocketData), 30000));

        if (sockets.size == 1) {
            lunchConnection = setInterval(sendLunchDataToAll, 6*60*60*1000);
            createWeatherConnection();
        }

        sendLunchData(sock);
        sendWeatherData(sock);
        sendEventData(sock);
        sendMediaData(sock);
    }

    sock.onmessage = (e) => {
        console.log("Message from " + socketId + "\n" + e.data);
    }

    sock.onclose = () => {
        for (const connection of websocketData.connections) {
            clearInterval(connection);
        }
        sockets.delete(socketId);
        console.log(`Connection closed!\nSocketId: ${socketId}\nIP: ${websocketData.ip}\nConnections: ${sockets.size}`);
    
        if (sockets.size == 0) {
            clearTimeout(weatherConnection);
            clearInterval(lunchConnection);
        }
    }
}

function sendPing(websocketData: WebSocketData) {
    if (websocketData.didReceivePing == false) {
        websocketData.socket.close();
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

export function sendReloadToAll() {
    broadcastChannel.postMessage("reload");
}

export function sendLunchDataToAll() {
    broadcastChannel.postMessage("lunch");
}

export function sendEventDataToAll() {
    broadcastChannel.postMessage("events");
}

export function sendMediaDataToAll() {
    broadcastChannel.postMessage("images");
}

function createWeatherConnection() {
    weatherConnection = CallOnSetTime(createWeatherConnection, 30*60*1000); //30 minutes
    sendWeatherDataToAll();
}

export function sendWeatherDataToAll() {
    broadcastChannel.postMessage("weather");
}
