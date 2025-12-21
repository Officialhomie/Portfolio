/**
 * Biometric Account Factory Implementation
 * Wraps the BiometricSmartAccountFactory contract
 */

import type { Address, Hex, PublicClient } from 'viem';
import { encodeFunctionData } from 'viem';
import { IAccountFactory } from './IAccountFactory';
import { FactoryError } from '../core/errors';
import { ERROR_CODES } from '../core/constants';

// ABI for BiometricSmartAccountFactory
const FACTORY_ABI = [
  {
    name: 'createAccount',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'owner', type: 'bytes' },
      { name: 'salt', type: 'uint256' },
    ],
    outputs: [{ name: 'account', type: 'address' }],
  },
  {
    name: 'getAddress',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'bytes' },
      { name: 'salt', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'address' }],
  },
  {
    name: 'accountImplementation',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
  },
] as const;

/**
 * Biometric Account Factory implementation
 */
export class BiometricAccountFactory implements IAccountFactory {
  public readonly factoryAddress: Address; // Expose for initCode generation

  constructor(
    factoryAddress: Address,
    private publicClient: PublicClient
  ) {
    this.factoryAddress = factoryAddress;
    if (!factoryAddress || factoryAddress === '0x') {
      throw new FactoryError(
        'Factory address not configured',
        ERROR_CODES.FACTORY_NOT_CONFIGURED
      );
    }
  }

  /**
   * Get the counterfactual address of an account
   */
  async getAddress(owner: Hex, salt: bigint): Promise<Address> {
    try {
      const address = await this.publicClient.readContract({
        address: this.factoryAddress,
        abi: FACTORY_ABI,
        functionName: 'getAddress',
        args: [owner, salt],
      });

      return address as Address;
    } catch (error) {
      throw new FactoryError(
        `Failed to compute address: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ERROR_CODES.ADDRESS_COMPUTATION_FAILED,
        error
      );
    }
  }

  /**
   * Create a new account
   * Returns the encoded call data for the factory.createAccount function
   * Actual deployment should be done via UserOperation (counterfactual deployment)
   */
  async createAccount(owner: Hex, salt: bigint): Promise<Hex> {
    // Encode the factory.createAccount call
    // This will be used as initCode in UserOperation for counterfactual deployment
    const callData = encodeFunctionData({
      abi: FACTORY_ABI,
      functionName: 'createAccount',
      args: [owner, salt],
    });

    // Return initCode format: factoryAddress + callData
    return `${this.factoryAddress}${callData.slice(2)}` as Hex;
  }

  /**
   * Check if an account is deployed
   */
  async isDeployed(address: Address): Promise<boolean> {
    const code = await this.publicClient.getCode({ address });
    return code !== undefined && code !== '0x';
  }

  /**
   * Get the implementation address
   */
  async getImplementation(): Promise<Address> {
    try {
      const implementation = await this.publicClient.readContract({
        address: this.factoryAddress,
        abi: FACTORY_ABI,
        functionName: 'accountImplementation',
      });

      return implementation as Address;
    } catch (error) {
      throw new FactoryError(
        `Failed to get implementation: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ERROR_CODES.FACTORY_NOT_CONFIGURED,
        error
      );
    }
  }
}

