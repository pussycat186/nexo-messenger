// Transport layer abstraction for future WebTransport/QUIC support

export interface TransportMessage {
  from: string;
  to: string;
  payload: string;
}

export interface Transport {
  connect(sessionId: string): Promise<void>;
  disconnect(): Promise<void>;
  send(message: TransportMessage): Promise<void>;
  onMessage(callback: (message: TransportMessage) => void): void;
  getConnectionState(): 'connecting' | 'open' | 'closed';
}

// WebSocket Transport (current implementation)
export class WebSocketTransport implements Transport {
  private socket: WebSocket | null = null;
  private sessionId: string = '';
  private messageCallback: ((message: TransportMessage) => void) | null = null;

  async connect(sessionId: string): Promise<void> {
    this.sessionId = sessionId;
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/${sessionId}`;
    
    return new Promise((resolve, reject) => {
      this.socket = new WebSocket(wsUrl);
      
      this.socket.onopen = () => resolve();
      this.socket.onerror = (error) => reject(error);
      this.socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (this.messageCallback && message.from && message.to && message.payload) {
            this.messageCallback(message);
          }
        } catch (error) {
          console.error('Failed to parse message:', error);
        }
      };
    });
  }

  async disconnect(): Promise<void> {
    this.socket?.close();
    this.socket = null;
  }

  async send(message: TransportMessage): Promise<void> {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
    }
  }

  onMessage(callback: (message: TransportMessage) => void): void {
    this.messageCallback = callback;
  }

  getConnectionState(): 'connecting' | 'open' | 'closed' {
    switch (this.socket?.readyState) {
      case WebSocket.CONNECTING:
        return 'connecting';
      case WebSocket.OPEN:
        return 'open';
      default:
        return 'closed';
    }
  }
}

// Future: WebTransport implementation
export class WebTransportImpl implements Transport {
  async connect(sessionId: string): Promise<void> {
    throw new Error('WebTransport not implemented yet');
  }

  async disconnect(): Promise<void> {
    throw new Error('WebTransport not implemented yet');
  }

  async send(message: TransportMessage): Promise<void> {
    throw new Error('WebTransport not implemented yet');
  }

  onMessage(callback: (message: TransportMessage) => void): void {
    throw new Error('WebTransport not implemented yet');
  }

  getConnectionState(): 'connecting' | 'open' | 'closed' {
    return 'closed';
  }
}
