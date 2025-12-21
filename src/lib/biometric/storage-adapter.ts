/**
 * Storage Adapter for Biometric Credentials
 * Provides backward-compatible interface while using IndexedDB
 */

import {
  getCredential,
  storeCredential,
  hasCredential,
  clearAllCredentials as clearIDB,
  migrateFromLocalStorage,
  updateLastUsed,
} from './storage';

/**
 * Store biometric credential (IndexedDB + localStorage fallback)
 */
export async function storeBiometricCredentialSecure(
  credentialId: string,
  publicKeyX: string,
  publicKeyY: string,
  walletAddress: string = ''
): Promise<void> {
  // Store in IndexedDB (primary)
  await storeCredential({
    credentialId,
    publicKeyX,
    publicKeyY,
    walletAddress,
  });
  
  // Also keep in localStorage for backward compatibility during migration period
  // TODO: Remove this after all users have migrated
  localStorage.setItem('biometric_credential_id', credentialId);
  localStorage.setItem('biometric_public_key', JSON.stringify({
    x: publicKeyX,
    y: publicKeyY,
  }));
}

/**
 * Get stored biometric credential ID
 */
export async function getStoredBiometricCredentialSecure(): Promise<string | null> {
  // Try migration first
  await migrateFromLocalStorage();
  
  // Get from IndexedDB
  const credential = await getCredential();
  if (credential) {
    return credential.credentialId;
  }
  
  // Fallback to localStorage (for backward compatibility)
  const localStorageId = localStorage.getItem('biometric_credential_id');
  if (localStorageId) {
    console.warn('⚠️  Using localStorage credential (migration needed)');
  }
  
  return localStorageId;
}

/**
 * Get stored public key
 */
export async function getStoredPublicKeySecure(): Promise<{ x: string; y: string } | null> {
  // Try migration first
  await migrateFromLocalStorage();
  
  // Get from IndexedDB
  const credential = await getCredential();
  if (credential && credential.publicKeyX && credential.publicKeyY) {
    return {
      x: credential.publicKeyX,
      y: credential.publicKeyY,
    };
  }
  
  // Fallback to localStorage
  const localStorageKey = localStorage.getItem('biometric_public_key');
  if (localStorageKey) {
    console.warn('⚠️  Using localStorage public key (migration needed)');
    try {
      return JSON.parse(localStorageKey);
    } catch {
      return null;
    }
  }
  
  return null;
}

/**
 * Check if biometric credential is configured
 */
export async function isBiometricConfiguredSecure(): Promise<boolean> {
  // Try migration first
  await migrateFromLocalStorage();
  
  // Check IndexedDB first
  const hasIDB = await hasCredential();
  if (hasIDB) {
    const cred = await getCredential();
    return !!(cred?.credentialId && cred?.publicKeyX && cred?.publicKeyY);
  }
  
  // Fallback to localStorage
  const credId = localStorage.getItem('biometric_credential_id');
  const pubKey = localStorage.getItem('biometric_public_key');
  
  if (credId && pubKey) {
    console.warn('⚠️  Credentials found in localStorage but not IndexedDB - migration will occur');
    return true;
  }
  
  return false;
}

/**
 * Clear all stored credentials
 */
export async function clearBiometricCredentialSecure(): Promise<void> {
  // Clear IndexedDB
  await clearIDB();
  
  // Clear localStorage
  localStorage.removeItem('biometric_credential_id');
  localStorage.removeItem('biometric_public_key');
  
  console.log('🗑️  Cleared all biometric credentials');
}

/**
 * Update last used timestamp for a credential
 */
export async function updateCredentialLastUsed(credentialId: string): Promise<void> {
  await updateLastUsed(credentialId);
}

/**
 * Get wallet address for current credential
 */
export async function getStoredWalletAddress(): Promise<string | null> {
  const credential = await getCredential();
  return credential?.walletAddress || null;
}

/**
 * Update wallet address for current credential
 */
export async function updateWalletAddress(walletAddress: string): Promise<void> {
  const credential = await getCredential();
  if (credential) {
    await storeCredential({
      credentialId: credential.credentialId,
      publicKeyX: credential.publicKeyX,
      publicKeyY: credential.publicKeyY,
      walletAddress,
    });
  }
}
