/**
 * Biometric Credential Debug & Cleanup Utilities
 *
 * Use this to inspect and clear ALL storage locations where
 * biometric credentials might be stored.
 *
 * STORAGE LOCATIONS:
 * 1. IndexedDB: "BiometricWalletDB" → "credentials" (primary storage)
 * 2. localStorage: "biometric_credential_id" + "biometric_public_key" (legacy/fallback)
 * 3. Browser WebAuthn Store: Managed by browser, cannot be accessed programmatically
 */

import { clearAllCredentials, listCredentials } from './storage';

/**
 * Storage snapshot interface
 */
export interface BiometricStorageSnapshot {
  indexedDB: {
    dbName: string;
    storeName: string;
    credentials: Array<{
      id: number;
      credentialId: string;
      publicKeyX: string;
      publicKeyY: string;
      walletAddress: string;
      createdAt: number;
      lastUsedAt: number;
    }>;
    count: number;
  };
  localStorage: {
    credentialId: string | null;
    publicKey: { x: string; y: string } | null;
  };
  webAuthn: {
    isAvailable: boolean;
    platformAuthenticatorAvailable: boolean | null;
  };
}

/**
 * Get complete snapshot of ALL biometric storage
 */
export async function getBiometricStorageSnapshot(): Promise<BiometricStorageSnapshot> {
  // IndexedDB snapshot
  const credentials = await listCredentials();

  // localStorage snapshot
  const localCredId = localStorage.getItem('biometric_credential_id');
  const localPubKeyStr = localStorage.getItem('biometric_public_key');
  let localPubKey = null;
  if (localPubKeyStr) {
    try {
      localPubKey = JSON.parse(localPubKeyStr);
    } catch (e) {
      console.error('Failed to parse localStorage public key:', e);
    }
  }

  // WebAuthn availability
  let platformAuthAvail = null;
  if (window.PublicKeyCredential?.isUserVerifyingPlatformAuthenticatorAvailable) {
    try {
      platformAuthAvail = await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    } catch (e) {
      console.error('Failed to check platform authenticator:', e);
    }
  }

  return {
    indexedDB: {
      dbName: 'BiometricWalletDB',
      storeName: 'credentials',
      credentials: credentials.map(c => ({
        id: c.id,
        credentialId: c.credentialId,
        publicKeyX: c.publicKeyX,
        publicKeyY: c.publicKeyY,
        walletAddress: c.walletAddress,
        createdAt: c.createdAt,
        lastUsedAt: c.lastUsedAt,
      })),
      count: credentials.length,
    },
    localStorage: {
      credentialId: localCredId,
      publicKey: localPubKey,
    },
    webAuthn: {
      isAvailable: !!window.PublicKeyCredential,
      platformAuthenticatorAvailable: platformAuthAvail,
    },
  };
}

/**
 * Print comprehensive diagnostic report
 */
export async function printBiometricDiagnostic(): Promise<void> {
  console.log('🔍 ═══════════════════════════════════════════════════════');
  console.log('🔍 BIOMETRIC CREDENTIAL DIAGNOSTIC');
  console.log('🔍 ═══════════════════════════════════════════════════════');

  const snapshot = await getBiometricStorageSnapshot();

  // IndexedDB
  console.log('\n📦 IndexedDB (Primary Storage):');
  console.log('   Database:', snapshot.indexedDB.dbName);
  console.log('   Store:', snapshot.indexedDB.storeName);
  console.log('   Credential count:', snapshot.indexedDB.count);

  if (snapshot.indexedDB.count > 0) {
    snapshot.indexedDB.credentials.forEach((cred, index) => {
      console.log(`\n   Credential #${index + 1}:`);
      console.log('     ID:', cred.id);
      console.log('     Credential ID:', cred.credentialId.substring(0, 30) + '...');
      console.log('     Public Key X:', cred.publicKeyX.substring(0, 20) + '...');
      console.log('     Public Key Y:', cred.publicKeyY.substring(0, 20) + '...');
      console.log('     Wallet Address:', cred.walletAddress || '(not set)');
      console.log('     Created:', new Date(cred.createdAt).toLocaleString());
      console.log('     Last Used:', new Date(cred.lastUsedAt).toLocaleString());
    });
  } else {
    console.log('   ❌ No credentials found in IndexedDB');
  }

  // localStorage
  console.log('\n💾 localStorage (Legacy Storage):');
  if (snapshot.localStorage.credentialId) {
    console.log('   Credential ID:', snapshot.localStorage.credentialId.substring(0, 30) + '...');
  } else {
    console.log('   Credential ID: ❌ Not found');
  }

  if (snapshot.localStorage.publicKey) {
    console.log('   Public Key X:', snapshot.localStorage.publicKey.x.substring(0, 20) + '...');
    console.log('   Public Key Y:', snapshot.localStorage.publicKey.y.substring(0, 20) + '...');
  } else {
    console.log('   Public Key: ❌ Not found');
  }

  // WebAuthn
  console.log('\n🔐 WebAuthn (Browser Native):');
  console.log('   API Available:', snapshot.webAuthn.isAvailable ? '✅' : '❌');
  console.log('   Platform Authenticator:', snapshot.webAuthn.platformAuthenticatorAvailable ? '✅' : '❌');

  // Summary
  console.log('\n📊 Summary:');
  const hasIndexedDB = snapshot.indexedDB.count > 0;
  const hasLocalStorage = !!(snapshot.localStorage.credentialId && snapshot.localStorage.publicKey);
  const hasWebAuthn = snapshot.webAuthn.isAvailable && snapshot.webAuthn.platformAuthenticatorAvailable;

  console.log('   IndexedDB:', hasIndexedDB ? '✅ Has credentials' : '❌ Empty');
  console.log('   localStorage:', hasLocalStorage ? '✅ Has credentials' : '❌ Empty');
  console.log('   WebAuthn:', hasWebAuthn ? '✅ Available' : '❌ Not available');

  // Warnings
  if (hasIndexedDB && hasLocalStorage) {
    console.log('\n⚠️  Credentials exist in BOTH IndexedDB and localStorage (normal during migration)');
  }

  if (hasLocalStorage && !hasIndexedDB) {
    console.log('\n⚠️  Credentials ONLY in localStorage (migration needed)');
  }

  if (!hasIndexedDB && !hasLocalStorage && hasWebAuthn) {
    console.log('\n❌ NO CREDENTIALS STORED');
    console.log('   WebAuthn is available but no credentials are registered');
    console.log('   → User needs to complete biometric registration');
  }

  if (!hasWebAuthn) {
    console.log('\n❌ WEBAUTHN NOT AVAILABLE');
    console.log('   Possible reasons:');
    console.log('   - Non-HTTPS connection (except localhost)');
    console.log('   - Browser does not support WebAuthn');
    console.log('   - Device has no biometric capability');
  }

  console.log('\n🔍 ═══════════════════════════════════════════════════════\n');
}

/**
 * Clear ALL biometric credentials from ALL storage locations
 * ⚠️  WARNING: This is IRREVERSIBLE!
 */
export async function clearAllBiometricData(): Promise<void> {
  console.log('🗑️  ═══════════════════════════════════════════════════════');
  console.log('🗑️  CLEARING ALL BIOMETRIC DATA');
  console.log('🗑️  ═══════════════════════════════════════════════════════');

  // Get snapshot before clearing
  const before = await getBiometricStorageSnapshot();
  console.log('\n📸 Before clearing:');
  console.log('   IndexedDB credentials:', before.indexedDB.count);
  console.log('   localStorage:', before.localStorage.credentialId ? 'Has data' : 'Empty');

  // Clear IndexedDB
  console.log('\n🗑️  Clearing IndexedDB...');
  await clearAllCredentials();

  // Clear localStorage
  console.log('🗑️  Clearing localStorage...');
  localStorage.removeItem('biometric_credential_id');
  localStorage.removeItem('biometric_public_key');

  // Verify clearing
  const after = await getBiometricStorageSnapshot();
  console.log('\n✅ After clearing:');
  console.log('   IndexedDB credentials:', after.indexedDB.count);
  console.log('   localStorage:', after.localStorage.credentialId ? 'Has data' : 'Empty');

  if (after.indexedDB.count === 0 && !after.localStorage.credentialId) {
    console.log('\n✅ SUCCESS: All credentials cleared from app storage');
  } else {
    console.error('\n❌ ERROR: Some credentials may still remain');
  }

  console.log('\n⚠️  IMPORTANT: Browser WebAuthn credentials CANNOT be cleared programmatically');
  console.log('   To fully reset, manually delete browser-stored passkeys:');
  console.log('   • Chrome: Settings → Privacy and Security → Manage Passkeys');
  console.log('   • Safari: Settings → Passwords → (find localhost) → Delete');
  console.log('   • Firefox: Settings → Privacy & Security → Saved Logins');

  console.log('\n🗑️  ═══════════════════════════════════════════════════════\n');
}

/**
 * Check biometric health and get recommendations
 */
export async function checkBiometricHealth(): Promise<{
  healthy: boolean;
  issues: string[];
  recommendations: string[];
}> {
  const issues: string[] = [];
  const recommendations: string[] = [];

  const snapshot = await getBiometricStorageSnapshot();

  // Check WebAuthn
  if (!snapshot.webAuthn.isAvailable) {
    issues.push('WebAuthn API not available');
    recommendations.push('Use a modern browser (Chrome, Safari, Firefox)');
  }

  if (snapshot.webAuthn.platformAuthenticatorAvailable === false) {
    issues.push('Platform authenticator not available');
    recommendations.push('Device lacks biometric capability or it is disabled');
  }

  // Check storage consistency
  const hasIDB = snapshot.indexedDB.count > 0;
  const hasLS = !!(snapshot.localStorage.credentialId && snapshot.localStorage.publicKey);

  if (!hasIDB && !hasLS) {
    issues.push('No biometric credentials found');
    recommendations.push('Register biometric authentication at /biometric');
  } else if (hasLS && !hasIDB) {
    issues.push('Credentials only in localStorage');
    recommendations.push('Re-register to migrate to IndexedDB');
  } else if (hasIDB) {
    const cred = snapshot.indexedDB.credentials[0];
    if (!cred.walletAddress) {
      issues.push('Wallet address not set');
      recommendations.push('Complete smart wallet creation');
    }
    if (!cred.publicKeyX || !cred.publicKeyY) {
      issues.push('Public key missing');
      recommendations.push('Re-register biometric authentication');
    }
  }

  return {
    healthy: issues.length === 0,
    issues,
    recommendations,
  };
}

/**
 * Legacy function - kept for backward compatibility
 */
export function debugBiometricStorage(): {
  credentialId: string | null;
  publicKey: { x: string; y: string } | null;
  isValid: boolean;
  issues: string[];
} {
  const issues: string[] = [];
  const credentialId = localStorage.getItem('biometric_credential_id');
  const publicKeyStr = localStorage.getItem('biometric_public_key');

  let publicKey: { x: string; y: string } | null = null;

  if (!credentialId) issues.push('Missing credential ID');
  if (!publicKeyStr) {
    issues.push('Missing public key');
  } else {
    try {
      publicKey = JSON.parse(publicKeyStr);
      if (!publicKey?.x || !publicKey?.y) issues.push('Invalid public key');
    } catch {
      issues.push('Failed to parse public key');
    }
  }

  return { credentialId, publicKey, isValid: issues.length === 0, issues };
}

/**
 * Legacy function - kept for backward compatibility
 */
export function clearAllBiometricStorage(): void {
  localStorage.removeItem('biometric_credential_id');
  localStorage.removeItem('biometric_public_key');
  console.log('🧹 Cleared localStorage');
}

// Export debug tools to window for browser console access
if (typeof window !== 'undefined') {
  (window as any).biometricDebug = {
    print: printBiometricDiagnostic,
    snapshot: getBiometricStorageSnapshot,
    clear: clearAllBiometricData,
    health: checkBiometricHealth,
  };

  console.log('🔧 Biometric debug tools loaded. Usage:');
  console.log('   window.biometricDebug.print()   - Full diagnostic');
  console.log('   window.biometricDebug.health()  - Check health');
  console.log('   window.biometricDebug.clear()   - Clear all data');
}

