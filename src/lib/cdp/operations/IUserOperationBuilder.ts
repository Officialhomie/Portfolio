/**
 * UserOperation Builder Interface
 * Abstract interface for building ERC-4337 UserOperations
 */

import type { Hex } from 'viem';
import type { UserOperation, Call, GasEstimate, Awaitable } from '../core/types';

/**
 * UserOperation Builder interface
 * All builder implementations must conform to this interface
 */
export interface IUserOperationBuilder {
  // ============================================================================
  // Build UserOperation
  // ============================================================================

  /**
   * Build a UserOperation from a single call
   */
  build(call: Call): Awaitable<UserOperation>;

  /**
   * Build a UserOperation from multiple calls (batch)
   */
  buildBatch(calls: Call[]): Awaitable<UserOperation>;

  // ============================================================================
  // Encoding
  // ============================================================================

  /**
   * Encode a single call to callData
   */
  encodeCallData(call: Call): Hex;

  /**
   * Encode multiple calls to batch callData
   */
  encodeBatchCallData(calls: Call[]): Hex;

  // ============================================================================
  // Gas Estimation
  // ============================================================================

  /**
   * Estimate gas for a UserOperation
   */
  estimateGas(userOp: UserOperation): Awaitable<GasEstimate>;
}

