# NEXO Operational Runbook

## Quick Start

### Replit Deployment (Recommended for Development)

1. **Fork and Deploy**
   ```bash
   git clone https://github.com/nexo/nexo
   cd nexo
   npm install
   npm run dev
   ```

2. **Environment Setup**
   ```bash
   cp .env.sample .env
   # Edit .env with your configuration
   ```

3. **Verify Deployment**
   ```bash
   scripts/smoke.sh https://your-replit-url.replit.app
   ```

### Docker Production Deployment

1. **TypeScript Edge (Lighter)**
   ```bash
   docker compose --profile edge up -d
   ```

2. **Rust Core (Performance)**
   ```bash
   docker compose --profile rust up -d
   ```

3. **With Reverse Proxy**
   ```bash
   docker compose --profile rust --profile proxy up -d
   ```

## Backend Selection

NEXO supports dual-core architecture:

- **edge-ts**: TypeScript/Node.js (default for Replit)
- **core-rust**: Rust/Axum (production performance)

Switch backends via environment variable:
```bash
export BACKEND=core-rust
docker compose --profile rust up -d
