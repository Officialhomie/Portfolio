/**
 * Passkey Account Implementation
 * Smart account with passkey/biometric authentication support
 */

import type { Address, Hex, PublicClient } from 'viem';
import type { ISmartAccount } from './ISmartAccount';
import type { BiometricAccountFactory } from '../factory/BiometricAccountFactory';
import type { ISigner } from '../signers';
import type { Owner } from '../core/types';

/**
 * Passkey Smart Account Implementation
 * ERC-4337 compatible smart account with passkey authentication
 */
export class PasskeyAccount implements ISmartAccount {
  private factory: BiometricAccountFactory;
  private signer: ISigner;
  private publicClient: PublicClient;
  private ownerBytes: Hex;
  private _address: Address | null = null;

  constructor(
    factory: BiometricAccountFactory,
    signer: ISigner,
    publicClient: PublicClient,
    ownerBytes: Hex
  ) {
    this.factory = factory;
    this.signer = signer;
    this.publicClient = publicClient;
    this.ownerBytes = ownerBytes;
  }

  /**
   * Get the smart account address
   */
  async getAddress(): Promise<Address> {
    if (!this._address) {
      // Use salt 0 for first account
      this._address = await this.factory.getAddress(this.ownerBytes, 0n);
    }
    return this._address;
  }

  /**
   * Check if the account is deployed on-chain
   */
  async isDeployed(): Promise<boolean> {
    const address = await this.getAddress();
    return await this.factory.isDeployed(address);
  }

  /**
   * Deploy the account to the blockchain
   */
  async deploy(): Promise<Hex> {
    return await this.factory.createAccount(this.ownerBytes, 0n);
  }

  /**
   * Get all owners of the account
   */
  async getOwners(): Promise<Owner[]> {
    // For passkey accounts, there's typically one owner (the passkey)
    // This would need to be implemented based on the actual contract
    return [{
      x: BigInt('0x' + this.ownerBytes.slice(2, 66)),
      y: BigInt('0x' + this.ownerBytes.slice(66, 130))
    }];
  }

  /**
   * Add a new owner to the account
   */
  async addOwner(owner: Hex): Promise<Hex> {
    // This would call the smart account contract's addOwner function
    // For now, return a mock transaction hash
    return `0x${Date.now().toString(16).padStart(64, '0')}` as Hex;
  }

  /**
   * Remove an owner from the account by index
   */
  async removeOwner(ownerIndex: bigint): Promise<Hex> {
    // This would call the smart account contract's removeOwner function
    // For now, return a mock transaction hash
    return `0x${Date.now().toString(16).padStart(64, '0')}` as Hex;
  }

  /**
   * Get the current nonce of the account
   */
  async getNonce(): Promise<bigint> {
    // This would typically read from the EntryPoint contract
    // For now, return 0
    return 0n;
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
  async getMetadata() {
    const address = await this.getAddress();
    const owners = await this.getOwners();
    const nonce = await this.getNonce();
    const balance = await this.getBalance();
    const isDeployed = await this.isDeployed();

    return {
      address,
      owners,
      nonce,
      balance,
      isDeployed,
    };
  }
}
