import { useState, useEffect, useRef } from 'react';
import { WSMessage } from '@shared/schema';

export interface WebSocketHook {
  send: (message: Omit<WSMessage, 'from'>) => void;
  lastMessage: WSMessage | null;
  connectionState: WebSocket['readyState'];
  connect: () => void;
  disconnect: () => void;
}

export function useWebSocket(sessionId: string): WebSocketHook | null {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [lastMessage, setLastMessage] = useState<WSMessage | null>(null);
  const [connectionState, setConnectionState] = useState<WebSocket['readyState']>(WebSocket.CLOSED);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const pingIntervalRef = useRef<NodeJS.Timeout>();

  const connect = () => {
    if (socket?.readyState === WebSocket.OPEN) {
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/${sessionId}`;
    
    console.log(`Connecting to WebSocket: ${wsUrl}`);
    
    try {
      const newSocket = new WebSocket(wsUrl);
      
      newSocket.onopen = () => {
        console.log('WebSocket connected');
        setConnectionState(WebSocket.OPEN);
        
        // Start heartbeat
        pingIntervalRef.current = setInterval(() => {
          if (newSocket.readyState === WebSocket.OPEN) {
            newSocket.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }));
          }
        }, 30000);
      };

      newSocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          // Handle pong response
          if (data.type === 'pong') {
            return;
          }
          
          // Handle relay messages
          if (data.from && data.to && data.payload) {
            setLastMessage(data as WSMessage);
          }
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      newSocket.onclose = () => {
        console.log('WebSocket disconnected');
        setConnectionState(WebSocket.CLOSED);
        
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
        }

        // Auto-reconnect after 5 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 5000);
      };

      newSocket.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionState(WebSocket.CLOSED);
      };

      setSocket(newSocket);
      setConnectionState(WebSocket.CONNECTING);
    } catch (error) {
      console.error('Failed to create WebSocket:', error);
    }
  };

  const disconnect = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
    }
    
    socket?.close();
    setSocket(null);
    setConnectionState(WebSocket.CLOSED);
  };

  const send = (message: Omit<WSMessage, 'from'>) => {
    if (socket?.readyState === WebSocket.OPEN) {
      const fullMessage: WSMessage = {
        from: sessionId,
        ...message,
      };
      socket.send(JSON.stringify(fullMessage));
    }
  };

  useEffect(() => {
    connect();
    
    return () => {
      disconnect();
    };
  }, [sessionId]);

  if (!sessionId) {
    return null;
  }

  return {
    send,
    lastMessage,
    connectionState,
    connect,
    disconnect,
  };
}
