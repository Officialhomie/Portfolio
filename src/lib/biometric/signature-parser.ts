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
 *
 * DER format structure:
 * 0x30 [total_length] 0x02 [r_length] [r_bytes] 0x02 [s_length] [s_bytes]
 */
export function parseWebAuthnSignature(
  signature: Uint8Array
): { r: `0x${string}`; s: `0x${string}` } {
  // Validate minimum length (header + minimal r and s)
  if (signature.length < 8) {
    throw new Error(
      `Invalid DER signature: too short (${signature.length} bytes, minimum 8 required)`
    );
  }

  // Validate DER SEQUENCE tag (0x30)
  if (signature[0] !== 0x30) {
    throw new Error(
      `Invalid DER signature: expected SEQUENCE tag (0x30), got 0x${signature[0].toString(16).padStart(2, '0')}`
    );
  }

  // Validate total length
  const totalLength = signature[1];
  if (signature.length !== totalLength + 2) {
    throw new Error(
      `Invalid DER signature: length mismatch (expected ${totalLength + 2} bytes, got ${signature.length})`
    );
  }

  let offset = 2; // Start after SEQUENCE header

  // Parse r value
  const { value: r, newOffset: offsetAfterR } = parseDERInteger(signature, offset, 'r');
  offset = offsetAfterR;

  // Parse s value
  const { value: s, newOffset: offsetAfterS } = parseDERInteger(signature, offset, 's');
  offset = offsetAfterS;

  // Validate we consumed the entire signature
  if (offset !== signature.length) {
    throw new Error(
      `Invalid DER signature: unexpected data after s value (${signature.length - offset} bytes remaining)`
    );
  }

  // Validate r and s are in valid range (0 < r,s < N)
  if (r === 0n || r >= SECP256R1_N) {
    throw new Error(
      `Invalid signature: r value out of range (must be 0 < r < N)`
    );
  }

  let normalizedS = s;
  if (s === 0n || s >= SECP256R1_N) {
    throw new Error(
      `Invalid signature: s value out of range (must be 0 < s < N)`
    );
  }

  // Normalize s value (ensure s <= N/2 to prevent signature malleability)
  normalizedS = normalizeSignature(s);

  return {
    r: `0x${r.toString(16).padStart(64, '0')}` as `0x${string}`,
    s: `0x${normalizedS.toString(16).padStart(64, '0')}` as `0x${string}`,
  };
}

/**
 * Parse a DER INTEGER from signature
 * Returns the parsed value and the new offset
 */
function parseDERInteger(
  signature: Uint8Array,
  offset: number,
  name: string
): { value: bigint; newOffset: number } {
  // Check we have enough bytes for INTEGER header
  if (offset + 2 > signature.length) {
    throw new Error(
      `Invalid DER signature: insufficient data for ${name} INTEGER header`
    );
  }

  // Validate INTEGER tag (0x02)
  if (signature[offset] !== 0x02) {
    throw new Error(
      `Invalid DER signature: expected INTEGER tag (0x02) for ${name}, got 0x${signature[offset].toString(16).padStart(2, '0')}`
    );
  }
  offset++;

  // Read length
  const length = signature[offset];
  offset++;

  // Validate length is reasonable (0 < length <= 33 for secp256r1)
  // Max 33 because of potential leading 0x00 padding byte
  if (length === 0 || length > 33) {
    throw new Error(
      `Invalid DER signature: ${name} length out of range (${length}, expected 1-33)`
    );
  }

  // Check we have enough bytes for the integer value
  if (offset + length > signature.length) {
    throw new Error(
      `Invalid DER signature: insufficient data for ${name} value (need ${length} bytes, have ${signature.length - offset})`
    );
  }

  // Extract integer bytes
  let integerBytes = signature.slice(offset, offset + length);
  offset += length;

  // Handle DER padding: if high bit is set, there should be a leading 0x00
  // to indicate it's positive. We need to skip this padding.
  if (integerBytes.length > 32) {
    if (integerBytes[0] !== 0x00) {
      throw new Error(
        `Invalid DER signature: ${name} has length > 32 but no padding byte`
      );
    }
    // Skip the padding byte
    integerBytes = integerBytes.slice(1);
  }

  // Validate final length is at most 32 bytes
  if (integerBytes.length > 32) {
    throw new Error(
      `Invalid DER signature: ${name} value too large (${integerBytes.length} bytes after padding removal)`
    );
  }

  // Convert to BigInt
  // Handle empty or all-zero case
  if (integerBytes.length === 0 || integerBytes.every(b => b === 0)) {
    throw new Error(
      `Invalid DER signature: ${name} value is zero`
    );
  }

  const hexString = Array.from(integerBytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  const value = BigInt('0x' + hexString);

  return { value, newOffset: offset };
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

