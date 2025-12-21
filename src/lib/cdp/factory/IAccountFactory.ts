/**
 * Account Factory Interface
 * Abstract interface for account factory implementations
 */

import type { Address, Hex } from 'viem';
import type { Awaitable } from '../core/types';

/**
 * Account Factory interface
 * All factory implementations must conform to this interface
 */
export interface IAccountFactory {
  // ============================================================================
  // Address Computation
  // ============================================================================

  /**
   * Get the counterfactual address of an account
   * @param owner - Owner bytes (64 bytes for passkey, 32 for address)
   * @param salt - Salt for CREATE2 (use 0 for first account)
   */
  getAddress(owner: Hex, salt: bigint): Awaitable<Address>;

  // ============================================================================
  // Deployment
  // ============================================================================

  /**
   * Create a new account
   * @param owner - Owner bytes
   * @param salt - Salt for CREATE2
   * @returns Transaction hash
   */
  createAccount(owner: Hex, salt: bigint): Awaitable<Hex>;

  /**
   * Check if an account is deployed
   * @param address - Account address to check
   */
  isDeployed(address: Address): Awaitable<boolean>;

  // ============================================================================
  // Factory Info
  // ============================================================================

  /**
   * Get the implementation address
   */
  getImplementation(): Awaitable<Address>;
}

