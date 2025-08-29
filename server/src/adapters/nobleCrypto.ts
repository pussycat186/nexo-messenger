import { sha256, sha512 } from '@noble/hashes/sha2';
import * as ed25519 from '@noble/ed25519';
import { CryptoPort } from '../ports/crypto';

// Configure SHA-512 for ed25519 (required for the library to work)
// The @noble/ed25519 library needs SHA-512 for key operations
// @ts-ignore - accessing private property for configuration
(ed25519 as any).hashes.sha512 = sha512;
(ed25519 as any).hashes.sha512Sync = sha512;

class NobleCrypto implements CryptoPort {
  sha256(data: Uint8Array): Uint8Array {
    return sha256(data);
  }

  base64Encode(data: Uint8Array): string {
    return Buffer.from(data).toString('base64');
  }

  base64Decode(data: string): Uint8Array {
    return new Uint8Array(Buffer.from(data, 'base64'));
  }

  ed25519Sign(message: Uint8Array, privateKey: Uint8Array): Uint8Array {
    return ed25519.sign(message, privateKey);
  }

  ed25519Verify(message: Uint8Array, signature: Uint8Array, publicKey: Uint8Array): boolean {
    return ed25519.verify(signature, message, publicKey);
  }

  ed25519GenerateKeyPair(): { privateKey: Uint8Array; publicKey: Uint8Array } {
    const privateKey = ed25519.utils.randomSecretKey();
    const publicKey = ed25519.getPublicKey(privateKey);
    return { privateKey, publicKey };
  }
}

let cryptoInstance: NobleCrypto;

export function getCrypto(): CryptoPort {
  if (!cryptoInstance) {
    cryptoInstance = new NobleCrypto();
  }
  return cryptoInstance;
}
