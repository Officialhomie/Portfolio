/**
 * Secure Biometric Credential Storage using IndexedDB
 * 
 * Why IndexedDB over localStorage:
 * - Not accessible via simple script injection
 * - Async API (harder to exploit)
 * - Supports structured data and ArrayBuffers
 * - Much larger storage capacity
 * - Standard for auth frameworks
 */

import Dexie, { type EntityTable } from 'dexie';

/**
 * Biometric Credential stored in IndexedDB
 */
export interface BiometricCredential {
  id: number; // Auto-incrementing primary key
  credentialId: string; // Base64url-encoded credential ID
  publicKeyX: string; // Hex-encoded public key X coordinate (0x...)
  publicKeyY: string; // Hex-encoded public key Y coordinate (0x...)
  walletAddress: string; // Deterministic smart wallet address
  createdAt: number; // Timestamp
  lastUsedAt: number; // Timestamp
  deviceInfo?: string; // Optional: Device/browser info
}

/**
 * Dexie database for biometric credentials
 */
class BiometricDB extends Dexie {
  credentials!: EntityTable<BiometricCredential, 'id'>;

  constructor() {
    super('BiometricWalletDB');
    
    this.version(1).stores({
      credentials: '++id, credentialId, walletAddress, createdAt, lastUsedAt',
    });
  }
}

// Singleton instance
const db = new BiometricDB();

/**
 * Store biometric credential in IndexedDB
 */
export async function storeCredential(data: {
  credentialId: string;
  publicKeyX: string;
  publicKeyY: string;
  walletAddress: string;
}): Promise<number> {
  const now = Date.now();
  
  // Check if credential already exists
  const existing = await db.credentials
    .where('credentialId')
    .equals(data.credentialId)
    .first();
  
  if (existing) {
    // Update existing credential
    await db.credentials.update(existing.id, {
      lastUsedAt: now,
      walletAddress: data.walletAddress, // Update in case it changed
    });
    console.log('✅ Updated existing credential in IndexedDB');
    return existing.id;
  }
  
  // Create new credential
  const id = await db.credentials.add({
    id: 0, // Will be auto-assigned
    credentialId: data.credentialId,
    publicKeyX: data.publicKeyX,
    publicKeyY: data.publicKeyY,
    walletAddress: data.walletAddress,
    createdAt: now,
    lastUsedAt: now,
    deviceInfo: navigator.userAgent,
  });
  
  console.log('✅ Stored new credential in IndexedDB');
  console.log('   ID:', id);
  console.log('   Credential ID:', data.credentialId.substring(0, 20) + '...');
  console.log('   Wallet Address:', data.walletAddress);
  
  return id as number;
}

/**
 * Get the most recent biometric credential
 */
export async function getCredential(): Promise<BiometricCredential | null> {
  const credential = await db.credentials
    .orderBy('lastUsedAt')
    .reverse()
    .first();
  
  return credential || null;
}

/**
 * Get credential by ID
 */
export async function getCredentialById(id: number): Promise<BiometricCredential | null> {
  return await db.credentials.get(id) || null;
}

/**
 * Get credential by credentialId
 */
export async function getCredentialByCredentialId(credentialId: string): Promise<BiometricCredential | null> {
  return await db.credentials
    .where('credentialId')
    .equals(credentialId)
    .first() || null;
}

/**
 * Get credential by wallet address
 */
export async function getCredentialByWalletAddress(address: string): Promise<BiometricCredential | null> {
  return await db.credentials
    .where('walletAddress')
    .equals(address.toLowerCase())
    .first() || null;
}

/**
 * Check if any credential exists
 */
export async function hasCredential(): Promise<boolean> {
  const count = await db.credentials.count();
  return count > 0;
}

/**
 * Update last used timestamp
 */
export async function updateLastUsed(credentialId: string): Promise<void> {
  const credential = await getCredentialByCredentialId(credentialId);
  if (credential) {
    await db.credentials.update(credential.id, {
      lastUsedAt: Date.now(),
    });
  }
}

/**
 * Delete a credential
 */
export async function deleteCredential(id: number): Promise<void> {
  await db.credentials.delete(id);
  console.log('🗑️  Deleted credential from IndexedDB:', id);
}

/**
 * Delete all credentials (use with caution!)
 */
export async function clearAllCredentials(): Promise<void> {
  await db.credentials.clear();
  console.log('🗑️  Cleared all credentials from IndexedDB');
}

/**
 * List all credentials
 */
export async function listCredentials(): Promise<BiometricCredential[]> {
  return await db.credentials.orderBy('lastUsedAt').reverse().toArray();
}

/**
 * Migrate from localStorage to IndexedDB
 * This ensures backward compatibility with existing users
 */
export async function migrateFromLocalStorage(): Promise<boolean> {
  // Check if we already have credentials in IndexedDB
  const hasIDB = await hasCredential();
  if (hasIDB) {
    console.log('✅ IndexedDB credentials already exist, skipping migration');
    return false;
  }
  
  // Check localStorage for old credentials
  const oldCredentialId = localStorage.getItem('biometric_credential_id');
  const oldPublicKeyJson = localStorage.getItem('biometric_public_key');
  
  if (!oldCredentialId || !oldPublicKeyJson) {
    console.log('ℹ️  No localStorage credentials to migrate');
    return false;
  }
  
  try {
    const oldPublicKey = JSON.parse(oldPublicKeyJson);
    
    if (!oldPublicKey.x || !oldPublicKey.y) {
      console.error('❌ Invalid public key format in localStorage');
      return false;
    }
    
    console.log('🔄 Migrating credentials from localStorage to IndexedDB...');
    
    // We don't have the wallet address in localStorage, so we'll compute it
    // For now, store without address and let it be computed later
    await storeCredential({
      credentialId: oldCredentialId,
      publicKeyX: oldPublicKey.x,
      publicKeyY: oldPublicKey.y,
      walletAddress: '', // Will be set when wallet is created
    });
    
    console.log('✅ Migration complete!');
    console.log('   You can now safely clear localStorage');
    
    return true;
  } catch (error) {
    console.error('❌ Migration failed:', error);
    return false;
  }
}

/**
 * Export database instance for advanced usage
 */
export { db };
