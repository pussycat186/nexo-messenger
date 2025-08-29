export interface CosignPort {
  loadKeys(): Promise<{ id: string; privateKey: Uint8Array; publicKey: Uint8Array }[]>;
  signSTH(sthHash: Uint8Array): Promise<{ cosigner: string; sig: string }[]>;
  verifyThreshold(sthHash: Uint8Array, signatures: { cosigner: string; sig: string }[], t?: number, n?: number): boolean;
}
