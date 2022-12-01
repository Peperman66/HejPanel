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
    console.log(`Message of type ${event.data} received!`);
    if (event.data == "weather") {
        sendWeatherDataToAll();
    } else if (event.data == "lunch") {
        sendLunchDataToAll();
    } else if (event.data == "events") {
        sendEventDataToAll();
    } else if (event.data == "images") {
        sendMediaDataToAll();
    } else if (event.data == "reload") {
        sendReloadToAll();
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
            lunchConnection = setInterval(broadcastLunchDataMessage, 6*60*60*1000);
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

export function broadcastReloadMessage() {
    console.log("Sending reload message!")
    broadcastChannel.postMessage("reload");
    sendReloadToAll();
}

function sendReloadToAll() {
    console.log("Reloading all pages!")
    sockets.forEach(websocketData => {
        sendReload(websocketData.socket);
    });
}

export function broadcastLunchDataMessage() {
    console.log("Sending lunch message!");
    broadcastChannel.postMessage("lunch");
    sendLunchDataToAll();
}

function sendLunchDataToAll() {
    console.log("Refreshing lunch data!");
    sockets.forEach(websocketData => {
        sendLunchData(websocketData.socket);
    })
}

export function broadcastEventDataMessage() {
    console.log("Sending event message!");
    broadcastChannel.postMessage("events");
    sendEventDataToAll();
}

function sendEventDataToAll() {
    console.log("Refreshing event data!");
    sockets.forEach(websocketData => {
        sendEventData(websocketData.socket);
    })
}

export function broadcastMediaDataMessage() {
    console.log("Sending image message!");
    broadcastChannel.postMessage("images");
    sendMediaDataToAll();
}

function sendMediaDataToAll() {
    console.log("Refreshing image data!");
    sockets.forEach(websocketData => {
        sendMediaData(websocketData.socket);
    })
}

function createWeatherConnection() {
    weatherConnection = CallOnSetTime(createWeatherConnection, 30*60*1000); //30 minutes
    sendWeatherDataToAll();
}

export function broadcastWeatherDataMessage() {
    console.log("Sending weather message!");
    broadcastChannel.postMessage("weather");
    sendWeatherDataToAll();
}

function sendWeatherDataToAll() {
    console.log("Refreshing weather data!")
    sockets.forEach(websocketData => 
        sendWeatherData(websocketData.socket)
    );
}
