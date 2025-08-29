import { Request, Response } from 'express';
import { didRegistrationSchema, userRegistrationSchema } from '@shared/schema';
import { storage } from '../../storage';
import { getCrypto } from '../adapters/nobleCrypto';
import { computeMerkleRoot } from '../merkle/tree';
import { getCosigner } from '../adapters/cosignEnv';
import { canonicalJSON } from '../merkle/canonical';

export async function registerHandler(req: Request, res: Response) {
  try {
    // Validate input
    const registration = didRegistrationSchema.parse(req.body);
    
    const crypto = getCrypto();
    
    // Decode public key to verify it's 32 bytes
    const publicKeyBytes = crypto.base64Decode(registration.public_key);
    if (publicKeyBytes.length !== 32) {
      return res.status(400).json({ message: 'Public key must be exactly 32 bytes' });
    }

    // Compute leaf hash: sha256(id || public_key || timestamp)
    const idBytes = new TextEncoder().encode(registration.id);
    const timestampBytes = new ArrayBuffer(8);
    new DataView(timestampBytes).setBigUint64(0, BigInt(registration.timestamp), false); // big-endian
    
    const leafData = new Uint8Array(idBytes.length + publicKeyBytes.length + 8);
    leafData.set(idBytes, 0);
    leafData.set(publicKeyBytes, idBytes.length);
    leafData.set(new Uint8Array(timestampBytes), idBytes.length + publicKeyBytes.length);
    
    const leafHash = crypto.sha256(leafData);
    const leafHashB64 = crypto.base64Encode(leafHash);

    // Store user registration
    const userReg = {
      id: registration.id,
      public_key: registration.public_key,
      timestamp: registration.timestamp,
      leaf_hash: leafHashB64,
    };
    
    await storage.appendUserRegistration(userReg);

    // Recompute Merkle root
    const allUsers = await storage.listUserRegistrations();
    const leaves = allUsers.map(u => crypto.base64Decode(u.leaf_hash));
    const merkleRoot = computeMerkleRoot(leaves, crypto);
    
    // Get previous STH for prev_hash
    const prevSTH = await storage.getLatestSTH();
    let prevHash = '';
    if (prevSTH) {
      const sthWithoutSigs = { ...prevSTH };
      delete (sthWithoutSigs as any).signatures;
      prevHash = crypto.base64Encode(crypto.sha256(new TextEncoder().encode(canonicalJSON(sthWithoutSigs))));
    }

    // Create new STH
    const newSTH = {
      tree_size: allUsers.length,
      root: crypto.base64Encode(merkleRoot),
      prev_hash: prevHash,
      policy: { t: 2, n: 3 },
      timestamp: Math.floor(Date.now() / 1000),
      signatures: [] as any[],
    };

    // Sign STH with available cosigners
    const cosigner = getCosigner();
    const sthWithoutSigs = { ...newSTH };
    delete (sthWithoutSigs as any).signatures;
    const sthHash = crypto.sha256(new TextEncoder().encode(canonicalJSON(sthWithoutSigs)));
    
    const signatures = await cosigner.signSTH(sthHash);
    newSTH.signatures = signatures;

    // Store new STH
    await storage.appendSTH(newSTH);

    res.status(201).json({ message: 'DID registered successfully', tree_size: newSTH.tree_size });
  } catch (error) {
    console.error('Registration failed:', error);
    if (error instanceof Error && error.message.includes('validation')) {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Registration failed' });
  }
}
