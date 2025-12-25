/**
 * Smart Wallet Service
 * Manages BiometricWallet interactions for Fusaka-native biometric authentication
 *
 * @deprecated Biometric wallet functionality is not currently deployed
 */

import { type Address, type Hash, type Hex } from 'viem';

export interface PublicKey {
  x: `0x${string}`;
  y: `0x${string}`;
}

export interface Transaction {
  to: Address;
  value?: bigint;
  data: `0x${string}`;
}

/**
 * Compute smart wallet address from public key
 * @deprecated Biometric wallet functionality is not currently available
 */
export async function getSmartWalletAddress(
  publicKey: PublicKey,
  chainId: number,
  salt: `0x${string}` = `0x${'0'.repeat(64)}`
): Promise<Address> {
  throw new Error('Biometric wallet functionality is not currently available. Use Biconomy smart accounts instead.');
}

/**
 * Check if smart wallet is deployed
 * @deprecated Biometric wallet functionality is not currently available
 */
export async function isWalletDeployed(
  publicKey: PublicKey,
  chainId: number,
  salt: `0x${string}` = `0x${'0'.repeat(64)}`
): Promise<boolean> {
  throw new Error('Biometric wallet functionality is not currently available. Use Biconomy smart accounts instead.');
}

/**
 * Deploy smart wallet
 * @deprecated Biometric wallet functionality is not currently available
 */
export async function deploySmartWallet(
  publicKey: PublicKey,
  chainId: number,
  salt: `0x${string}` = `0x${'0'.repeat(64)}`
): Promise<{ walletAddress: Address; txHash: Hash }> {
  throw new Error('Biometric wallet functionality is not currently available. Use Biconomy smart accounts instead.');
}

/**
 * Sign and execute transaction via smart wallet
 * @deprecated Biometric wallet functionality is not currently available
 */
export async function signAndExecute(
  publicKey: PublicKey,
  transaction: Transaction,
  signature: { r: `0x${string}`; s: `0x${string}`; v: number },
  chainId: number,
  salt: `0x${string}` = `0x${'0'.repeat(64)}`
): Promise<Hash> {
  throw new Error('Biometric wallet functionality is not currently available. Use Biconomy smart accounts instead.');
}

/**
 * Register public key in smart wallet
 * @deprecated Biometric wallet functionality is not currently available
 */
export async function registerPublicKeyInWallet(
  publicKey: PublicKey,
  chainId: number,
  salt: `0x${string}` = `0x${'0'.repeat(64)}`
): Promise<void> {
  throw new Error('Biometric wallet functionality is not currently available. Use Biconomy smart accounts instead.');
}