"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initWebSocketServer = initWebSocketServer;
exports.broadcastTelemetryPulse = broadcastTelemetryPulse;
exports.broadcastAlert = broadcastAlert;
exports.broadcastIncidentUpdate = broadcastIncidentUpdate;
const socket_io_1 = require("socket.io");
let io = null;
function initWebSocketServer(server) {
    io = new socket_io_1.Server(server, {
        cors: {
            origin: '*',
            methods: ['GET', 'POST'],
        },
    });
    io.on('connection', (socket) => {
        console.log(`[WebSocket] SOC Client connected: ${socket.id}`);
        socket.on('disconnect', () => {
            console.log(`[WebSocket] SOC Client disconnected: ${socket.id}`);
        });
    });
    return io;
}
function broadcastTelemetryPulse(event) {
    if (io) {
        io.emit('telemetry:event', event);
    }
}
function broadcastAlert(alert) {
    if (io) {
        io.emit('detection:alert', alert);
    }
}
function broadcastIncidentUpdate(incident) {
    if (io) {
        io.emit('incident:update', incident);
    }
}
