import * as fs from 'fs/promises';
import * as path from 'path';
import { CosignPort } from '../ports/cosign';
import { getCrypto } from './nobleCrypto';

interface CosignerKey {
  id: string;
  privateKey: Uint8Array;
  publicKey: Uint8Array;
}

class CosignEnv implements CosignPort {
  private keys: CosignerKey[] = [];
  private crypto = getCrypto();

  async loadKeys(): Promise<CosignerKey[]> {
    if (this.keys.length > 0) return this.keys;

    const keys: CosignerKey[] = [];
    
    for (let i = 0; i < 3; i++) {
      const envKey = process.env[`COSIGNER_${i}_SK`];
      let privateKey: Uint8Array;
      
      if (envKey) {
        privateKey = this.crypto.base64Decode(envKey);
      } else {
        // Auto-generate dev key
        const keyPair = this.crypto.ed25519GenerateKeyPair();
        privateKey = keyPair.privateKey;
        
        // Save to dev secrets
        const secretsDir = path.join(process.cwd(), 'server', '_secrets', 'dev_cosigners');
        await fs.mkdir(secretsDir, { recursive: true });
        const keyFile = path.join(secretsDir, `cosigner_${i}.key`);
        await fs.writeFile(keyFile, this.crypto.base64Encode(privateKey));
        console.log(`Generated dev cosigner key: ${keyFile}`);
      }
      
      const publicKey = this.crypto.base64Decode(this.crypto.base64Encode(privateKey.slice(32))); // Ed25519 public key is last 32 bytes
      
      keys.push({
        id: `cosigner_${i}`,
        privateKey,
        publicKey,
      });
    }
    
    this.keys = keys;
    return keys;
  }

  async signSTH(sthHash: Uint8Array): Promise<{ cosigner: string; sig: string }[]> {
    const keys = await this.loadKeys();
    const signatures: { cosigner: string; sig: string }[] = [];
    
    // Sign with available keys (simulate that at least 2 are available)
    for (let i = 0; i < Math.min(keys.length, 3); i++) {
      try {
        const signature = this.crypto.ed25519Sign(sthHash, keys[i].privateKey);
        signatures.push({
          cosigner: keys[i].id,
          sig: this.crypto.base64Encode(signature),
        });
        
        if (signatures.length >= 2) break; // We have threshold
      } catch (error) {
        console.error(`Failed to sign with ${keys[i].id}:`, error);
      }
    }
    
    return signatures;
  }

  verifyThreshold(
    sthHash: Uint8Array, 
    signatures: { cosigner: string; sig: string }[], 
    t = 2, 
    n = 3
  ): boolean {
    if (signatures.length < t) return false;
    
    let validCount = 0;
    
    for (const sig of signatures) {
      const cosignerIndex = parseInt(sig.cosigner.split('_')[1]);
      if (cosignerIndex < 0 || cosignerIndex >= this.keys.length) continue;
      
      try {
        const signature = this.crypto.base64Decode(sig.sig);
        const publicKey = this.keys[cosignerIndex].publicKey;
        
        if (this.crypto.ed25519Verify(sthHash, signature, publicKey)) {
          validCount++;
        }
      } catch (error) {
        console.error(`Signature verification failed for ${sig.cosigner}:`, error);
      }
    }
    
    return validCount >= t;
  }
}

let cosignInstance: CosignEnv;

export function getCosigner(): CosignPort {
  if (!cosignInstance) {
    cosignInstance = new CosignEnv();
  }
  return cosignInstance;
}
