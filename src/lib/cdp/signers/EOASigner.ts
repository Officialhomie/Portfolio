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

    // Verify account is still connected
    try {
      if (typeof window !== 'undefined' && window.ethereum) {
        const accounts = await (window.ethereum as any).request({ method: 'eth_accounts' });
        if (!accounts || accounts.length === 0) {
          throw new SignerError(
            'No account connected. Please reconnect your wallet in MetaMask.',
            ERROR_CODES.SIGNER_NOT_INITIALIZED
          );
        }
        const currentAccount = accounts[0].toLowerCase();
        if (currentAccount !== this.account.toLowerCase()) {
          console.warn('⚠️ Account mismatch detected!');
          console.warn('   Expected:', this.account);
          console.warn('   Current:', currentAccount);
          console.warn('   Updating to current account...');
          this.account = accounts[0] as Address;
        }
      }
    } catch (checkError) {
      console.warn('Could not verify account connection:', checkError);
    }

    try {
      // Ensure message is a hash (32 bytes)
      const messageHash = message.length === 66 ? message : hashMessage(message);

      console.log('📝 Requesting MetaMask signature...');
      console.log('   Account:', this.account);
      console.log('   Message hash:', messageHash.substring(0, 20) + '...');
      console.log('   💡 Please approve the signature request in MetaMask');

      // CRITICAL FIX: Use window.ethereum.request directly for reliable MetaMask popup
      // Viem's signMessage sometimes doesn't trigger MetaMask popup correctly when
      // account is passed as a plain address string. Using window.ethereum.request
      // directly ensures MetaMask shows the popup reliably.
      if (typeof window === 'undefined' || !window.ethereum) {
        throw new SignerError(
          'MetaMask not found. Please install and connect MetaMask.',
          ERROR_CODES.SIGNER_NOT_INITIALIZED
        );
      }

      console.log('   🔄 Calling window.ethereum.request(personal_sign)...');
      console.log('   This should trigger MetaMask popup');

      let signature: Hex;
      try {
        // Use personal_sign for signing the hash
        // Note: For ERC-4337 UserOperation hashes, we need to sign the raw hash
        // personal_sign will add the Ethereum message prefix, but MetaMask handles this correctly
        // when signing a hex string that's already a hash

        signature = await (window.ethereum as any).request({
          method: 'personal_sign',
          params: [messageHash, this.account],
        }) as Hex;

        console.log('✅ Signature received from MetaMask via personal_sign');
      } catch (signError: any) {
        console.error('❌ MetaMask signature error:', signError);
        console.error('   Code:', signError?.code);
        console.error('   Message:', signError?.message);

        if (signError?.code === 4001 || signError?.message?.includes('User rejected') || signError?.message?.includes('rejected')) {
          throw new SignerError(
            'Signature request was rejected. Please approve the signature in MetaMask to continue.',
            ERROR_CODES.WEBAUTHN_CANCELED,
            signError
          );
        }

        if (signError?.code === 4100 || signError?.message?.includes('not been authorized')) {
          console.error('   ⚠️ MetaMask authorization error - troubleshooting:');
          console.error('      1. Check MetaMask extension is unlocked');
          console.error('      2. Verify correct account is selected:', this.account);
          console.error('      3. Refresh the page');
          console.error('      4. Check browser popup blocker settings');
          console.error('      5. Try clicking MetaMask extension icon manually');

          throw new SignerError(
            'MetaMask signature not authorized. Please:\n' +
            '1. Make sure MetaMask is unlocked\n' +
            '2. Check that the correct account is selected\n' +
            '3. Refresh the page and try again\n' +
            '4. If no popup appears, check MetaMask extension permissions\n' +
            '5. Try clicking the MetaMask extension icon in your browser toolbar',
            ERROR_CODES.INVALID_SIGNATURE,
            signError
          );
        }

        throw new SignerError(
          `Failed to sign message: ${signError?.message || 'Unknown error'}`,
          ERROR_CODES.INVALID_SIGNATURE,
          signError
        );
      }

      // Parse the signature (MetaMask returns hex string)
      // EOA signatures are 65 bytes: r (32) + s (32) + v (1)
      // personal_sign returns signature in format: 0x + r (64 chars) + s (64 chars) + v (2 chars) = 132 chars total
      if (!signature || signature.length !== 132) {
        throw new SignerError(
          `Invalid signature format: expected 132 chars, got ${signature?.length || 0}`,
          ERROR_CODES.INVALID_SIGNATURE
        );
      }
      
      const r = BigInt(`0x${signature.slice(2, 66)}`);
      const s = BigInt(`0x${signature.slice(66, 130)}`);
      const v = parseInt(signature.slice(130, 132), 16);

      return { r, s, v };
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('rejected') || error.message.includes('User rejected')) {
          throw new SignerError(
            'Signature request was rejected. Please approve the signature in MetaMask to continue.',
            ERROR_CODES.WEBAUTHN_CANCELED,
            error
          );
        }
        if (error.message.includes('not been authorized') || error.message.includes('4100')) {
          throw new SignerError(
            'MetaMask signature not authorized. Please:\n' +
            '1. Make sure MetaMask is unlocked\n' +
            '2. Check that the correct account is selected\n' +
            '3. Approve the signature request when it appears\n' +
            '4. If no popup appears, check MetaMask extension permissions',
            ERROR_CODES.INVALID_SIGNATURE,
            error
          );
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

