import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import * as fs from 'fs';
import * as path from 'path';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Ensure data directories exist
const dataDir = path.join(process.cwd(), 'server', '_data');
const secretsDir = path.join(process.cwd(), 'server', '_secrets', 'dev_cosigners');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
  log(`Created data directory: ${dataDir}`);
}

if (!fs.existsSync(secretsDir)) {
  fs.mkdirSync(secretsDir, { recursive: true });
  log(`Created secrets directory: ${secretsDir}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api") || path.startsWith("/health") || path.startsWith("/did") || path.startsWith("/sth") || path.startsWith("/metrics")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    log(`Error: ${status} ${message}`);
    res.status(status).json({ message });
  });

  // Setup vite in development, serve static in production
  // Note: Vite setup disabled due to path-to-regexp compatibility issue with "*" route pattern
  if (app.get("env") === "development") {
    // Skip vite setup for now due to route pattern issue
    console.log("Development mode detected, but Vite setup skipped due to route pattern compatibility issue");
  } else {
    // serveStatic(app);
    console.log("Production mode detected, but static serving skipped");
  }

  // Serve on specified port, default to 5000
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`NEXO server running on port ${port}`);
    log(`Environment: ${app.get("env")}`);
    log(`Backend: edge-ts (TypeScript/Node.js)`);
  });
})();
