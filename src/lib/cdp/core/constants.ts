/**
 * Core constants for ERC-4337 Smart Account System
 * Centralized configuration for addresses, chains, and defaults
 */

import { type Address, type Chain } from 'viem';
import { base, baseSepolia } from 'viem/chains';

// ============================================================================
// ERC-4337 Standard Addresses
// ============================================================================

/**
 * EntryPoint v0.6.0 address (same across all chains)
 * @see https://github.com/eth-infinitism/account-abstraction
 */
export const ENTRYPOINT_ADDRESS: Address = '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789';

// ============================================================================
// Biometric Smart Account Addresses
// ============================================================================

/**
 * PasskeyAccountFactory addresses per chain
 * Defaults to deployed addresses if env vars not set
 */
export const FACTORY_ADDRESSES: Record<number, Address> = {
  [base.id]: (process.env.NEXT_PUBLIC_PASSKEY_ACCOUNT_FACTORY_BASE as Address) || '0x6DE5AF843d270E45A9541805aA42E14544E4AD5c',
  [baseSepolia.id]: (process.env.NEXT_PUBLIC_PASSKEY_ACCOUNT_FACTORY_BASE_SEPOLIA as Address) || '0x',
};

/**
 * PasskeyAccount implementation addresses per chain
 * Defaults to deployed addresses if env vars not set
 */
export const IMPLEMENTATION_ADDRESSES: Record<number, Address> = {
  [base.id]: (process.env.NEXT_PUBLIC_PASSKEY_ACCOUNT_IMPLEMENTATION_BASE as Address) || '0x82953c1869aAAD1d61628dbD588E443BD83Be7Dc',
  [baseSepolia.id]: (process.env.NEXT_PUBLIC_PASSKEY_ACCOUNT_IMPLEMENTATION_BASE_SEPOLIA as Address) || '0x',
};

// ============================================================================
// CDP (Coinbase Developer Platform) Configuration
// ============================================================================

/**
 * CDP Bundler + Paymaster RPC URLs
 * Combined endpoint for both bundler and paymaster functionality
 */
export const CDP_BUNDLER_URLS: Record<number, string> = {
  [base.id]: process.env.NEXT_PUBLIC_CDP_PAYMASTER_RPC_URL_BASE || '',
  [baseSepolia.id]: process.env.NEXT_PUBLIC_CDP_PAYMASTER_RPC_URL_SEPOLIA || '',
};

/**
 * CDP configuration per chain
 */
export interface CDPChainConfig {
  chain: Chain;
  bundlerUrl: string;
  rpcUrl: string;
  factoryAddress: Address;
  implementationAddress: Address;
  entryPoint: Address;
}

export const CDP_CONFIGS: Record<number, CDPChainConfig> = {
  [base.id]: {
    chain: base,
    bundlerUrl: CDP_BUNDLER_URLS[base.id],
    rpcUrl: process.env.NEXT_PUBLIC_BASE_RPC_URL || 'https://mainnet.base.org',
    factoryAddress: FACTORY_ADDRESSES[base.id],
    implementationAddress: IMPLEMENTATION_ADDRESSES[base.id],
    entryPoint: ENTRYPOINT_ADDRESS,
  },
  [baseSepolia.id]: {
    chain: baseSepolia,
    bundlerUrl: CDP_BUNDLER_URLS[baseSepolia.id],
    rpcUrl: process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org',
    factoryAddress: FACTORY_ADDRESSES[baseSepolia.id],
    implementationAddress: IMPLEMENTATION_ADDRESSES[baseSepolia.id],
    entryPoint: ENTRYPOINT_ADDRESS,
  },
};

// ============================================================================
// Gas Configuration
// ============================================================================

/**
 * Default gas limits for UserOperations
 */
export const DEFAULT_GAS_LIMITS = {
  callGasLimit: 150_000n,
  verificationGasLimit: 150_000n,
  preVerificationGas: 21_000n,
} as const;

/**
 * Gas multipliers for estimation safety margins
 */
export const GAS_MULTIPLIERS = {
  callGas: 1.2, // 20% buffer
  verificationGas: 1.3, // 30% buffer
  preVerificationGas: 1.1, // 10% buffer
} as const;

/**
 * Maximum gas limits (safety checks)
 */
export const MAX_GAS_LIMITS = {
  callGasLimit: 10_000_000n,
  verificationGasLimit: 5_000_000n,
  preVerificationGas: 100_000n,
} as const;

// ============================================================================
// WebAuthn Configuration
// ============================================================================

/**
 * WebAuthn relying party configuration
 */
export const WEBAUTHN_CONFIG = {
  rpName: 'Web3 Portfolio',
  rpId: typeof window !== 'undefined' ? window.location.hostname : 'localhost',
  timeout: 60000, // 60 seconds
  userVerification: 'preferred' as UserVerificationRequirement,
  authenticatorAttachment: 'platform' as AuthenticatorAttachment,
} as const;

/**
 * WebAuthn credential storage keys
 */
export const WEBAUTHN_STORAGE_KEYS = {
  credentialId: 'webauthn_credential_id',
  publicKey: 'webauthn_public_key',
  accountAddress: 'smart_account_address',
} as const;

// ============================================================================
// Account Configuration
// ============================================================================

/**
 * Default salt for deterministic account addresses
 */
export const DEFAULT_ACCOUNT_SALT = 0n;

/**
 * Maximum number of owners per account
 */
export const MAX_OWNERS = 10;

/**
 * Owner types
 */
export const OWNER_TYPES = {
  ADDRESS: 32, // 32 bytes for Ethereum address
  PASSKEY: 64, // 64 bytes for secp256r1 public key (x, y)
} as const;

// ============================================================================
// Timeout Configuration
// ============================================================================

/**
 * RPC request timeouts (milliseconds)
 */
export const TIMEOUTS = {
  rpc: 30_000, // 30 seconds
  bundler: 60_000, // 60 seconds
  userOp: 120_000, // 2 minutes
  webauthn: 60_000, // 60 seconds
} as const;

// ============================================================================
// Error Codes
// ============================================================================

/**
 * Standard error codes for debugging
 */
export const ERROR_CODES = {
  // Signer errors
  SIGNER_NOT_INITIALIZED: 'SIGNER_NOT_INITIALIZED',
  WEBAUTHN_NOT_SUPPORTED: 'WEBAUTHN_NOT_SUPPORTED',
  WEBAUTHN_CANCELED: 'WEBAUTHN_CANCELED',
  WEBAUTHN_TIMEOUT: 'WEBAUTHN_TIMEOUT',
  INVALID_SIGNATURE: 'INVALID_SIGNATURE',

  // Account errors
  ACCOUNT_NOT_DEPLOYED: 'ACCOUNT_NOT_DEPLOYED',
  ACCOUNT_ALREADY_DEPLOYED: 'ACCOUNT_ALREADY_DEPLOYED',
  INVALID_OWNER: 'INVALID_OWNER',
  OWNER_NOT_FOUND: 'OWNER_NOT_FOUND',
  MAX_OWNERS_REACHED: 'MAX_OWNERS_REACHED',

  // Bundler errors
  BUNDLER_RPC_ERROR: 'BUNDLER_RPC_ERROR',
  USEROP_REJECTED: 'USEROP_REJECTED',
  INSUFFICIENT_FUNDS: 'INSUFFICIENT_FUNDS',
  GAS_ESTIMATION_FAILED: 'GAS_ESTIMATION_FAILED',

  // Paymaster errors
  PAYMASTER_REJECTED: 'PAYMASTER_REJECTED',
  PAYMASTER_NOT_CONFIGURED: 'PAYMASTER_NOT_CONFIGURED',
  CONTRACT_NOT_ALLOWLISTED: 'CONTRACT_NOT_ALLOWLISTED',

  // Factory errors
  FACTORY_NOT_CONFIGURED: 'FACTORY_NOT_CONFIGURED',
  CREATE_ACCOUNT_FAILED: 'CREATE_ACCOUNT_FAILED',
  ADDRESS_COMPUTATION_FAILED: 'ADDRESS_COMPUTATION_FAILED',

  // General errors
  INVALID_CHAIN: 'INVALID_CHAIN',
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT: 'TIMEOUT',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const;

// ============================================================================
// Feature Flags
// ============================================================================

/**
 * Feature flags for enabling/disabling functionality
 */
export const FEATURE_FLAGS = {
  enableLogging: process.env.NODE_ENV === 'development',
  enableGasTracking: true,
  enablePaymaster: true,
  enableBatching: true,
  enableSimulation: true,
} as const;

// ============================================================================
// Validation Helpers
// ============================================================================

/**
 * Get configuration for a specific chain
 */
export function getChainConfig(chainId: number): CDPChainConfig {
  const config = CDP_CONFIGS[chainId];
  if (!config) {
    throw new Error(`Unsupported chain ID: ${chainId}`);
  }
  
  // Validate factory address is set
  if (!config.factoryAddress || config.factoryAddress === '0x' || config.factoryAddress.length < 42) {
    console.error('❌ Factory address not configured for chain', chainId);
    console.error('   Factory address:', config.factoryAddress);
    throw new Error(
      `Factory address not configured for chain ${chainId}. ` +
      `Please set NEXT_PUBLIC_PASSKEY_ACCOUNT_FACTORY_BASE in .env.local or update constants.ts`
    );
  }
  
  // Validate implementation address is set
  if (!config.implementationAddress || config.implementationAddress === '0x' || config.implementationAddress.length < 42) {
    console.error('❌ Implementation address not configured for chain', chainId);
    console.error('   Implementation address:', config.implementationAddress);
    throw new Error(
      `Implementation address not configured for chain ${chainId}. ` +
      `Please set NEXT_PUBLIC_PASSKEY_ACCOUNT_IMPLEMENTATION_BASE in .env.local or update constants.ts`
    );
  }
  
  console.log('✅ Chain config validated for chain', chainId);
  console.log('   Factory:', config.factoryAddress);
  console.log('   Implementation:', config.implementationAddress);
  
  return config;
}

/**
 * Validate factory address is configured
 */
export function validateFactoryAddress(chainId: number): Address {
  const address = FACTORY_ADDRESSES[chainId];
  if (!address || address === '0x') {
    throw new Error(
      `Factory address not configured for chain ${chainId}. ` +
      `Please set NEXT_PUBLIC_PASSKEY_ACCOUNT_FACTORY_BASE or NEXT_PUBLIC_PASSKEY_ACCOUNT_FACTORY_BASE_SEPOLIA`
    );
  }
  return address;
}

/**
 * Validate bundler URL is configured
 */
export function validateBundlerUrl(chainId: number): string {
  const url = CDP_BUNDLER_URLS[chainId];
  if (!url) {
    throw new Error(
      `Bundler URL not configured for chain ${chainId}. ` +
      `Please set NEXT_PUBLIC_CDP_PAYMASTER_RPC_URL_BASE or NEXT_PUBLIC_CDP_PAYMASTER_RPC_URL_SEPOLIA`
    );
  }
  return url;
}

/**
 * Check if chain is supported
 */
export function isSupportedChain(chainId: number): boolean {
  return chainId in CDP_CONFIGS;
}

/**
 * Get supported chain IDs
 */
export function getSupportedChains(): number[] {
  return Object.keys(CDP_CONFIGS).map(Number);
}
