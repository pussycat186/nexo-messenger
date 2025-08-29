import type { Express } from "express";
import { createServer, type Server } from "http";
import { healthHandler } from "./src/routes/health";
import { registerHandler } from "./src/routes/register";
import { sthLatestHandler, sthChainHandler } from "./src/routes/sth";
import { setupWebSocketRelay } from "./src/ws/relay";
import { metricsHandler } from "./src/metrics/metrics";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // Health endpoint
  app.get('/health', healthHandler);

  // DID registration endpoint
  app.post('/did/register', registerHandler);

  // STH endpoints
  app.get('/sth/latest', sthLatestHandler);
  app.get('/sth/chain', sthChainHandler);

  // Metrics endpoint
  app.get('/metrics', metricsHandler);

  // Setup WebSocket relay
  setupWebSocketRelay(httpServer);

  return httpServer;
}
