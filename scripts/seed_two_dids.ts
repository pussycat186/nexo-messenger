import { getCrypto } from '../server/src/adapters/nobleCrypto';

const SMOKE_URL = process.env.SMOKE_URL || 'http://127.0.0.1:5000';

async function seedTwoDIDs(): Promise<void> {
  console.log('🌱 Seeding two test DIDs...');
  
  const crypto = getCrypto();
  const baseUrl = SMOKE_URL.replace(/\/$/, '');

  for (let i = 0; i < 2; i++) {
    const keyPair = crypto.ed25519GenerateKeyPair();
    const publicKeyB64 = crypto.base64Encode(keyPair.publicKey);
    const timestamp = Math.floor(Date.now() / 1000);
    
    // Create DID identifier
    const didId = `did:key:z${crypto.base64Encode(keyPair.publicKey).substring(0, 16).replace(/[+/=]/g, '')}`;
    
    const registration = {
      id: didId,
      public_key: publicKeyB64,
      timestamp,
    };

    console.log(`Registering DID ${i + 1}: ${didId}`);
    
    const response = await fetch(`${baseUrl}/did/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(registration),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to register DID ${i + 1}: ${response.status} ${errorText}`);
    }
    
    const result = await response.json();
    console.log(`✅ DID ${i + 1} registered successfully. Tree size: ${result.tree_size}`);
  }
  
  console.log('🌱 Seeding completed');
}

// Run if called directly
if (require.main === module) {
  seedTwoDIDs().catch((error) => {
    console.error('Seeding failed:', error);
    process.exit(1);
  });
}

export { seedTwoDIDs };
