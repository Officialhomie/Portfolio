/**
 * Bundler Client Interface
 * Abstract interface for bundler implementations
 */

import type { Hex } from 'viem';
import type { UserOperation, GasEstimate, UserOperationReceipt, Awaitable } from '../core/types';

/**
 * Bundler Client interface
 * All bundler implementations must conform to this interface
 */
export interface IBundlerClient {
  // ============================================================================
  // Submit UserOperation
  // ============================================================================

  /**
   * Send a UserOperation to the bundler
   */
  sendUserOperation(userOp: UserOperation): Awaitable<Hex>;

  /**
   * Get UserOperation receipt
   */
  getUserOperationReceipt(hash: Hex): Awaitable<UserOperationReceipt>;

  /**
   * Wait for UserOperation receipt
   */
  waitForUserOperationReceipt(hash: Hex, timeout?: number): Awaitable<UserOperationReceipt>;

  // ============================================================================
  // Gas Estimation
  // ============================================================================

  /**
   * Estimate gas for a UserOperation
   */
  estimateUserOperationGas(userOp: UserOperation): Awaitable<GasEstimate>;

  // ============================================================================
  // Paymaster
  // ============================================================================

  /**
   * Sponsor a UserOperation with paymaster
   */
  sponsorUserOperation(userOp: UserOperation): Awaitable<UserOperation>;
}


