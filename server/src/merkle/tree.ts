import { CryptoPort } from '../ports/crypto';

export function computeMerkleRoot(leaves: Uint8Array[], crypto: CryptoPort): Uint8Array {
  if (leaves.length === 0) {
    return new Uint8Array(32); // Zero hash for empty tree
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
        nextLevel.push(crypto.sha256(combined));
      } else {
        // Odd leaf, carry up
        nextLevel.push(level[i]);
      }
    }
    
    level = nextLevel;
  }
  
  return level[0];
}

export function verifyMerkleProof(
  leafHash: Uint8Array,
  proof: Uint8Array[],
  index: number,
  root: Uint8Array,
  crypto: CryptoPort
): boolean {
  let current = leafHash;
  let currentIndex = index;
  
  for (const sibling of proof) {
    const combined = new Uint8Array(current.length + sibling.length);
    
    if (currentIndex % 2 === 0) {
      // Current is left, sibling is right
      combined.set(current, 0);
      combined.set(sibling, current.length);
    } else {
      // Current is right, sibling is left
      combined.set(sibling, 0);
      combined.set(current, sibling.length);
    }
    
    current = crypto.sha256(combined);
    currentIndex = Math.floor(currentIndex / 2);
  }
  
  return arrayEqual(current, root);
}

function arrayEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}
