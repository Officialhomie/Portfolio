/**
 * Parse WebAuthn signatures and convert to secp256r1 (r, s) format
 * WebAuthn signatures are in DER/ASN.1 format and need to be converted
 */

import type { BiometricTransactionSignature } from './types';

/**
 * secp256r1 curve order (N)
 * Used for signature normalization
 */
const SECP256R1_N = BigInt('0xFFFFFFFF00000000FFFFFFFFFFFFFFFFBCE6FAADA7179E84F3B9CAC2FC632551');
const HALF_N = SECP256R1_N / BigInt(2);

/**
 * Parse WebAuthn assertion signature to (r, s) format
 * WebAuthn signatures are DER-encoded ASN.1 sequences
 */
export function parseWebAuthnSignature(
  signature: Uint8Array
): { r: `0x${string}`; s: `0x${string}` } {
  // WebAuthn signatures are in DER format: SEQUENCE { INTEGER r, INTEGER s }
  // We need to parse this and extract r and s values
  
  // DER format structure:
  // 0x30 [length] 0x02 [r_length] [r_bytes] 0x02 [s_length] [s_bytes]
  
  if (signature.length < 8) {
    throw new Error('Invalid signature format: too short');
  }
  
  // Check for DER sequence tag (0x30)
  if (signature[0] !== 0x30) {
    throw new Error('Invalid signature format: expected DER sequence');
  }
  
  // Parse DER structure
  let offset = 2; // Skip 0x30 and length byte
  
  // Parse r
  if (signature[offset] !== 0x02) {
    throw new Error('Invalid signature format: expected INTEGER for r');
  }
  offset++;
  
  const rLength = signature[offset];
  offset++;
  
  // Handle leading zero padding
  let rStart = offset;
  if (signature[rStart] === 0x00 && rLength > 32) {
    rStart++;
  }
  
  const rBytes = signature.slice(rStart, rStart + 32);
  const r = BigInt('0x' + Array.from(rBytes).map(b => b.toString(16).padStart(2, '0')).join(''));
  
  offset += rLength;
  
  // Parse s
  if (signature[offset] !== 0x02) {
    throw new Error('Invalid signature format: expected INTEGER for s');
  }
  offset++;
  
  const sLength = signature[offset];
  offset++;
  
  // Handle leading zero padding
  let sStart = offset;
  if (signature[sStart] === 0x00 && sLength > 32) {
    sStart++;
  }
  
  const sBytes = signature.slice(sStart, sStart + 32);
  let s = BigInt('0x' + Array.from(sBytes).map(b => b.toString(16).padStart(2, '0')).join(''));
  
  // Normalize s value (ensure s <= N/2 to prevent signature malleability)
  s = normalizeSignature(s);
  
  return {
    r: `0x${r.toString(16).padStart(64, '0')}` as `0x${string}`,
    s: `0x${s.toString(16).padStart(64, '0')}` as `0x${string}`,
  };
}

/**
 * Normalize signature s value
 * P256 library requires s <= N/2 to prevent signature malleability
 */
export function normalizeSignature(s: bigint): bigint {
  if (s > HALF_N) {
    return SECP256R1_N - s;
  }
  return s;
}

/**
 * Convert bytes32 to hex string with proper padding
 */
export function bytes32ToHex(bytes: Uint8Array): `0x${string}` {
  if (bytes.length !== 32) {
    throw new Error(`Expected 32 bytes, got ${bytes.length}`);
  }
  
  return `0x${Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')}` as `0x${string}`;
}

/**
 * Create complete biometric transaction signature
 */
export function createBiometricTransactionSignature(
  r: `0x${string}`,
  s: `0x${string}`,
  publicKeyX: `0x${string}`,
  publicKeyY: `0x${string}`
): BiometricTransactionSignature {
  return {
    r,
    s,
    publicKeyX,
    publicKeyY,
  };
}

