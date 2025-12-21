/**
 * Core TypeScript types for ERC-4337 Smart Account System
 * Shared across all modules for type safety and composability
 */

import type { Address, Hex, Chain } from 'viem';

// ============================================================================
// ERC-4337 Types
// ============================================================================

/**
 * UserOperation structure (ERC-4337 v0.6)
 * @see https://eips.ethereum.org/EIPS/eip-4337
 */
export interface UserOperation {
  sender: Address;
  nonce: bigint;
  initCode: Hex;
  callData: Hex;
  callGasLimit: bigint;
  verificationGasLimit: bigint;
  preVerificationGas: bigint;
  maxFeePerGas: bigint;
  maxPriorityFeePerGas: bigint;
  paymasterAndData: Hex;
  signature: Hex;
}

/**
 * Gas estimate for UserOperation
 */
export interface GasEstimate {
  callGasLimit: bigint;
  verificationGasLimit: bigint;
  preVerificationGas: bigint;
  maxFeePerGas: bigint;
  maxPriorityFeePerGas: bigint;
}

/**
 * UserOperation receipt
 */
export interface UserOperationReceipt {
  userOpHash: Hex;
  entryPoint: Address;
  sender: Address;
  nonce: bigint;
  paymaster?: Address;
  actualGasCost: bigint;
  actualGasUsed: bigint;
  success: boolean;
  reason?: string;
  logs: Log[];
  receipt: TransactionReceipt;
}

// ============================================================================
// Transaction Types
// ============================================================================

/**
 * Simple transaction call
 */
export interface Call {
  to: Address;
  value?: bigint;
  data?: Hex;
}

/**
 * Transaction result
 */
export interface TransactionResult {
  userOpHash: Hex;
  txHash: Hex;
  blockNumber: bigint;
  gasUsed: bigint;
  success: boolean;
  logs?: Log[];
}

/**
 * Simulation result
 */
export interface SimulationResult {
  success: boolean;
  gasUsed: bigint;
  returnData?: Hex;
  error?: string;
}

/**
 * Transaction receipt
 */
export interface TransactionReceipt {
  transactionHash: Hex;
  blockNumber: bigint;
  blockHash: Hex;
  gasUsed: bigint;
  effectiveGasPrice: bigint;
  status: 'success' | 'reverted';
  logs: Log[];
}

/**
 * Event log
 */
export interface Log {
  address: Address;
  topics: Hex[];
  data: Hex;
  blockNumber: bigint;
  transactionHash: Hex;
  logIndex: number;
}

// ============================================================================
// Signer Types
// ============================================================================

/**
 * Signer type enumeration
 */
export enum SignerType {
  WEBAUTHN = 'webauthn',
  EOA = 'eoa',
  HARDWARE = 'hardware',
  MOCK = 'mock',
}

/**
 * Public key for secp256r1 (P-256) curve
 */
export interface PublicKey {
  x: bigint;
  y: bigint;
}

/**
 * Generic signature structure
 */
export interface Signature {
  r: bigint;
  s: bigint;
  v?: number;
}

/**
 * WebAuthn-specific signature
 * @see https://www.w3.org/TR/webauthn-2/
 */
export interface WebAuthnSignature extends Signature {
  authenticatorData: Uint8Array;
  clientDataJSON: string;
  challengeIndex: number;
  typeIndex: number;
}

/**
 * Signature wrapper for smart account
 * Contains owner index + actual signature data
 */
export interface SignatureWrapper {
  ownerIndex: number;
  signatureData: Hex;
}

// ============================================================================
// Account Types
// ============================================================================

/**
 * Owner data (can be passkey or address)
 */
export type Owner = PublicKey | Address;

/**
 * Account deployment status
 */
export interface DeploymentStatus {
  isDeployed: boolean;
  address: Address;
  balance: bigint;
}

/**
 * Account metadata
 */
export interface AccountMetadata {
  address: Address;
  owners: Owner[];
  nonce: bigint;
  balance: bigint;
  isDeployed: boolean;
  implementation?: Address;
}

// ============================================================================
// Bundler Types
// ============================================================================

/**
 * Bundler configuration
 */
export interface BundlerConfig {
  rpcUrl: string;
  entryPoint: Address;
  chain: Chain;
  timeout?: number;
}

/**
 * Paymaster configuration
 */
export interface PaymasterConfig {
  enabled: boolean;
  type?: 'cdp' | 'pimlico' | 'alchemy' | 'custom';
  rpcUrl?: string;
  policyId?: string;
}

// ============================================================================
// Factory Types
// ============================================================================

/**
 * Factory configuration
 */
export interface FactoryConfig {
  address: Address;
  implementation: Address;
  chain: Chain;
}

/**
 * Account creation parameters
 */
export interface CreateAccountParams {
  owner: Hex; // Encoded owner bytes (64 bytes for passkey, 32 for address)
  salt?: bigint;
}

// ============================================================================
// Middleware Types
// ============================================================================

/**
 * Middleware context
 */
export interface MiddlewareContext {
  userOp: UserOperation;
  account: Address;
  chain: Chain;
  timestamp: number;
}

/**
 * Middleware result
 */
export interface MiddlewareResult {
  userOp: UserOperation;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// Error Types
// ============================================================================
// Error classes are exported from ./errors.ts

// ============================================================================
// Configuration Types
// ============================================================================

/**
 * Smart wallet configuration
 */
export interface SmartWalletConfig {
  chainId: number;
  signer: SignerType | 'custom';
  paymaster?: PaymasterConfig;
  factory?: Address;
  bundler?: string;
  entryPoint?: Address;
}

/**
 * Module configuration
 */
export interface ModuleConfig {
  enabled: boolean;
  options?: Record<string, unknown>;
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Awaitable type
 */
export type Awaitable<T> = T | Promise<T>;

/**
 * Maybe type
 */
export type Maybe<T> = T | null | undefined;

/**
 * Result type (for error handling)
 */
export type Result<T, E = Error> =
  | { ok: true; value: T }
  | { ok: false; error: E };

/**
 * Hex string type guard
 */
export function isHex(value: unknown): value is Hex {
  return typeof value === 'string' && /^0x[0-9a-fA-F]*$/.test(value);
}

/**
 * Address type guard
 */
export function isAddress(value: unknown): value is Address {
  return typeof value === 'string' && /^0x[0-9a-fA-F]{40}$/.test(value);
}
