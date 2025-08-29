# NEXO Security Documentation

## Threat Model

### Assets Protected

1. **Private Keys**: Ed25519 cosigner keys, user private keys
2. **Message Content**: E2EE encrypted communications
3. **Transparency Log**: Tamper-evident Merkle tree
4. **System Integrity**: Service availability and data consistency

### Threat Actors

- **Passive Adversary**: Traffic analysis, metadata collection
- **Active Adversary**: Man-in-the-middle, server compromise
- **Insider Threat**: Malicious administrators, compromised infrastructure
- **State Actor**: Legal compulsion, infrastructure targeting

### Attack Vectors

1. **Network**: TLS interception, DNS hijacking, DDoS
2. **Server**: Code injection, privilege escalation, data exfiltration  
3. **Client**: XSS, malware, key extraction
4. **Cryptographic**: Weak randomness, implementation flaws, key compromise

## Security Controls

### Transport Security

- **TLS 1.3**: Enforced for all HTTPS connections
- **Certificate Pinning**: Production deployments pin certificates
- **WebSocket Security**: WSS with same TLS requirements
- **CORS Policy**: Strict origin allowlist via `CORS_ORIGINS`

```bash
# Production CORS setup
export CORS_ORIGINS="https://nexo.chat,https://app.nexo.chat"
