/**
 * Biometric Authentication Service
 * Handles WebAuthn API integration and device secure enclave operations
 */

import type {
  BiometricCapability,
  BiometricAuthResult,
  BiometricMethod,
  Secp256r1KeyPair,
  WebAuthnCredentialOptions,
  WebAuthnAssertionOptions,
} from './types';
import { extractPublicKeyFromCredential, storePublicKey, getPublicKeyFromStoredCredential } from './public-key-extractor';

/**
 * Check if device supports biometric authentication
 */
export async function checkBiometricSupport(): Promise<BiometricCapability> {
  const capability: BiometricCapability = {
    isAvailable: false,
    methods: [],
    hasSecureEnclave: false,
    hasWebAuthn: false,
    platform: 'unknown',
  };

  // Check WebAuthn API availability
  if (typeof window !== 'undefined' && window.PublicKeyCredential) {
    capability.hasWebAuthn = true;
    capability.isAvailable = true;

    // Detect platform
    const userAgent = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(userAgent)) {
      capability.platform = 'ios';
      capability.hasSecureEnclave = true; // iOS devices have Secure Enclave
      capability.methods.push('face', 'fingerprint'); // Face ID or Touch ID
    } else if (/android/.test(userAgent)) {
      capability.platform = 'android';
      capability.hasSecureEnclave = true; // Modern Android has StrongBox/KeyStore
      capability.methods.push('fingerprint', 'face'); // Fingerprint or Face unlock
    } else {
      capability.platform = 'desktop';
      // Desktop may have WebAuthn but not secure enclave
      if (window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable) {
        const available = await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
        if (available) {
          capability.hasSecureEnclave = true;
          capability.methods.push('fingerprint', 'face');
        }
      }
    }

    // Check for specific biometric methods
    if (window.PublicKeyCredential.isConditionalMediationAvailable) {
      try {
        const available = await window.PublicKeyCredential.isConditionalMediationAvailable();
        if (available) {
          capability.methods.push('fingerprint', 'face');
        }
      } catch (e) {
        // Conditional mediation not supported
      }
    }
  }

  return capability;
}

/**
 * Generate secp256r1 key pair in device secure enclave
 */
export async function generateSecp256r1Key(
  userId: string,
  userName: string
): Promise<Secp256r1KeyPair> {
  if (typeof window === 'undefined' || !window.PublicKeyCredential) {
    throw new Error('WebAuthn API not available');
  }

  // Generate random challenge
  const challenge = new Uint8Array(32);
  crypto.getRandomValues(challenge);

  // Create credential options for secp256r1 (ES256 = -7)
  const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
    challenge,
    rp: {
      name: 'Web3 Portfolio',
      id: window.location.hostname,
    },
    user: {
      id: new TextEncoder().encode(userId),
      name: userName,
      displayName: userName,
    },
    pubKeyCredParams: [
      {
        type: 'public-key',
        alg: -7, // ES256 (secp256r1) - preferred for biometric
      },
      {
        type: 'public-key',
        alg: -257, // RS256 - fallback for compatibility
      },
    ],
    authenticatorSelection: {
      authenticatorAttachment: 'platform', // Use device authenticator (secure enclave)
      requireResidentKey: false,
      userVerification: 'required', // Require biometric
    },
    attestation: 'none', // Don't need attestation for our use case
    timeout: 60000,
  };

  try {
    const credential = (await navigator.credentials.create({
      publicKey: publicKeyCredentialCreationOptions,
    })) as PublicKeyCredential;

    if (!credential || !credential.response) {
      throw new Error('Failed to create credential');
    }

    const response = credential.response as AuthenticatorAttestationResponse;

    // Extract public key from credential
    const publicKeyCoords = await extractPublicKeyFromCredential(credential);

    const credentialId = new Uint8Array(credential.rawId);
    const credentialIdBase64 = btoa(String.fromCharCode(...credentialId)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

    // Store public key for later use (now with credential ID for IndexedDB)
    await storePublicKey(publicKeyCoords, credentialIdBase64);

    return {
      publicKey: new Uint8Array(0), // Legacy field, use publicKeyX/Y instead
      publicKeyX: publicKeyCoords.x,
      publicKeyY: publicKeyCoords.y,
      credentialId: credentialIdBase64,
      keyHandle: Array.from(credentialId).map(b => b.toString(16).padStart(2, '0')).join(''),
    };
  } catch (error) {
    console.error('Error generating secp256r1 key:', error);
    throw new Error(`Failed to generate key: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Request biometric authentication
 */
export async function requestBiometricAuth(
  credentialId?: string,
  message?: string
): Promise<BiometricAuthResult> {
  if (typeof window === 'undefined' || !window.PublicKeyCredential) {
    return {
      success: false,
      error: 'WebAuthn API not available',
      timestamp: Date.now(),
    };
  }

  // Generate random challenge
  const challenge = new Uint8Array(32);
  crypto.getRandomValues(challenge);

  const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
    challenge,
    rpId: window.location.hostname,
    allowCredentials: credentialId
      ? [
          {
            id: Uint8Array.from(
              atob(credentialId.replace(/-/g, '+').replace(/_/g, '/'))
                .split('')
                .map(c => c.charCodeAt(0))
            ),
            type: 'public-key',
            transports: ['internal'], // Use device authenticator
          },
        ]
      : undefined,
    userVerification: 'required', // Require biometric
    timeout: 60000,
  };

  try {
    const assertion = (await navigator.credentials.get({
      publicKey: publicKeyCredentialRequestOptions,
    })) as PublicKeyCredential;

    if (!assertion || !assertion.response) {
      return {
        success: false,
        error: 'Biometric authentication failed',
        timestamp: Date.now(),
      };
    }

    const response = assertion.response as AuthenticatorAssertionResponse;

    // Determine biometric method based on platform
    let method: BiometricMethod = 'unknown';
    const userAgent = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(userAgent)) {
      method = 'face'; // Assume Face ID (could be Touch ID on older devices)
    } else if (/android/.test(userAgent)) {
      method = 'fingerprint'; // Assume fingerprint (could be face unlock)
    }

      const rawId = new Uint8Array(assertion.rawId);
      const credentialId = btoa(String.fromCharCode(...rawId)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
      
      return {
        success: true,
        method,
        timestamp: Date.now(),
        credentialId,
      };
  } catch (error) {
    console.error('Biometric authentication error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Authentication failed',
      timestamp: Date.now(),
    };
  }
}

/**
 * Sign transaction hash with biometric verification
 * This creates a signature using the secure enclave key after biometric authentication
 * Returns the WebAuthn signature (DER format) which needs to be parsed
 */
export async function signWithBiometric(
  messageHash: Uint8Array,
  credentialId: string
): Promise<Uint8Array> {
  if (typeof window === 'undefined' || !window.PublicKeyCredential) {
    throw new Error('WebAuthn API not available');
  }

  if (messageHash.length !== 32) {
    throw new Error('Message hash must be 32 bytes');
  }

  // Create assertion request with the message hash as challenge
  // The biometric prompt will appear here
  // Convert to proper BufferSource type
  const challenge = new Uint8Array(messageHash);
  const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
    challenge: challenge as BufferSource, // Use message hash as challenge
    rpId: window.location.hostname,
    allowCredentials: [
      {
        id: Uint8Array.from(
          atob(credentialId.replace(/-/g, '+').replace(/_/g, '/'))
            .split('')
            .map(c => c.charCodeAt(0))
        ),
        type: 'public-key',
        transports: ['internal'],
      },
    ],
    userVerification: 'required', // This triggers biometric prompt
    timeout: 60000,
  };

  try {
    const assertion = (await navigator.credentials.get({
      publicKey: publicKeyCredentialRequestOptions,
    })) as PublicKeyCredential;

    if (!assertion || !assertion.response) {
      throw new Error('Failed to create signature');
    }

    const response = assertion.response as AuthenticatorAssertionResponse;

    // Extract signature from response (DER format)
    // This will be parsed to (r, s) format by signature-parser.ts
    return new Uint8Array(response.signature);
  } catch (error) {
    console.error('Error signing with biometric:', error);
    throw new Error(`Failed to sign: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get stored public key coordinates
 * Now async because it uses IndexedDB
 */
export async function getStoredPublicKey(): Promise<{ x: `0x${string}`; y: `0x${string}` } | null> {
  return await getPublicKeyFromStoredCredential();
}

// Track last logged state to prevent spam
let lastConfiguredState: boolean | null = null;

/**
 * Check if biometric authentication is available and configured
 * Requires BOTH credential ID AND public key to be stored
 */
export async function isBiometricConfigured(verbose = false): Promise<boolean> {
  try {
    const capability = await checkBiometricSupport();
    if (!capability.isAvailable) {
      if (verbose && lastConfiguredState !== false) {
        console.log('❌ Biometric not available on this device');
      }
      lastConfiguredState = false;
      return false;
    }

    // Check if we have stored credentials (now using secure async storage)
    const { getStoredBiometricCredentialSecure, getStoredPublicKeySecure } = await import('./storage-adapter');

    const storedCredentialId = await getStoredBiometricCredentialSecure();
    if (!storedCredentialId) {
      if (verbose && lastConfiguredState !== false) {
        console.log('❌ No credential ID found in storage');
      }
      lastConfiguredState = false;
      return false;
    }

    // Check if we have stored public key (CRITICAL - both are needed!)
    const storedPublicKey = await getStoredPublicKeySecure();
    if (!storedPublicKey || !storedPublicKey.x || !storedPublicKey.y) {
      if (verbose && lastConfiguredState !== false) {
        console.log('❌ No public key found in storage');
        console.log('   Credential ID exists but public key is missing!');
      }
      lastConfiguredState = false;
      return false;
    }

    // Validate public key format
    if (storedPublicKey.x.length !== 66 || storedPublicKey.y.length !== 66) {
      if (verbose && lastConfiguredState !== false) {
        console.log('❌ Invalid public key format');
      }
      lastConfiguredState = false;
      return false;
    }

    // Only log if state changed from false to true OR if verbose mode
    if (lastConfiguredState !== true || verbose) {
      console.log('✅ Biometric fully configured');
      console.log('   Credential ID:', storedCredentialId.substring(0, 20) + '...');
      console.log('   Public Key X:', storedPublicKey.x.substring(0, 20) + '...');
      console.log('   Public Key Y:', storedPublicKey.y.substring(0, 20) + '...');
    }

    lastConfiguredState = true;
    return true;
  } catch (error) {
    console.error('Error checking biometric configuration:', error);
    lastConfiguredState = false;
    return false;
  }
}

/**
 * Store biometric credential ID
 * @deprecated Use storeBiometricCredentialSecure from storage-adapter instead
 */
export function storeBiometricCredential(credentialId: string): void {
  if (typeof window === 'undefined') {
    return;
  }
  // Keep for backward compatibility, but prefer IndexedDB
  localStorage.setItem('biometric_credential_id', credentialId);
}

/**
 * Get stored biometric credential ID
 * @deprecated Use getStoredBiometricCredentialSecure from storage-adapter instead
 */
export function getStoredBiometricCredential(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  return localStorage.getItem('biometric_credential_id');
}

/**
 * Clear stored biometric credential
 * @deprecated Use clearBiometricCredentialSecure from storage-adapter instead
 */
export function clearBiometricCredential(): void {
  if (typeof window === 'undefined') {
    return;
  }
  // Keep for backward compatibility, but prefer IndexedDB clear
  localStorage.removeItem('biometric_credential_id');
  localStorage.removeItem('biometric_public_key');

  // Also clear IndexedDB (async, fire and forget)
  import('./storage-adapter').then(({ clearBiometricCredentialSecure }) => {
    clearBiometricCredentialSecure().catch(console.error);
  });
}

