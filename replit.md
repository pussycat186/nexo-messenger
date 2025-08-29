# Overview

NEXO is an enterprise-grade messenger built with privacy-by-default principles, featuring end-to-end encryption and auditable transparency through a cryptographic Merkle tree. The application implements a dual-architecture approach using TypeScript for rapid development and Rust for high-performance production deployments. The system provides real-time messaging capabilities with WebSocket communication, a transparency log with 2-of-3 multi-signature verification, and comprehensive monitoring and audit tools.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture

The client is built with **React + TypeScript + Vite** using a modern component-based architecture:

- **UI Framework**: React with TypeScript for type safety
- **Styling**: Tailwind CSS with shadcn/ui component library for consistent design
- **State Management**: TanStack Query for server state and local React state for UI
- **Routing**: Wouter for lightweight client-side routing
- **Build Tool**: Vite for fast development and optimized production builds

The frontend follows a hexagonal architecture pattern with clear separation between:
- Pages (`/chat`, `/admin`, `/audit`) for different application views
- Reusable UI components in the shadcn/ui system
- Transport abstraction for future WebTransport/QUIC support
- Crypto utilities for client-side cryptographic operations

## Backend Architecture

The server implements a **ports and adapters (hexagonal) architecture** to enable easy migration between TypeScript and Rust implementations:

### Core Ports
- **StoragePort**: Abstracts data persistence (user registrations, STH records)
- **CryptoPort**: Handles cryptographic operations (Ed25519, SHA-256, base64)
- **CosignPort**: Manages 2-of-3 multi-signature verification
- **TransportPort**: Abstracts real-time communication layer

### Current Adapters
- **FileStore**: JSONL-based append-only storage for development
- **NobleCrypto**: Implementation using @noble cryptographic libraries
- **CosignEnv**: Environment-based cosigner key management
- **WSTransport**: WebSocket-based real-time messaging

### API Design
The REST API provides these core endpoints:
- `GET /health` - System status and metrics
- `POST /did/register` - User registration with public key
- `GET /sth/latest` - Latest signed tree head
- `GET /sth/chain` - Historical STH chain
- `WS /ws/{session_id}` - Real-time message relay

## Cryptographic Implementation

**Merkle Tree Transparency**:
- Leaf computation: `sha256(id || public_key || timestamp)`
- Binary tree with odd-leaf carry-up strategy
- Root hash provides tamper-evident verification

**Multi-Signature Verification**:
- 2-of-3 Ed25519 signature scheme
- Cosigner keys loaded from environment or auto-generated for development
- STH signing uses canonical JSON representation

**End-to-End Encryption**:
- Ed25519 + ChaCha20-Poly1305 for message encryption
- Client-side key generation and management
- Server only relays opaque encrypted payloads

## Data Storage

**Development Storage**:
- Append-only JSONL files in `server/_data/`
- Atomic writes with compaction utilities
- Gitignored secrets in `server/_secrets/dev_cosigners/`

**Production Ready**:
- Drizzle ORM configuration for PostgreSQL migration
- Same storage interface enables seamless database switching
- Connection pooling and transaction support

## Real-Time Communication

**WebSocket Implementation**:
- Session-based message routing
- Heartbeat mechanism for connection health
- Backpressure handling for high-volume scenarios

**Future Transport Options**:
- WebTransport/QUIC interface prepared
- Transport abstraction enables protocol upgrades
- Maintains API compatibility across transport layers

## Observability and Operations

**Metrics Collection**:
- Prometheus-compatible `/metrics` endpoint
- Key metrics: user count, STH count, active WebSocket sessions
- Performance and health monitoring

**Security Hardening**:
- CORS origin allowlisting
- Rate limiting and payload size constraints
- TLS-only production deployment requirements

## Cross-Platform Strategy

**Current**: Web application with responsive design
**Planned**: 
- **Mobile**: React Native with Expo (skeleton in `/mobile/`)
- **Desktop**: Tauri-based native wrapper (skeleton in `/desktop/`)
- **Shared Libraries**: Crypto and transport logic reused across platforms

# External Dependencies

## Core Runtime Dependencies
- **@noble/curves** and **@noble/hashes** - Cryptographic primitives (Ed25519, SHA-256)
- **@tanstack/react-query** - Server state management and caching
- **express** - HTTP server framework
- **ws** - WebSocket server implementation
- **drizzle-kit** and **@neondatabase/serverless** - Database ORM and connection

## UI and Styling
- **@radix-ui/react-*** - Accessible component primitives
- **tailwindcss** - Utility-first CSS framework
- **class-variance-authority** - Component variant management
- **lucide-react** - Icon library

## Development and Build Tools
- **vite** - Frontend build tool and development server
- **typescript** - Type checking and compilation
- **tsx** - TypeScript execution for Node.js
- **esbuild** - JavaScript bundler for production builds

## Cross-Platform Extensions
- **expo** - React Native development platform (mobile)
- **@tauri-apps/api** - Desktop native API access (future)

## Database and Storage
- **PostgreSQL** - Production database (via Drizzle configuration)
- **JSONL files** - Development storage format
- Database URL configured via `DATABASE_URL` environment variable

## Security and Monitoring
- **Prometheus metrics format** - Observability standard
- **TLS 1.3** - Transport security requirements
- **Environment-based secrets** - Cosigner key management

The architecture prioritizes modularity and migration flexibility, enabling the system to evolve from development to enterprise production environments while maintaining API compatibility and security guarantees.