/**
 * Composable ERC-4337 Smart Account System
 * Public API for the CDP smart account architecture
 */

// ============================================================================
// Core Types & Constants
// ============================================================================
export * from './core/types';
export * from './core/constants';
export * from './core/errors';

// ============================================================================
// Signers
// ============================================================================
export type { ISigner, SignerOptions, SignerFactory } from './signers';
export { WebAuthnSigner } from './signers';
export { EOASigner } from './signers';

// ============================================================================
// Account
// ============================================================================
export type { ISmartAccount } from './account';
export { PasskeyAccount } from './account';

// ============================================================================
// Factory
// ============================================================================
export type { IAccountFactory } from './factory';
export { PasskeyAccountFactory } from './factory';

// ============================================================================
// Operations
// ============================================================================
export type { IUserOperationBuilder } from './operations';
export { UserOperationBuilder } from './operations';
export { getUserOperationHash } from './operations';

// ============================================================================
// Bundler
// ============================================================================
export type { IBundlerClient } from './bundler';
export { CDPBundlerClient } from './bundler';

// ============================================================================
// Executor
// ============================================================================
export type { ITransactionExecutor } from './executor';
export { SmartAccountExecutor } from './executor';

// ============================================================================
// Middleware
// ============================================================================
export type { IMiddleware } from './middleware';
export { LoggingMiddleware } from './middleware';
export { GasTrackingMiddleware } from './middleware';
export { MiddlewareExecutor } from './middleware';

// ============================================================================
// Container
// ============================================================================
export { SmartWalletContainer } from './container';

// ============================================================================
// Factory Functions
// ============================================================================

import type { Address, Hex, PublicClient, Chain } from 'viem';
import { createPublicClient, http } from 'viem';
import { base, baseSepolia } from 'viem/chains';
import { WebAuthnSigner } from './signers';
import type { ISigner } from './signers';
import { PasskeyAccount } from './account';
import type { ISmartAccount } from './account';
import { PasskeyAccountFactory } from './factory';
import { UserOperationBuilder } from './operations';
import { CDPBundlerClient, PimlicoBundlerClient, type IBundlerClient } from './bundler';
import { SmartAccountExecutor } from './executor';
import type { ITransactionExecutor } from './executor';
import { MiddlewareExecutor } from './middleware';
import { LoggingMiddleware, GasTrackingMiddleware } from './middleware';
import { getChainConfig, ENTRYPOINT_ADDRESS, PIMLICO_BUNDLER_URLS, CDP_BUNDLER_URLS } from './core/constants';

/**
 * Smart Wallet Configuration
 */
export interface SmartWalletConfig {
  chainId: number;
  signer?: 'webauthn' | 'eoa' | ISigner;
  paymaster?: boolean;
  factory?: Address;
  bundler?: string;
  bundlerType?: 'cdp' | 'pimlico'; // Bundler selection: 'pimlico' (default, recommended) or 'cdp' (deprecated)
  entryPoint?: Address;
  eoaAddress?: Address; // Optional: EOA address to use for EOA signer
}

/**
 * Create a smart wallet with the composable architecture
 */
export async function createSmartWallet(config: SmartWalletConfig): Promise<{
  account: ISmartAccount;
  executor: ITransactionExecutor;
  signer: ISigner;
}> {
  const chainConfig = getChainConfig(config.chainId);
  const chain: Chain = chainConfig.chain;

  // Create public client
  const publicClient = createPublicClient({
    chain,
    transport: http(chainConfig.rpcUrl),
  });

  // Create signer
  let signer: ISigner;
  if (typeof config.signer === 'object' && 'type' in config.signer) {
    signer = config.signer;
  } else if (config.signer === 'webauthn' || !config.signer) {
    const webAuthnSigner = new WebAuthnSigner();
    await webAuthnSigner.initialize();
    signer = webAuthnSigner;
  } else {
    const { EOASigner } = await import('./signers');
    // CRITICAL FIX: Pass EOA address if provided, so signer doesn't need to query window.ethereum
    const eoaSigner = new EOASigner(config.eoaAddress);
    await eoaSigner.initialize();
    signer = eoaSigner;
  }

  // Get owner bytes from signer
  // CRITICAL FIX #5: Ensure ownerBytes stability - always pad consistently
  const publicKey = await signer.getPublicKey();
  let ownerBytes: Hex;
  
  if (typeof publicKey === 'object' && 'x' in publicKey && 'y' in publicKey) {
    // secp256r1 public key (64 bytes = 32 bytes X + 32 bytes Y)
    // CRITICAL: Must pad to exactly 64 hex chars (32 bytes) each
    const xHex = `0x${publicKey.x.toString(16).padStart(64, '0')}` as Hex;
    const yHex = `0x${publicKey.y.toString(16).padStart(64, '0')}` as Hex;
    // Concatenate: 0x + 64 chars X + 64 chars Y = 130 chars total = 65 bytes
    ownerBytes = `${xHex}${yHex.slice(2)}` as Hex;
    
    // CRITICAL FIX #5: Validate length for stability
    if (ownerBytes.length !== 130) {
      throw new Error(
        `Invalid ownerBytes length for passkey: ${ownerBytes.length}, expected 130. ` +
        `This will cause address mismatch between getAddress() and createAccount().`
      );
    }
    
    console.log('🔑 Generated ownerBytes from passkey:');
    console.log('   Length:', ownerBytes.length, '(should be 130)');
    console.log('   X:', xHex);
    console.log('   Y:', yHex);
  } else {
    // Address (32 bytes padded to 66 chars with 0x prefix)
    const addressHex = publicKey as Hex;
    if (!addressHex.startsWith('0x') || addressHex.length !== 42) {
      throw new Error(`Invalid address format: ${addressHex}`);
    }
    // Pad to 32 bytes: 0x + 24 zeros + 20 byte address = 66 chars
    ownerBytes = `0x${'0'.repeat(24)}${addressHex.slice(2)}` as Hex;
    
    // CRITICAL FIX #5: Validate length for stability
    if (ownerBytes.length !== 66) {
      throw new Error(
        `Invalid ownerBytes length for address: ${ownerBytes.length}, expected 66. ` +
        `This will cause address mismatch between getAddress() and createAccount().`
      );
    }
    
    console.log('🔑 Generated ownerBytes from address:');
    console.log('   Length:', ownerBytes.length, '(should be 66)');
    console.log('   Address:', addressHex);
  }

  // Create factory
  const factory = new PasskeyAccountFactory(chainConfig.factoryAddress, publicClient);

  // Create account
  const account = new PasskeyAccount(factory, signer, publicClient, ownerBytes);

  // Create bundler based on bundlerType (default to Pimlico for deployment sponsorship)
  const bundlerType = config.bundlerType || 'pimlico';
  let bundler: IBundlerClient;
  
  if (bundlerType === 'pimlico') {
    const bundlerUrl = config.bundler || PIMLICO_BUNDLER_URLS[config.chainId];
    if (!bundlerUrl || bundlerUrl === '') {
      console.warn('⚠️ Pimlico bundler URL not configured, falling back to CDP');
      // Fallback to CDP if Pimlico not configured
      const cdpUrl = config.bundler || chainConfig.bundlerUrl;
      bundler = new CDPBundlerClient(
        cdpUrl,
        config.entryPoint || ENTRYPOINT_ADDRESS,
        http(cdpUrl),
        config.chainId
      );
    } else {
      bundler = new PimlicoBundlerClient({
        rpcUrl: bundlerUrl,
        entryPoint: config.entryPoint || ENTRYPOINT_ADDRESS,
        chainId: config.chainId,
      });
      console.log('✅ Using Pimlico bundler (supports deployment sponsorship)');
    }
  } else {
    // CDP bundler (deprecated)
    const bundlerUrl = config.bundler || chainConfig.bundlerUrl;
    bundler = new CDPBundlerClient(
      bundlerUrl,
      config.entryPoint || ENTRYPOINT_ADDRESS,
      http(bundlerUrl),
      config.chainId
    );
    console.warn('⚠️ Using CDP bundler (deprecated - does not support deployment sponsorship)');
  }

  // Create builder with bundler for gas estimation
  const builder = new UserOperationBuilder(
    account,
    config.entryPoint || ENTRYPOINT_ADDRESS,
    publicClient,
    chain.id,
    bundler // Pass bundler for real gas estimation
  );

  // Create executor
  const baseExecutor = new SmartAccountExecutor(account, signer, builder, bundler);

  // Wrap with middleware
  const executor = new MiddlewareExecutor(baseExecutor)
    .use(new LoggingMiddleware())
    .use(new GasTrackingMiddleware());

  return {
    account,
    executor,
    signer,
  };
}

