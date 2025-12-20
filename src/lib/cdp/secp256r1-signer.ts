/**
 * Custom Secp256r1 Signer for CDP Smart Accounts
 * Integrates WebAuthn biometric authentication (Face ID/Touch ID) with permissionless.js
 *
 * This signer ONLY supports secp256r1 (P256) signatures - NO fallback to secp256k1
 */

import { type Hex, type SignableMessage, hashMessage, keccak256, encodePacked } from 'viem';
import { signWithBiometric, getStoredBiometricCredential, getStoredPublicKey } from '../biometric/auth';
import { parseWebAuthnSignature } from '../biometric/signature-parser';

export interface Secp256r1SignerConfig {
  credentialId: string;
  publicKey: {
    x: Hex;
    y: Hex;
  };
}

/**
 * Custom signer implementation for CDP that uses secp256r1 (biometric) signatures
 */
export class Secp256r1Signer {
  private credentialId: string;
  public publicKey: { x: Hex; y: Hex };

  constructor(config: Secp256r1SignerConfig) {
    this.credentialId = config.credentialId;
    this.publicKey = config.publicKey;
  }

  /**
   * Get signer address (derived from public key)
   * For secp256r1, we derive an Ethereum address from the public key coordinates
   * This creates a deterministic 20-byte address from the P-256 public key
   *
   * Important: Ethereum addresses are 20 bytes (40 hex characters after 0x)
   * We take the last 20 bytes of the keccak256 hash, NOT the full 32 bytes
   */
  async getAddress(): Promise<Hex> {
    // Validate public key coordinates
    if (!this.publicKey.x || !this.publicKey.y) {
      throw new Error('Invalid public key: missing x or y coordinate');
    }

    // Validate that coordinates are proper 32-byte hex strings
    if (this.publicKey.x.length !== 66 || this.publicKey.y.length !== 66) {
      throw new Error(
        `Invalid public key format: x=${this.publicKey.x.length}, y=${this.publicKey.y.length} (expected 66 chars each with 0x prefix)`
      );
    }

    // Concatenate x and y coordinates to form the full public key (64 bytes)
    // Remove 0x prefix from y coordinate before concatenating
    const fullPublicKey = `${this.publicKey.x}${this.publicKey.y.slice(2)}` as Hex;

    // Hash the public key with keccak256 (produces 32 bytes)
    const hash = keccak256(fullPublicKey);

    // Take the LAST 20 bytes (40 hex characters) to form an Ethereum address
    // hash.slice(-40) gives us the last 40 characters (20 bytes)
    const address = `0x${hash.slice(-40)}` as Hex;

    // Validate the final address is proper length (42 chars: '0x' + 40 hex chars)
    if (address.length !== 42) {
      throw new Error(`Invalid address length: ${address.length}, expected 42`);
    }

    console.log('🔑 Derived Ethereum address from secp256r1 public key:');
    console.log('   Public Key X:', this.publicKey.x);
    console.log('   Public Key Y:', this.publicKey.y);
    console.log('   Full PubKey Hash:', hash);
    console.log('   Ethereum Address (20 bytes):', address);

    return address;
  }

  /**
   * Sign a message using WebAuthn biometric authentication
   * Returns secp256r1 signature (r, s components)
   */
  async signMessage(message: SignableMessage): Promise<Hex> {
    try {
      // Hash the message to get 32 bytes
      const messageHash = hashMessage(message);
      const messageHashBytes = new Uint8Array(Buffer.from(messageHash.slice(2), 'hex'));

      // Sign with biometric (Face ID/Touch ID)
      const derSignature = await signWithBiometric(messageHashBytes, this.credentialId);
      
      // Parse DER signature to get r, s
      const { r, s } = parseWebAuthnSignature(derSignature);

      // Encode signature as concatenated r + s (64 bytes total)
      const encodedSignature = `${r}${s.slice(2)}` as Hex;

      return encodedSignature;
    } catch (error) {
      console.error('Biometric signing failed:', error);
      throw new Error('Failed to sign message with biometric authentication');
    }
  }

  /**
   * Sign typed data (EIP-712)
   * Note: WebAuthn doesn't natively support EIP-712, so we sign the hash
   */
  async signTypedData(typedData: any): Promise<Hex> {
    // For typed data, we convert to a signable string
    const messageHash = hashMessage(JSON.stringify(typedData));
    return this.signMessage(messageHash);
  }

  /**
   * Get the public key in raw format
   */
  getPublicKey(): { x: Hex; y: Hex } {
    return this.publicKey;
  }

  /**
   * Get credential ID
   */
  getCredentialId(): string {
    return this.credentialId;
  }

  /**
   * Static factory method to create signer from stored credentials
   */
  static fromStored(): Secp256r1Signer | null {
    const credentialId = getStoredBiometricCredential();
    const publicKey = getStoredPublicKey();

    if (!credentialId || !publicKey) {
      console.warn('No stored biometric credentials found');
      return null;
    }

    // Validate credential ID format
    if (typeof credentialId !== 'string' || credentialId.length === 0) {
      console.error('Invalid credential ID format');
      return null;
    }

    // Validate public key format
    if (!publicKey.x || !publicKey.y) {
      console.error('Invalid public key: missing coordinates');
      return null;
    }

    // Validate hex format (should start with 0x and be 66 chars)
    const hexPattern = /^0x[0-9a-fA-F]{64}$/;
    if (!hexPattern.test(publicKey.x) || !hexPattern.test(publicKey.y)) {
      console.error('Invalid public key: coordinates must be 32-byte hex strings');
      return null;
    }

    try {
      return new Secp256r1Signer({
        credentialId,
        publicKey: {
          x: publicKey.x as Hex,
          y: publicKey.y as Hex,
        },
      });
    } catch (error) {
      console.error('Failed to create signer from stored credentials:', error);
      return null;
    }
  }

  /**
   * Check if biometric signer is available
   */
  static isAvailable(): boolean {
    const credentialId = getStoredBiometricCredential();
    const publicKey = getStoredPublicKey();
    return Boolean(credentialId && publicKey);
  }
}

/**
 * Create a signer instance from stored biometric credentials
 * Includes comprehensive validation of stored credentials
 */
export function createBiometricSigner(): Secp256r1Signer {
  // Check if WebAuthn is available
  if (typeof window === 'undefined' || !window.PublicKeyCredential) {
    throw new Error(
      'WebAuthn not available. Biometric authentication requires a browser with WebAuthn support.'
    );
  }

  const signer = Secp256r1Signer.fromStored();

  if (!signer) {
    throw new Error(
      'Biometric credentials not found or invalid. Please set up biometric authentication first.'
    );
  }

  // Additional validation: verify the signer can derive an address
  signer.getAddress().catch((error) => {
    console.error('Signer validation failed:', error);
    throw new Error('Stored biometric credentials are corrupted. Please re-register.');
  });

  return signer;
}

