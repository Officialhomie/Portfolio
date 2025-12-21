/**
 * Signer Interface
 * Abstract interface for different signature methods (WebAuthn, EOA, Hardware)
 *
 * Enables composability: swap signers without changing business logic
 */

import type { Address, Hex } from 'viem';
import type {
  SignerType,
  PublicKey,
  Signature,
  UserOperation,
  Awaitable,
} from '../core/types';

/**
 * Generic signer interface
 * All signer implementations must conform to this interface
 */
export interface ISigner {
  // ============================================================================
  // Identity Methods
  // ============================================================================

  /**
   * Get the signer's Ethereum address (derived from public key)
   * For secp256r1 signers, this computes an address from the P-256 public key
   */
  getAddress(): Awaitable<Address>;

  /**
   * Get the signer's public key
   * Format depends on signer type:
   * - WebAuthn/secp256r1: { x, y } coordinates
   * - EOA/secp256k1: compressed or uncompressed public key
   */
  getPublicKey(): Awaitable<PublicKey | Hex>;

  // ============================================================================
  // Signing Methods
  // ============================================================================

  /**
   * Sign a raw message hash
   * @param message - The message hash to sign (32 bytes)
   * @returns Signature (r, s, optionally v)
   */
  signMessage(message: Hex): Awaitable<Signature>;

  /**
   * Sign a UserOperation hash for ERC-4337
   * @param userOp - The UserOperation to sign
   * @returns Signature formatted for the smart account
   */
  signUserOperation(userOp: UserOperation): Awaitable<Hex>;

  // ============================================================================
  // Metadata Methods
  // ============================================================================

  /**
   * Get signer type
   */
  readonly type: SignerType;

  /**
   * Check if signer supports a specific feature
   * Examples: 'batch-signing', 'hardware-backed', 'biometric'
   */
  supports(feature: string): boolean;

  /**
   * Check if signer is ready to sign
   * For WebAuthn: checks if credentials are stored
   * For EOA: checks if private key is available
   */
  isReady(): Awaitable<boolean>;

  // ============================================================================
  // Lifecycle Methods (Optional)
  // ============================================================================

  /**
   * Initialize the signer (if needed)
   * For WebAuthn: may prompt for biometric authentication
   */
  initialize?(): Awaitable<void>;

  /**
   * Clean up resources
   */
  dispose?(): Awaitable<void>;
}

/**
 * Signer factory type
 * Used for dependency injection
 */
export type SignerFactory = () => Awaitable<ISigner>;

/**
 * Signer options for configuration
 */
export interface SignerOptions {
  /**
   * Optional account index for deterministic derivation
   */
  accountIndex?: number;

  /**
   * Custom user display name (for WebAuthn)
   */
  userName?: string;

  /**
   * Custom user ID (for WebAuthn)
   */
  userId?: string;

  /**
   * Timeout for signature operations (ms)
   */
  timeout?: number;

  /**
   * Additional metadata
   */
  metadata?: Record<string, unknown>;
}

/**
 * Helper type: Extract signer type from implementation
 */
export type InferSignerType<T extends ISigner> = T['type'];

/**
 * Type guard: Check if object implements ISigner
 */
export function isSigner(obj: unknown): obj is ISigner {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'getAddress' in obj &&
    'getPublicKey' in obj &&
    'signMessage' in obj &&
    'signUserOperation' in obj &&
    'type' in obj &&
    'supports' in obj &&
    'isReady' in obj
  );
}
