import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { wsMessageSchema } from '@shared/schema';

interface Session {
  id: string;
  socket: WebSocket;
  lastPing: number;
}

const sessions = new Map<string, Session>();
const MAX_PAYLOAD_BYTES = parseInt(process.env.MAX_WS_PAYLOAD_BYTES || '131072');
const HEARTBEAT_INTERVAL = 30000; // 30 seconds

export function setupWebSocketRelay(server: Server) {
  const wss = new WebSocketServer({ 
    server, 
    path: '/ws',
    perMessageDeflate: false,
    maxPayload: MAX_PAYLOAD_BYTES,
  });

  // Heartbeat cleanup
  const heartbeatInterval = setInterval(() => {
    const now = Date.now();
    for (const [sessionId, session] of Array.from(sessions.entries())) {
      if (now - session.lastPing > HEARTBEAT_INTERVAL * 2) {
        session.socket.terminate();
        sessions.delete(sessionId);
        console.log(`Cleaned up inactive session: ${sessionId}`);
      }
    }
  }, HEARTBEAT_INTERVAL);

  wss.on('connection', (ws, req) => {
    const url = new URL(req.url!, `http://${req.headers.host}`);
    const pathParts = url.pathname.split('/');
    const sessionId = pathParts[pathParts.length - 1];

    if (!sessionId || sessionId === 'ws') {
      ws.close(4000, 'Session ID required');
      return;
    }

    const session: Session = {
      id: sessionId,
      socket: ws,
      lastPing: Date.now(),
    };

    sessions.set(sessionId, session);
    console.log(`WebSocket connected: ${sessionId}`);

    // Handle messages
    ws.on('message', async (data) => {
      try {
        const dataStr = data.toString();
        if (dataStr.length > MAX_PAYLOAD_BYTES) {
          ws.close(4001, 'Payload too large');
          return;
        }

        const message = JSON.parse(dataStr);
        
        // Handle ping/pong for heartbeat
        if (message.type === 'ping') {
          session.lastPing = Date.now();
          ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
          return;
        }

        // Validate relay message
        const relayMessage = wsMessageSchema.parse(message);
        
        // Find target session
        const targetSession = sessions.get(relayMessage.to);
        if (targetSession && targetSession.socket.readyState === WebSocket.OPEN) {
          targetSession.socket.send(JSON.stringify(relayMessage));
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
        ws.close(4002, 'Invalid message format');
      }
    });

    ws.on('close', () => {
      sessions.delete(sessionId);
      console.log(`WebSocket disconnected: ${sessionId}`);
    });

    ws.on('error', (error) => {
      console.error(`WebSocket error for ${sessionId}:`, error);
      sessions.delete(sessionId);
    });

    // Send initial ping
    ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
  });

  process.on('SIGTERM', () => {
    clearInterval(heartbeatInterval);
    wss.close();
  });
}

export function getActiveSessionsCount(): number {
  return sessions.size;
}
