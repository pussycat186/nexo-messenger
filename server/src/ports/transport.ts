export interface TransportPort {
  // WebSocket transport interface
  broadcast(sessionId: string, message: any): Promise<void>;
  getActiveConnections(): number;
  
  // Future: WebTransport/QUIC
  // setupQuicTransport?(): Promise<void>;
}
