import { TransportPort } from '../ports/transport';
import { getActiveSessionsCount } from '../ws/relay';

class WSTransport implements TransportPort {
  async broadcast(sessionId: string, message: any): Promise<void> {
    // Implementation would depend on the relay setup
    console.log(`Broadcasting to ${sessionId}:`, message);
  }

  getActiveConnections(): number {
    return getActiveSessionsCount();
  }
}

let transportInstance: WSTransport;

export function getTransport(): TransportPort {
  if (!transportInstance) {
    transportInstance = new WSTransport();
  }
  return transportInstance;
}
