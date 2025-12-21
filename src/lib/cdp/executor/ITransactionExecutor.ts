/**
 * Transaction Executor Interface
 * Abstract interface for transaction execution
 */

import type { Hex } from 'viem';
import type { Call, TransactionResult, SimulationResult, Awaitable } from '../core/types';

/**
 * Transaction Executor interface
 * All executor implementations must conform to this interface
 */
export interface ITransactionExecutor {
  // ============================================================================
  // Execute Transactions
  // ============================================================================

  /**
   * Execute a single transaction
   */
  execute(call: Call): Awaitable<TransactionResult>;

  /**
   * Execute multiple transactions in a batch
   */
  executeBatch(calls: Call[]): Awaitable<TransactionResult>;

  // ============================================================================
  // Simulation
  // ============================================================================

  /**
   * Simulate a transaction without executing it
   */
  simulate(call: Call): Awaitable<SimulationResult>;

  /**
   * Simulate a batch of transactions
   */
  simulateBatch(calls: Call[]): Awaitable<SimulationResult>;
}

