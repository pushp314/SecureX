import { Server as SocketIOServer } from 'socket.io';
import { Server as HttpServer } from 'http';

let io: SocketIOServer | null = null;

export function initWebSocketServer(server: HttpServer): SocketIOServer {
  io = new SocketIOServer(server, {
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

export function broadcastTelemetryPulse(event: any) {
  if (io) {
    io.emit('telemetry:event', event);
  }
}

export function broadcastAlert(alert: any) {
  if (io) {
    io.emit('detection:alert', alert);
  }
}

export function broadcastIncidentUpdate(incident: any) {
  if (io) {
    io.emit('incident:update', incident);
  }
}
