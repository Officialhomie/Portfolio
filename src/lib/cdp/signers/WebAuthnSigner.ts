/**
 * WebAuthn Signer Implementation
 * Uses secp256r1 (P-256) curve for biometric authentication
 */

import type { Address, Hex } from 'viem';
import { hashMessage, keccak256 } from 'viem';
import { ISigner } from './ISigner';
import { SignerType, type PublicKey, type Signature, type UserOperation } from '../core/types';
import { SignerError } from '../core/errors';
import { ERROR_CODES } from '../core/constants';
import { signWithBiometric, getStoredBiometricCredential, getStoredPublicKey } from '../../biometric/auth';
import { parseWebAuthnSignature } from '../../biometric/signature-parser';
import { getUserOperationHash } from '../operations/utils';

/**
 * WebAuthn Signer using secp256r1 (P-256) curve
 * Supports Face ID, Touch ID, and other WebAuthn authenticators
 */
export class WebAuthnSigner implements ISigner {
  readonly type = SignerType.WEBAUTHN;
  private credentialId: string | null = null;
  private publicKey: PublicKey | null = null;
  private cachedAddress: Address | null = null;

  /**
   * Initialize the signer from stored credentials
   */
  async initialize(): Promise<void> {
    // Import secure storage functions
    const { getStoredBiometricCredentialSecure, getStoredPublicKeySecure } = await import('../../biometric/storage-adapter');

    const credentialId = await getStoredBiometricCredentialSecure();
    const storedPublicKey = await getStoredPublicKeySecure();

    console.log('🔍 WebAuthnSigner.initialize() called');
    console.log('   Credential ID found:', !!credentialId);
    console.log('   Public Key found:', !!storedPublicKey);

    if (!credentialId) {
      console.error('❌ Missing credential ID in localStorage');
      console.error('   Key: biometric_credential_id');
      console.error('   Value:', localStorage.getItem('biometric_credential_id'));
      throw new SignerError(
        'Biometric credential ID not found. Please set up biometric authentication first.',
        ERROR_CODES.SIGNER_NOT_INITIALIZED
      );
    }

    if (!storedPublicKey || !storedPublicKey.x || !storedPublicKey.y) {
      console.error('❌ Missing public key in localStorage');
      console.error('   Key: biometric_public_key');
      console.error('   Value:', localStorage.getItem('biometric_public_key'));
      throw new SignerError(
        'Biometric public key not found. Please set up biometric authentication first.',
        ERROR_CODES.SIGNER_NOT_INITIALIZED
      );
    }

    // Validate public key format
    if (storedPublicKey.x.length !== 66 || storedPublicKey.y.length !== 66) {
      console.error('❌ Invalid public key format');
      console.error('   X length:', storedPublicKey.x.length, 'Expected: 66');
      console.error('   Y length:', storedPublicKey.y.length, 'Expected: 66');
      throw new SignerError(
        'Invalid public key format. Please re-setup biometric authentication.',
        ERROR_CODES.SIGNER_NOT_INITIALIZED
      );
    }

    this.credentialId = credentialId;
    this.publicKey = {
      x: BigInt(storedPublicKey.x),
      y: BigInt(storedPublicKey.y),
    };

    // Validate WebAuthn support
    if (typeof window === 'undefined' || !window.PublicKeyCredential) {
      throw new SignerError(
        'WebAuthn not available in this environment',
        ERROR_CODES.WEBAUTHN_NOT_SUPPORTED
      );
    }

    console.log('✅ WebAuthnSigner initialized successfully');
    console.log('   Credential ID:', credentialId.substring(0, 20) + '...');
    console.log('   Public Key X:', storedPublicKey.x.substring(0, 20) + '...');
  }

  /**
   * Get the signer's Ethereum address (derived from public key)
   */
  async getAddress(): Promise<Address> {
    if (this.cachedAddress) {
      return this.cachedAddress;
    }

    if (!this.publicKey) {
      await this.initialize();
    }

    if (!this.publicKey) {
      throw new SignerError('Public key not available', ERROR_CODES.SIGNER_NOT_INITIALIZED);
    }

    // Derive Ethereum address from secp256r1 public key
    const xHex = `0x${this.publicKey.x.toString(16).padStart(64, '0')}` as Hex;
    const yHex = `0x${this.publicKey.y.toString(16).padStart(64, '0')}` as Hex;
    const fullPublicKey = `${xHex}${yHex.slice(2)}` as Hex;
    const hash = keccak256(fullPublicKey);
    const address = `0x${hash.slice(-40)}` as Address;

    this.cachedAddress = address;
    return address;
  }

  /**
   * Get the signer's public key
   */
  async getPublicKey(): Promise<PublicKey> {
    if (!this.publicKey) {
      await this.initialize();
    }

    if (!this.publicKey) {
      throw new SignerError('Public key not available', ERROR_CODES.SIGNER_NOT_INITIALIZED);
    }

    return this.publicKey;
  }

  /**
   * Sign a message hash with biometric authentication
   */
  async signMessage(message: Hex): Promise<Signature> {
    if (!this.credentialId) {
      await this.initialize();
    }

    if (!this.credentialId) {
      throw new SignerError('Credential ID not available', ERROR_CODES.SIGNER_NOT_INITIALIZED);
    }

    try {
      // Ensure message is a hash (32 bytes)
      const messageHash = message.length === 66 ? message : hashMessage(message);
      const messageHashBytes = new Uint8Array(Buffer.from(messageHash.slice(2), 'hex'));

      // Sign with biometric (triggers Face ID/Touch ID prompt)
      const derSignature = await signWithBiometric(messageHashBytes, this.credentialId);

      // Parse DER signature to get r, s components
      const { r, s } = parseWebAuthnSignature(derSignature);

      return {
        r: BigInt(r),
        s: BigInt(s),
      };
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('canceled') || error.message.includes('abort')) {
          throw new SignerError('User canceled biometric authentication', ERROR_CODES.WEBAUTHN_CANCELED);
        }
        if (error.message.includes('timeout')) {
          throw new SignerError('Biometric authentication timeout', ERROR_CODES.WEBAUTHN_TIMEOUT);
        }
      }
      throw new SignerError(
        `Failed to sign message: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ERROR_CODES.INVALID_SIGNATURE,
        error
      );
    }
  }

  /**
   * Sign a UserOperation hash for ERC-4337
   */
  async signUserOperation(userOp: UserOperation): Promise<Hex> {
    // Get the UserOperation hash
    const userOpHash = getUserOperationHash(userOp);

    // Sign the hash
    const signature = await this.signMessage(userOpHash);

    // Encode signature as concatenated r + s (64 bytes)
    const rHex = `0x${signature.r.toString(16).padStart(64, '0')}`;
    const sHex = `0x${signature.s.toString(16).padStart(64, '0')}`;
    const encodedSignature = `${rHex}${sHex.slice(2)}` as Hex;

    return encodedSignature;
  }

  /**
   * Check if signer supports a feature
   */
  supports(feature: string): boolean {
    const supportedFeatures = ['biometric', 'webauthn', 'secp256r1', 'hardware-backed'];
    return supportedFeatures.includes(feature.toLowerCase());
  }

  /**
   * Check if signer is ready
   */
  async isReady(): Promise<boolean> {
    try {
      if (!this.credentialId || !this.publicKey) {
        await this.initialize();
      }
      return Boolean(this.credentialId && this.publicKey);
    } catch {
      return false;
    }
  }

  /**
   * Clean up resources
   */
  async dispose(): Promise<void> {
    this.credentialId = null;
    this.publicKey = null;
    this.cachedAddress = null;
  }
}

