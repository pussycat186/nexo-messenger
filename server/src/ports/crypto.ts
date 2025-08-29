export interface CryptoPort {
  sha256(data: Uint8Array): Uint8Array;
  base64Encode(data: Uint8Array): string;
  base64Decode(data: string): Uint8Array;
  ed25519Sign(message: Uint8Array, privateKey: Uint8Array): Uint8Array;
  ed25519Verify(message: Uint8Array, signature: Uint8Array, publicKey: Uint8Array): boolean;
  ed25519GenerateKeyPair(): { privateKey: Uint8Array; publicKey: Uint8Array };
}
