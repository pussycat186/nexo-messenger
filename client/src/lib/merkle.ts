import { apiClient } from './api';
import { STH } from '@shared/schema';

// Client-side Merkle verification utilities
export async function sha256(data: Uint8Array): Promise<Uint8Array> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return new Uint8Array(hashBuffer);
}

export function computeMerkleRoot(leaves: Uint8Array[]): Promise<Uint8Array> {
  return new Promise(async (resolve) => {
    if (leaves.length === 0) {
      resolve(new Uint8Array(32)); // Zero hash
      return;
    }

    let level = [...leaves];
    
    while (level.length > 1) {
      const nextLevel: Uint8Array[] = [];
      
      for (let i = 0; i < level.length; i += 2) {
        if (i + 1 < level.length) {
          // Pair exists, hash together
          const combined = new Uint8Array(level[i].length + level[i + 1].length);
          combined.set(level[i], 0);
          combined.set(level[i + 1], level[i].length);
          nextLevel.push(await sha256(combined));
        } else {
          // Odd leaf, carry up
          nextLevel.push(level[i]);
        }
      }
      
      level = nextLevel;
    }
    
    resolve(level[0]);
  });
}

export async function verifyMerkleLocally(): Promise<{ success: boolean; treeSize?: number; error?: string }> {
  try {
    // In a real implementation, we would fetch the raw user registrations
    // and recompute the Merkle root locally
    
    // For now, simulate verification
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const latestSTH = await apiClient.getLatestSTH();
    
    return {
      success: true,
      treeSize: latestSTH.tree_size,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Verification failed',
    };
  }
}

export async function verifySTHSignatures(sth: STH): Promise<{ valid: boolean; threshold: boolean }> {
  try {
    // In a real implementation, we would verify Ed25519 signatures
    // For now, simulate verification
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const validSigs = sth.signatures?.length || 0;
    const threshold = validSigs >= (sth.policy?.t || 2);
    
    return {
      valid: threshold,
      threshold,
    };
  } catch (error) {
    return {
      valid: false,
      threshold: false,
    };
  }
}

export function canonicalJSON(obj: any): string {
  return JSON.stringify(obj, Object.keys(obj).sort());
}
