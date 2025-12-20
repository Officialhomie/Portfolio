/**
 * DER Signature Parser Tests
 * Validates WebAuthn DER signature parsing with edge cases
 */

import { describe, it, expect } from '@jest/globals';
import {
  parseWebAuthnSignature,
  normalizeSignature,
  bytes32ToHex,
} from '../../src/lib/biometric/signature-parser';

// secp256r1 curve order
const SECP256R1_N = BigInt('0xFFFFFFFF00000000FFFFFFFFFFFFFFFFBCE6FAADA7179E84F3B9CAC2FC632551');
const HALF_N = SECP256R1_N / BigInt(2);

describe('DER Signature Parser', () => {
  describe('Valid Signatures', () => {
    it('should parse valid DER signature without padding', () => {
      // Example DER signature: r and s are both 32 bytes, no padding
      const r = new Uint8Array(32).fill(1);
      const s = new Uint8Array(32).fill(2);

      const derSig = createDERSignature(r, s);
      const result = parseWebAuthnSignature(derSig);

      expect(result.r).toMatch(/^0x[0-9a-fA-F]{64}$/);
      expect(result.s).toMatch(/^0x[0-9a-fA-F]{64}$/);
    });

    it('should parse valid DER signature with padding on r', () => {
      // When high bit is set, DER adds 0x00 padding
      const r = new Uint8Array(32);
      r[0] = 0xFF; // High bit set
      r.fill(1, 1);
      const s = new Uint8Array(32).fill(2);

      const derSig = createDERSignatureWithPadding(r, s);
      const result = parseWebAuthnSignature(derSig);

      expect(result.r).toMatch(/^0x[0-9a-fA-F]{64}$/);
      expect(result.s).toMatch(/^0x[0-9a-fA-F]{64}$/);
    });

    it('should parse valid DER signature with padding on both r and s', () => {
      const r = new Uint8Array(32);
      r[0] = 0x80;
      const s = new Uint8Array(32);
      s[0] = 0xFF;

      const derSig = createDERSignatureWithPadding(r, s);
      const result = parseWebAuthnSignature(derSig);

      expect(result.r).toMatch(/^0x[0-9a-fA-F]{64}$/);
      expect(result.s).toMatch(/^0x[0-9a-fA-F]{64}$/);
    });

    it('should parse signature with short r value (< 32 bytes)', () => {
      // r value with leading zeros (will be shorter in DER)
      const r = new Uint8Array(32);
      r.fill(0, 0, 10);
      r.fill(0x11, 10);
      const s = new Uint8Array(32).fill(0x22);

      const derSig = createDERSignature(r, s);
      const result = parseWebAuthnSignature(derSig);

      expect(result.r).toMatch(/^0x[0-9a-fA-F]{64}$/);
      expect(result.s).toMatch(/^0x[0-9a-fA-F]{64}$/);
    });
  });

  describe('Invalid Signatures', () => {
    it('should reject signature that is too short', () => {
      const shortSig = new Uint8Array([0x30, 0x06, 0x02, 0x01, 0x01]);

      expect(() => parseWebAuthnSignature(shortSig)).toThrow(
        /too short/
      );
    });

    it('should reject signature without SEQUENCE tag', () => {
      const invalidSig = new Uint8Array([0x31, 0x44, 0x02, 0x20]); // Wrong tag

      expect(() => parseWebAuthnSignature(invalidSig)).toThrow(
        /expected SEQUENCE tag/
      );
    });

    it('should reject signature with incorrect total length', () => {
      const r = new Uint8Array(32).fill(1);
      const s = new Uint8Array(32).fill(2);
      const derSig = createDERSignature(r, s);

      // Corrupt the length byte
      derSig[1] = derSig[1] + 10;

      expect(() => parseWebAuthnSignature(derSig)).toThrow(
        /length mismatch/
      );
    });

    it('should reject signature with invalid INTEGER tag for r', () => {
      const sig = new Uint8Array([
        0x30, 0x06,
        0x03, 0x01, 0x01, // Wrong tag (0x03 instead of 0x02)
        0x02, 0x01, 0x02
      ]);

      expect(() => parseWebAuthnSignature(sig)).toThrow(
        /expected INTEGER tag.*for r/
      );
    });

    it('should reject signature with invalid INTEGER tag for s', () => {
      const sig = new Uint8Array([
        0x30, 0x06,
        0x02, 0x01, 0x01,
        0x03, 0x01, 0x02 // Wrong tag for s
      ]);

      expect(() => parseWebAuthnSignature(sig)).toThrow(
        /expected INTEGER tag.*for s/
      );
    });

    it('should reject signature with r = 0', () => {
      const r = new Uint8Array(32).fill(0);
      const s = new Uint8Array(32).fill(1);
      const derSig = createDERSignature(r, s);

      expect(() => parseWebAuthnSignature(derSig)).toThrow(
        /r value is zero/
      );
    });

    it('should reject signature with s = 0', () => {
      const r = new Uint8Array(32).fill(1);
      const s = new Uint8Array(32).fill(0);
      const derSig = createDERSignature(r, s);

      expect(() => parseWebAuthnSignature(derSig)).toThrow(
        /s value is zero/
      );
    });

    it('should reject signature with r >= N', () => {
      // Create r value >= curve order
      const r = hexToBytes(SECP256R1_N.toString(16).padStart(64, '0'));
      const s = new Uint8Array(32).fill(1);
      const derSig = createDERSignature(r, s);

      expect(() => parseWebAuthnSignature(derSig)).toThrow(
        /r value out of range/
      );
    });

    it('should reject signature with s >= N', () => {
      const r = new Uint8Array(32).fill(1);
      const s = hexToBytes(SECP256R1_N.toString(16).padStart(64, '0'));
      const derSig = createDERSignature(r, s);

      expect(() => parseWebAuthnSignature(derSig)).toThrow(
        /s value out of range/
      );
    });

    it('should reject signature with extra trailing data', () => {
      const r = new Uint8Array(32).fill(1);
      const s = new Uint8Array(32).fill(2);
      const derSig = createDERSignature(r, s);

      // Add extra bytes
      const invalidSig = new Uint8Array(derSig.length + 5);
      invalidSig.set(derSig);
      invalidSig.fill(0xFF, derSig.length);

      expect(() => parseWebAuthnSignature(invalidSig)).toThrow(
        /unexpected data after s value/
      );
    });

    it('should reject signature with insufficient data for r', () => {
      const sig = new Uint8Array([
        0x30, 0x25,
        0x02, 0x20, // Says 32 bytes follow
        // But only 10 bytes provided
        ...new Array(10).fill(0x01)
      ]);

      expect(() => parseWebAuthnSignature(sig)).toThrow(
        /insufficient data for r value/
      );
    });

    it('should reject signature with length > 33 for r', () => {
      const sig = new Uint8Array([
        0x30, 0x48,
        0x02, 0x22, // 34 bytes - too long even with padding
        ...new Array(34).fill(0x01),
        0x02, 0x20,
        ...new Array(32).fill(0x02)
      ]);

      expect(() => parseWebAuthnSignature(sig)).toThrow(
        /length out of range/
      );
    });
  });

  describe('Signature Normalization', () => {
    it('should normalize high s values', () => {
      const highS = HALF_N + BigInt(1000);
      const normalized = normalizeSignature(highS);

      expect(normalized).toBeLessThanOrEqual(HALF_N);
      expect(normalized).toBe(SECP256R1_N - highS);
    });

    it('should not modify low s values', () => {
      const lowS = HALF_N - BigInt(1000);
      const normalized = normalizeSignature(lowS);

      expect(normalized).toBe(lowS);
    });

    it('should handle s exactly at N/2', () => {
      const normalized = normalizeSignature(HALF_N);
      expect(normalized).toBe(HALF_N);
    });

    it('should normalize s in parsed signature', () => {
      // Create signature with high s value
      const r = new Uint8Array(32).fill(0x11);
      const highS = HALF_N + BigInt(12345);
      const sBytes = hexToBytes(highS.toString(16).padStart(64, '0'));

      const derSig = createDERSignature(r, sBytes);
      const result = parseWebAuthnSignature(derSig);

      // Verify s was normalized
      const resultS = BigInt(result.s);
      expect(resultS).toBeLessThanOrEqual(HALF_N);
    });
  });

  describe('bytes32ToHex', () => {
    it('should convert 32 bytes to hex string', () => {
      const bytes = new Uint8Array(32).fill(0xAB);
      const hex = bytes32ToHex(bytes);

      expect(hex).toMatch(/^0x[0-9a-fA-F]{64}$/);
      expect(hex.toLowerCase()).toBe('0x' + 'ab'.repeat(32));
    });

    it('should reject array that is not 32 bytes', () => {
      const bytes = new Uint8Array(31);

      expect(() => bytes32ToHex(bytes)).toThrow(/Expected 32 bytes/);
    });
  });
});

// Helper functions for creating test signatures

function createDERSignature(r: Uint8Array, s: Uint8Array): Uint8Array {
  // Remove leading zeros for DER encoding
  const rTrimmed = trimLeadingZeros(r);
  const sTrimmed = trimLeadingZeros(s);

  const totalLength = 2 + rTrimmed.length + 2 + sTrimmed.length;
  const result = new Uint8Array(2 + totalLength);

  let offset = 0;
  result[offset++] = 0x30; // SEQUENCE
  result[offset++] = totalLength;

  result[offset++] = 0x02; // INTEGER
  result[offset++] = rTrimmed.length;
  result.set(rTrimmed, offset);
  offset += rTrimmed.length;

  result[offset++] = 0x02; // INTEGER
  result[offset++] = sTrimmed.length;
  result.set(sTrimmed, offset);

  return result;
}

function createDERSignatureWithPadding(r: Uint8Array, s: Uint8Array): Uint8Array {
  // Add padding if high bit is set
  const rPadded = (r[0] & 0x80) ? concatBytes(new Uint8Array([0x00]), r) : r;
  const sPadded = (s[0] & 0x80) ? concatBytes(new Uint8Array([0x00]), s) : s;

  const totalLength = 2 + rPadded.length + 2 + sPadded.length;
  const result = new Uint8Array(2 + totalLength);

  let offset = 0;
  result[offset++] = 0x30;
  result[offset++] = totalLength;

  result[offset++] = 0x02;
  result[offset++] = rPadded.length;
  result.set(rPadded, offset);
  offset += rPadded.length;

  result[offset++] = 0x02;
  result[offset++] = sPadded.length;
  result.set(sPadded, offset);

  return result;
}

function trimLeadingZeros(bytes: Uint8Array): Uint8Array {
  let start = 0;
  while (start < bytes.length - 1 && bytes[start] === 0 && (bytes[start + 1] & 0x80) === 0) {
    start++;
  }
  return bytes.slice(start);
}

function concatBytes(a: Uint8Array, b: Uint8Array): Uint8Array {
  const result = new Uint8Array(a.length + b.length);
  result.set(a, 0);
  result.set(b, a.length);
  return result;
}

function hexToBytes(hex: string): Uint8Array {
  const cleaned = hex.replace(/^0x/, '');
  const bytes = new Uint8Array(cleaned.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(cleaned.substr(i * 2, 2), 16);
  }
  return bytes;
}
