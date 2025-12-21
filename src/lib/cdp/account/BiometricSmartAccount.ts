/**
 * Biometric Smart Account Implementation
 * Wraps the BiometricSmartAccount contract with a clean interface
 */

import type { Address, Hex, PublicClient } from 'viem';
import { encodeFunctionData } from 'viem';
import { ISmartAccount } from './ISmartAccount';
import { AccountError } from '../core/errors';
import { ERROR_CODES } from '../core/constants';
import type { Owner, PublicKey } from '../core/types';
import { IAccountFactory } from '../factory/IAccountFactory';
import { ISigner } from '../signers/ISigner';

// ABI for BiometricSmartAccount
const ACCOUNT_ABI = [
  {
    name: 'execute',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'target', type: 'address' },
      { name: 'value', type: 'uint256' },
      { name: 'data', type: 'bytes' },
    ],
    outputs: [],
  },
  {
    name: 'executeBatch',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'targets', type: 'address[]' },
      { name: 'values', type: 'uint256[]' },
      { name: 'data', type: 'bytes[]' },
    ],
    outputs: [],
  },
  {
    name: 'getOwners',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'bytes[]' }],
  },
  {
    name: 'getNonce',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'nonce',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const;

/**
 * Biometric Smart Account implementation
 */
export class BiometricSmartAccount implements ISmartAccount {
  private address: Address | null = null;
  private ownerBytes: Hex;
  public readonly factory: IAccountFactory; // Expose factory for initCode generation

  constructor(
    factory: IAccountFactory,
    private signer: ISigner,
    private publicClient: PublicClient,
    ownerBytes: Hex
  ) {
    this.factory = factory;
    this.ownerBytes = ownerBytes;
  }

  /**
   * Get the smart account address
   * CRITICAL: This uses CREATE2 to compute deterministic address
   */
  async getAddress(): Promise<Address> {
    if (this.address) {
      return this.address;
    }

    // CRITICAL FIX #4: Always compute fresh from factory to ensure consistency
    const computedAddress = await this.factory.getAddress(this.ownerBytes, 0n);
    
    // CRITICAL FIX #5: Validate ownerBytes stability
    if (!this.ownerBytes || this.ownerBytes.length < 66) {
      throw new AccountError(
        `Invalid ownerBytes: length ${this.ownerBytes?.length || 0}, expected 66 (address) or 130 (passkey)`,
        ERROR_CODES.INVALID_OWNER
      );
    }
    
    this.address = computedAddress;
    console.log('📍 Computed smart account address:', computedAddress);
    console.log('   Owner bytes length:', this.ownerBytes.length);
    console.log('   Owner bytes (first 50):', this.ownerBytes.substring(0, 50) + '...');
    
    return this.address;
  }

  /**
   * Check if the account is deployed
   * CRITICAL: Always checks fresh on-chain, never caches
   */
  async isDeployed(): Promise<boolean> {
    const address = await this.getAddress();
    // CRITICAL FIX #1: Always check fresh on-chain code
    const code = await this.publicClient.getCode({ address });
    const deployed = code !== undefined && code !== '0x';
    
    console.log('🔍 Checking deployment status...');
    console.log('   Address:', address);
    console.log('   Code length:', code?.length || 0);
    console.log('   Is deployed:', deployed);
    
    return deployed;
  }

  /**
   * Deploy the account
   * Note: In ERC-4337, accounts are deployed counterfactually via UserOperation.
   * This returns the initCode that will be used in the first UserOperation.
   * Actual deployment happens automatically when the first UserOperation is executed.
   */
  async deploy(): Promise<Hex> {
    if (await this.isDeployed()) {
      throw new AccountError('Account already deployed', ERROR_CODES.ACCOUNT_ALREADY_DEPLOYED);
    }

    // Return initCode for counterfactual deployment
    // This will be used in UserOperation.initCode
    return await this.factory.createAccount(this.ownerBytes, 0n);
  }

  /**
   * Get all owners
   */
  async getOwners(): Promise<Owner[]> {
    const address = await this.getAddress();
    
    if (!(await this.isDeployed())) {
      // Return the initial owner if not deployed yet
      return [this.ownerBytes as Owner];
    }

    try {
      const owners = await this.publicClient.readContract({
        address,
        abi: ACCOUNT_ABI,
        functionName: 'getOwners',
      });

      // Convert bytes[] to Owner[]
      return owners.map((owner: Hex) => owner as Owner);
    } catch (error) {
      throw new AccountError(
        `Failed to get owners: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ERROR_CODES.OWNER_NOT_FOUND,
        error
      );
    }
  }

  /**
   * Add a new owner
   * Note: This requires executing a transaction through the executor
   */
  async addOwner(owner: Hex): Promise<Hex> {
    const address = await this.getAddress();
    
    // Validate owner length (32 bytes for address, 64 bytes for passkey)
    if (owner.length !== 66 && owner.length !== 130) {
      throw new AccountError(
        `Invalid owner length: ${owner.length}. Expected 32 or 64 bytes`,
        ERROR_CODES.INVALID_OWNER
      );
    }

    // Encode addOwner call
    const callData = encodeFunctionData({
      abi: [
        {
          name: 'addOwner',
          type: 'function',
          stateMutability: 'nonpayable',
          inputs: [{ name: 'owner', type: 'bytes' }],
          outputs: [],
        },
      ],
      functionName: 'addOwner',
      args: [owner],
    });

    // Return the call data - actual execution should be done via executor
    // This allows the caller to build a UserOperation with this call
    return callData;
  }

  /**
   * Remove an owner by index
   * Note: This requires executing a transaction through the executor
   */
  async removeOwner(ownerIndex: bigint): Promise<Hex> {
    const address = await this.getAddress();
    
    // Encode removeOwner call
    const callData = encodeFunctionData({
      abi: [
        {
          name: 'removeOwner',
          type: 'function',
          stateMutability: 'nonpayable',
          inputs: [{ name: 'ownerIndex', type: 'uint256' }],
          outputs: [],
        },
      ],
      functionName: 'removeOwner',
      args: [ownerIndex],
    });

    // Return the call data - actual execution should be done via executor
    return callData;
  }

  /**
   * Get the current nonce
   * CRITICAL FIX #2: Returns 0n for undeployed accounts (correct for ERC-4337)
   */
  async getNonce(): Promise<bigint> {
    const address = await this.getAddress();
    
    // CRITICAL FIX #1: Check deployment fresh
    const code = await this.publicClient.getCode({ address });
    const isDeployed = code !== undefined && code !== '0x';

    if (!isDeployed) {
      console.log('📝 Account not deployed, returning nonce 0');
      return 0n; // CRITICAL: 0n is correct for first transaction
    }

    try {
      const nonce = await this.publicClient.readContract({
        address,
        abi: ACCOUNT_ABI,
        functionName: 'getNonce',
      });

      return BigInt(nonce as bigint);
    } catch {
      // Fallback to reading nonce directly
      try {
        const nonce = await this.publicClient.readContract({
          address,
          abi: ACCOUNT_ABI,
          functionName: 'nonce',
        });
        return BigInt(nonce as bigint);
      } catch (error) {
        throw new AccountError(
          `Failed to get nonce: ${error instanceof Error ? error.message : 'Unknown error'}`,
          ERROR_CODES.ACCOUNT_NOT_DEPLOYED,
          error
        );
      }
    }
  }

  /**
   * Get the account balance
   */
  async getBalance(): Promise<bigint> {
    const address = await this.getAddress();
    return await this.publicClient.getBalance({ address });
  }

  /**
   * Get account metadata
   */
  async getMetadata(): Promise<{
    address: Address;
    owners: Owner[];
    nonce: bigint;
    balance: bigint;
    isDeployed: boolean;
  }> {
    const address = await this.getAddress();
    const [owners, nonce, balance, isDeployed] = await Promise.all([
      this.getOwners(),
      this.getNonce(),
      this.getBalance(),
      this.isDeployed(),
    ]);

    return {
      address,
      owners,
      nonce,
      balance,
      isDeployed,
    };
  }

  /**
   * Encode execute call data
   */
  encodeExecuteCall(target: Address, value: bigint, data: Hex): Hex {
    return encodeFunctionData({
      abi: ACCOUNT_ABI,
      functionName: 'execute',
      args: [target, value, data],
    });
  }

  /**
   * Encode executeBatch call data
   */
  encodeExecuteBatchCall(
    targets: Address[],
    values: bigint[],
    data: Hex[]
  ): Hex {
    return encodeFunctionData({
      abi: ACCOUNT_ABI,
      functionName: 'executeBatch',
      args: [targets, values, data],
    });
  }
}

