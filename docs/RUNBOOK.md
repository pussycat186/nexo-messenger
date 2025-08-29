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
```

## CI/CD Pipeline

The project includes comprehensive GitHub Actions workflows for automated testing and deployment.

### Continuous Integration

**Available Workflows:**

1. **test-rust.yml** - Rust/Cargo testing pipeline
   - Runs on push/PR to main branch
   - Formatting check with `cargo fmt`
   - Linting with `cargo clippy` 
   - Build verification and test execution
   - Security audit with `cargo audit`

2. **test-web.yml** - Node.js/TypeScript testing pipeline  
   - Runs on push/PR to main branch
   - TypeScript compilation check
   - ESLint code quality checks
   - Build verification for client and server
   - Optional test suite execution

3. **ci-all.yml** - Meta-workflow for pull requests
   - Aggregates all CI check results
   - Required for merge approval
   - Single status indicator for reviewers

### Release Pipeline

**release.yml** - Automated release on version tags

Triggered by pushing a semantic version tag (e.g., `v1.0.0`):

```bash
git tag v1.0.0
git push origin v1.0.0
```

**Release Artifacts:**
- `nexo-core-linux-x86_64` - Production Rust binary  
- `nexo-web-dist.tar.gz` - Web client distribution files
- GitHub release with auto-generated changelog

### Development Workflow

**Local Development:**
```bash
# Install dependencies
npm ci

# Type check
npm run check

# Lint code (if available)
npm run lint

# Build project  
npm run build

# Run smoke tests
npm run test:smoke
```

**Pre-commit Checks:**
- All TypeScript files must pass type checking
- ESLint rules must pass (warnings allowed)
- Rust code must pass `cargo fmt` and `cargo clippy`

**Branch Protection:**
- `main` branch requires PR with CI checks passing
- All workflows in `ci-all.yml` must succeed
- Automatic security audit on dependencies

### Production Deployment

**Manual Release Process:**
1. Update version in appropriate files
2. Create and push semantic version tag
3. GitHub Actions automatically builds and releases
4. Download artifacts from GitHub Releases
5. Deploy using Docker or binary

**Monitoring:**
- Health endpoint: `/health`
- Metrics endpoint: `/metrics` (Prometheus format)
- WebSocket connection status via admin interface
