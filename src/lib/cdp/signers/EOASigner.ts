/**
 * EOA (Externally Owned Account) Signer Implementation
 * Fallback signer for traditional Ethereum wallets
 */

import type { Address, Hex } from 'viem';
import { hashMessage } from 'viem';
import { ISigner } from './ISigner';
import { SignerType, type PublicKey, type Signature, type UserOperation } from '../core/types';
import { SignerError } from '../core/errors';
import { ERROR_CODES } from '../core/constants';
import { getUserOperationHash } from '../operations/utils';

/**
 * EOA Signer using secp256k1 (traditional Ethereum signing)
 * Falls back to injected wallet (MetaMask, Coinbase Wallet, etc.)
 */
export class EOASigner implements ISigner {
  readonly type = SignerType.EOA;
  private walletClient: any = null;
  private account: Address | null = null;
  private providedAddress: Address | null = null;

  /**
   * Constructor - optionally provide EOA address directly
   */
  constructor(address?: Address) {
    if (address) {
      this.providedAddress = address;
      this.account = address;
    }
  }

  /**
   * Initialize the signer from an injected wallet or use provided address
   */
  async initialize(): Promise<void> {
    // If address was provided in constructor, use it
    if (this.providedAddress) {
      this.account = this.providedAddress;
      
      // Still need walletClient for signing, but try to get it from window.ethereum
      if (typeof window !== 'undefined' && window.ethereum) {
        try {
          const { createWalletClient, custom } = await import('viem');
          const { base, baseSepolia } = await import('viem/chains');

          const chainId = await (window.ethereum as any).request({ method: 'eth_chainId' });
          const chain = parseInt(chainId, 16) === base.id ? base : baseSepolia;

          this.walletClient = createWalletClient({
            chain,
            transport: custom(window.ethereum as any),
          });
        } catch (error) {
          // Wallet client creation failed, but we can still use the address for address computation
          console.warn('Failed to create wallet client, but address is available:', error);
        }
      }
      return;
    }

    // Fallback to original behavior: query window.ethereum
    if (typeof window === 'undefined' || !window.ethereum) {
      throw new SignerError(
        'No Ethereum provider found. Please install MetaMask or another Web3 wallet.',
        ERROR_CODES.SIGNER_NOT_INITIALIZED
      );
    }

    try {
      // Dynamically import viem to avoid SSR issues
      const { createWalletClient, custom } = await import('viem');
      const { base, baseSepolia } = await import('viem/chains');

      // Get the chain ID to determine which chain to use
      const chainId = await (window.ethereum as any).request({ method: 'eth_chainId' });
      const chain = parseInt(chainId, 16) === base.id ? base : baseSepolia;

      this.walletClient = createWalletClient({
        chain,
        transport: custom(window.ethereum as any),
      });

      // Get connected accounts
      const accounts = await (window.ethereum as any).request({ method: 'eth_accounts' });
      if (!accounts || accounts.length === 0) {
        throw new SignerError(
          'No account connected. Please connect your wallet.',
          ERROR_CODES.SIGNER_NOT_INITIALIZED
        );
      }

      this.account = accounts[0] as Address;
    } catch (error) {
      throw new SignerError(
        `Failed to initialize EOA signer: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ERROR_CODES.SIGNER_NOT_INITIALIZED,
        error
      );
    }
  }

  /**
   * Get the signer's Ethereum address
   */
  async getAddress(): Promise<Address> {
    if (!this.account) {
      await this.initialize();
    }

    if (!this.account) {
      throw new SignerError('Account not available', ERROR_CODES.SIGNER_NOT_INITIALIZED);
    }

    return this.account;
  }

  /**
   * Get the signer's public key
   * Note: EOA signers don't expose public keys directly
   */
  async getPublicKey(): Promise<PublicKey | Hex> {
    // For EOA, we can't easily get the public key without signing
    // Return the address as a hex string instead
    return await this.getAddress();
  }

  /**
   * Sign a message hash
   */
  async signMessage(message: Hex): Promise<Signature> {
    if (!this.walletClient || !this.account) {
      await this.initialize();
    }

    if (!this.walletClient || !this.account) {
      throw new SignerError('Signer not initialized', ERROR_CODES.SIGNER_NOT_INITIALIZED);
    }

    try {
      // Ensure message is a hash (32 bytes)
      const messageHash = message.length === 66 ? message : hashMessage(message);

      // Sign with the wallet
      const signature = await this.walletClient.signMessage({
        account: this.account,
        message: { raw: messageHash },
      });

      // Parse the signature (viem returns hex string)
      // EOA signatures are 65 bytes: r (32) + s (32) + v (1)
      const r = BigInt(`0x${signature.slice(2, 66)}`);
      const s = BigInt(`0x${signature.slice(66, 130)}`);
      const v = parseInt(signature.slice(130, 132), 16);

      return { r, s, v };
    } catch (error) {
      if (error instanceof Error && error.message.includes('rejected')) {
        throw new SignerError('User rejected signature request', ERROR_CODES.WEBAUTHN_CANCELED);
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

    // Encode signature as concatenated r + s + v (65 bytes for EOA)
    const rHex = `0x${signature.r.toString(16).padStart(64, '0')}`;
    const sHex = `0x${signature.s.toString(16).padStart(64, '0')}`;
    const vHex = signature.v !== undefined ? signature.v.toString(16).padStart(2, '0') : '1b';
    const encodedSignature = `${rHex}${sHex.slice(2)}${vHex}` as Hex;

    return encodedSignature;
  }

  /**
   * Check if signer supports a feature
   */
  supports(feature: string): boolean {
    const supportedFeatures = ['eoa', 'secp256k1', 'injected-wallet'];
    return supportedFeatures.includes(feature.toLowerCase());
  }

  /**
   * Check if signer is ready
   */
  async isReady(): Promise<boolean> {
    try {
      if (!this.account) {
        await this.initialize();
      }
      return Boolean(this.account && this.walletClient);
    } catch {
      return false;
    }
  }

  /**
   * Clean up resources
   */
  async dispose(): Promise<void> {
    this.walletClient = null;
    this.account = null;
  }
}

