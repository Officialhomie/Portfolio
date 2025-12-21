/**
 * Smart Account Interface
 * Abstract interface for smart account implementations
 */

import type { Address, Hex } from 'viem';
import type { Owner, Awaitable } from '../core/types';

/**
 * Smart Account interface
 * All smart account implementations must conform to this interface
 */
export interface ISmartAccount {
  // ============================================================================
  // Address Management
  // ============================================================================

  /**
   * Get the smart account address
   */
  getAddress(): Awaitable<Address>;

  /**
   * Check if the account is deployed on-chain
   */
  isDeployed(): Awaitable<boolean>;

  /**
   * Deploy the account to the blockchain
   * @returns Transaction hash
   */
  deploy(): Awaitable<Hex>;

  // ============================================================================
  // Owner Management
  // ============================================================================

  /**
   * Get all owners of the account
   */
  getOwners(): Awaitable<Owner[]>;

  /**
   * Add a new owner to the account
   * @param owner - Owner bytes (64 bytes for passkey, 32 for address)
   */
  addOwner(owner: Hex): Awaitable<Hex>;

  /**
   * Remove an owner from the account by index
   * @param ownerIndex - Index of the owner to remove
   */
  removeOwner(ownerIndex: bigint): Awaitable<Hex>;

  // ============================================================================
  // Account Info
  // ============================================================================

  /**
   * Get the current nonce of the account
   */
  getNonce(): Awaitable<bigint>;

  /**
   * Get the account balance
   */
  getBalance(): Awaitable<bigint>;

  /**
   * Get account metadata
   */
  getMetadata(): Awaitable<{
    address: Address;
    owners: Owner[];
    nonce: bigint;
    balance: bigint;
    isDeployed: boolean;
  }>;
}

