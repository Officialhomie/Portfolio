/**
 * Extract public key from WebAuthn credential
 * Parses CBOR-encoded public key from AuthenticatorAttestationResponse
 */

import { decode } from 'cbor-x';
import type { PublicKeyCoordinates } from './types';

/**
 * Extract public key coordinates from WebAuthn attestation response
 * WebAuthn uses CBOR encoding for the public key in COSE format
 */
export async function extractPublicKeyFromCredential(
  credential: PublicKeyCredential
): Promise<PublicKeyCoordinates> {
  if (!credential.response) {
    throw new Error('Credential response not available');
  }

  const attestationResponse = credential.response as AuthenticatorAttestationResponse;
  
  // Get the attestation object (CBOR encoded)
  const attestationObject = new Uint8Array(attestationResponse.attestationObject);
  
  // Parse CBOR attestation object
  const attestation = decode(attestationObject);
  
  // Extract authData (contains the public key)
  const authData = attestation.authData as Uint8Array;
  
  // Parse authData structure:
  // - rpIdHash (32 bytes)
  // - flags (1 byte)
  // - signCount (4 bytes)
  // - attestedCredentialData (variable)
  //   - aaguid (16 bytes)
  //   - credentialIdLength (2 bytes)
  //   - credentialId (variable)
  //   - credentialPublicKey (CBOR encoded COSE key)
  
  let offset = 32 + 1 + 4; // Skip rpIdHash, flags, signCount
  offset += 16; // Skip aaguid
  
  // Read credentialIdLength
  const credentialIdLength = (authData[offset] << 8) | authData[offset + 1];
  offset += 2;
  
  // Skip credentialId
  offset += credentialIdLength;
  
  // Remaining bytes are the credentialPublicKey (CBOR encoded)
  const credentialPublicKeyBytes = authData.slice(offset);
  
  // Parse COSE key (CBOR encoded)
  const coseKey = decode(credentialPublicKeyBytes);
  
  // Extract public key coordinates
  // COSE format for secp256r1 (ES256):
  // {
  //   1: 2,  // kty: EC2
  //   3: -7, // alg: ES256
  //   -1: 1, // crv: P-256
  //   -2: x, // x coordinate (bytes)
  //   -3: y  // y coordinate (bytes)
  // }
  
  const x = coseKey[-2] as Uint8Array;
  const y = coseKey[-3] as Uint8Array;
  
  if (!x || !y) {
    throw new Error('Invalid COSE key: missing x or y coordinates');
  }
  
  // Convert to hex strings (pad to 32 bytes / 64 hex chars)
  const xHex = `0x${Array.from(x)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
    .padStart(64, '0')
    .slice(-64)}` as `0x${string}`;
    
  const yHex = `0x${Array.from(y)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
    .padStart(64, '0')
    .slice(-64)}` as `0x${string}`;
  
  return {
    x: xHex,
    y: yHex,
  };
}

/**
 * Parse COSE key format to extract secp256r1 public key coordinates
 * COSE format for secp256r1 (ES256):
 * {
 *   1: 2,  // kty: EC2
 *   3: -7, // alg: ES256
 *   -1: 1, // crv: P-256
 *   -2: x, // x coordinate
 *   -3: y  // y coordinate
 * }
 */
export async function parseCOSEKey(coseKeyBytes: Uint8Array): Promise<PublicKeyCoordinates> {
  const coseKey = decode(coseKeyBytes);
  
  const x = coseKey[-2] as Uint8Array;
  const y = coseKey[-3] as Uint8Array;
  
  if (!x || !y) {
    throw new Error('Invalid COSE key: missing x or y coordinates');
  }
  
  const xHex = `0x${Array.from(x)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
    .padStart(64, '0')
    .slice(-64)}` as `0x${string}`;
    
  const yHex = `0x${Array.from(y)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
    .padStart(64, '0')
    .slice(-64)}` as `0x${string}`;
  
  return {
    x: xHex,
    y: yHex,
  };
}

/**
 * Get public key from stored credential
 * Uses IndexedDB via storage adapter
 */
export async function getPublicKeyFromStoredCredential(): Promise<PublicKeyCoordinates | null> {
  if (typeof window === 'undefined') {
    return null;
  }

  // Use IndexedDB storage adapter
  const { getStoredPublicKeySecure } = await import('./storage-adapter');
  const storedKey = await getStoredPublicKeySecure();

  if (storedKey && storedKey.x && storedKey.y) {
    return {
      x: storedKey.x as `0x${string}`,
      y: storedKey.y as `0x${string}`,
    };
  }

  return null;
}

/**
 * Store public key coordinates
 * Now returns a Promise since it uses IndexedDB
 */
export async function storePublicKey(coordinates: PublicKeyCoordinates, credentialId?: string): Promise<void> {
  if (typeof window === 'undefined') {
    return;
  }

  // For backward compatibility, still write to localStorage
  // But primarily use IndexedDB
  localStorage.setItem('biometric_public_key', JSON.stringify({
    x: coordinates.x,
    y: coordinates.y,
  }));

  // Also store in IndexedDB if credential ID is provided
  if (credentialId) {
    const { storeBiometricCredentialSecure } = await import('./storage-adapter');
    await storeBiometricCredentialSecure(
      credentialId,
      coordinates.x,
      coordinates.y,
      '' // Wallet address will be set later
    );
  }
}

