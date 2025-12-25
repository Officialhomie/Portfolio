/**
 * Biometric Account Factory
 * Factory for creating smart accounts with biometric/passkey authentication
 */

import type { Address, Hex, PublicClient } from 'viem';
import type { IAccountFactory } from './IAccountFactory';
import { FACTORY_ADDRESSES, IMPLEMENTATION_ADDRESSES } from '../core/constants';

/**
 * Biometric Account Factory Implementation
 * Creates accounts using CREATE2 with deterministic addresses
 */
export class BiometricAccountFactory implements IAccountFactory {
  private publicClient: PublicClient;
  private factoryAddress: Address;
  private implementationAddress: Address;

  constructor(
    factoryAddress: Address,
    publicClient: PublicClient,
    implementationAddress?: Address
  ) {
    this.factoryAddress = factoryAddress;
    this.publicClient = publicClient;
    const chainId = this.publicClient.chain?.id;
    this.implementationAddress = implementationAddress || (chainId ? IMPLEMENTATION_ADDRESSES[chainId] : '0x');
  }

  /**
   * Get the counterfactual address of an account
   */
  async getAddress(owner: Hex, salt: bigint): Promise<Address> {
    // This would typically call the factory contract's getAddress function
    // For now, return a mock address
    return `0x${owner.slice(2).padStart(40, '0')}` as Address;
  }

  /**
   * Create a new account
   */
  async createAccount(owner: Hex, salt: bigint): Promise<Hex> {
    // This would typically call the factory contract's createAccount function
    // For now, return a mock transaction hash
    return `0x${Date.now().toString(16).padStart(64, '0')}` as Hex;
  }

  /**
   * Check if an account is deployed
   */
  async isDeployed(address: Address): Promise<boolean> {
    try {
      const code = await this.publicClient.getCode({ address });
      return code !== undefined && code !== '0x';
    } catch {
      return false;
    }
  }

  /**
   * Get the implementation address
   */
  getImplementation(): Address {
    return this.implementationAddress;
  }
}
