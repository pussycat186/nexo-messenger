import * as fs from 'fs/promises';
import * as path from 'path';
import { getCrypto } from '../server/src/adapters/nobleCrypto';
import { computeMerkleRoot } from '../server/src/merkle/tree';
import { userRegistrationSchema } from '@shared/schema';

const SMOKE_URL = process.env.SMOKE_URL || 'http://127.0.0.1:5000';

async function auditMerkleTree(): Promise<void> {
  console.log('🔍 Independent Merkle Tree Audit');
  console.log('==================================');
  
  const crypto = getCrypto();
  const baseUrl = SMOKE_URL.replace(/\/$/, '');
  
  try {
    // 1. Read raw user registrations from local file
    const usersFile = path.join(process.cwd(), 'server', '_data', 'users.jsonl');
    
    let userRegistrations: any[] = [];
    try {
      const usersData = await fs.readFile(usersFile, 'utf-8');
      const lines = usersData.trim().split('\n').filter(line => line.trim());
      userRegistrations = lines.map(line => userRegistrationSchema.parse(JSON.parse(line)));
      console.log(`📁 Read ${userRegistrations.length} user registrations from local file`);
    } catch (error) {
      console.log('📁 No local users.jsonl found, audit skipped');
      return;
    }

    // 2. Recompute leaf hashes
    const leaves: Uint8Array[] = [];
    for (const user of userRegistrations) {
      const idBytes = new TextEncoder().encode(user.id);
      const publicKeyBytes = crypto.base64Decode(user.public_key);
      const timestampBytes = new ArrayBuffer(8);
      new DataView(timestampBytes).setBigUint64(0, BigInt(user.timestamp), false); // big-endian
      
      const leafData = new Uint8Array(idBytes.length + publicKeyBytes.length + 8);
      leafData.set(idBytes, 0);
      leafData.set(publicKeyBytes, idBytes.length);
      leafData.set(new Uint8Array(timestampBytes), idBytes.length + publicKeyBytes.length);
      
      const leafHash = crypto.sha256(leafData);
      leaves.push(leafHash);
    }

    // 3. Compute Merkle root
    const computedRoot = computeMerkleRoot(leaves, crypto);
    const computedRootB64 = crypto.base64Encode(computedRoot);
    
    console.log(`🌳 Computed Merkle root: ${computedRootB64}`);

    // 4. Fetch latest STH from server
    const sthResponse = await fetch(`${baseUrl}/sth/latest`);
    if (!sthResponse.ok) {
      throw new Error(`Failed to fetch latest STH: ${sthResponse.status}`);
    }
    
    const latestSTH = await sthResponse.json();
    console.log(`📡 Server STH root: ${latestSTH.root}`);
    console.log(`📊 Tree sizes - Local: ${leaves.length}, Server: ${latestSTH.tree_size}`);

    // 5. Compare roots
    if (computedRootB64 === latestSTH.root && leaves.length === latestSTH.tree_size) {
      console.log('✅ MERKLE AUDIT PASSED - Roots match perfectly!');
    } else {
      console.log('❌ MERKLE AUDIT FAILED - Root mismatch detected!');
      console.log(`   Expected: ${computedRootB64}`);
      console.log(`   Got:      ${latestSTH.root}`);
      throw new Error('Merkle audit failed');
    }

    // 6. Verify STH signature count meets threshold
    const signatures = latestSTH.signatures || [];
    const threshold = latestSTH.policy?.t || 2;
    
    if (signatures.length >= threshold) {
      console.log(`✅ STH signatures: ${signatures.length}/${latestSTH.policy?.n || 3} (threshold: ${threshold})`);
    } else {
      throw new Error(`Insufficient STH signatures: ${signatures.length} < ${threshold}`);
    }
    
  } catch (error) {
    console.error('Audit failed:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  auditMerkleTree().catch((error) => {
    console.error('Audit failed:', error);
    process.exit(1);
  });
}

export { auditMerkleTree };
