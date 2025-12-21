/**
 * Middleware Interface
 * Abstract interface for middleware implementations
 */

import type { UserOperation, TransactionResult, Awaitable } from '../core/types';

/**
 * Middleware interface
 * All middleware implementations must conform to this interface
 */
export interface IMiddleware {
  /**
   * Middleware name (for identification)
   */
  readonly name: string;

  /**
   * Execute before UserOperation is sent
   * Can modify the UserOperation
   */
  before?(userOp: UserOperation): Awaitable<UserOperation>;

  /**
   * Execute after transaction completes
   * Can modify the result
   */
  after?(result: TransactionResult): Awaitable<TransactionResult>;
}

