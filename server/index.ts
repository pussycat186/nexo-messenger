import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from "url";

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

  // [ci-fix-static-ui] begin
  const __filename = fileURLToPath(import.meta.url);
  const __dirname  = path.dirname(__filename);

  const candidates = [
    path.resolve(__dirname, "../dist/public"),
    path.resolve(__dirname, "../dist"),
    path.resolve(__dirname, "../build"),
    path.resolve(__dirname, "../../dist"),
    path.resolve(__dirname, "../../build"),
  ];
  let staticRoot: string | null = null;
  for (const p of candidates) {
    try {
      if (fs.existsSync(path.join(p, "index.html"))) { staticRoot = p; break; }
    } catch {}
  }
  if (staticRoot) {
    console.log(`[express] static UI root = ${staticRoot}`);
    // IMPORTANT: place AFTER API routes, BEFORE any 404 handler:
    app.use(express.static(staticRoot));
    // SPA fallback: serve index.html for any GET request that didn't match a file
    app.use((req, res, next) => {
      if (req.method === 'GET' && !req.path.startsWith('/api') && !req.path.startsWith('/health') && !req.path.startsWith('/did') && !req.path.startsWith('/sth') && !req.path.startsWith('/metrics') && !req.path.startsWith('/ws')) {
        res.sendFile(path.join(staticRoot!, "index.html"));
      } else {
        next();
      }
    });
  } else {
    console.warn("[express] No built UI found — run `npm run build` to generate dist/");
  }
  // [ci-fix-static-ui] end

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
