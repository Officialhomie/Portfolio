/**
 * Middleware Executor
 * Wraps an executor with middleware support
 */

import { ITransactionExecutor } from '../executor/ITransactionExecutor';
import { IMiddleware } from './IMiddleware';
import type { Call, TransactionResult, UserOperation } from '../core/types';

/**
 * Middleware Executor implementation
 * Composes middleware with a base executor
 */
export class MiddlewareExecutor implements ITransactionExecutor {
  private middlewares: IMiddleware[] = [];

  constructor(private baseExecutor: ITransactionExecutor) {}

  /**
   * Add middleware to the chain
   */
  use(middleware: IMiddleware): this {
    this.middlewares.push(middleware);
    return this;
  }

  /**
   * Execute a single transaction with middleware
   */
  async execute(call: Call): Promise<TransactionResult> {
    // Build UserOperation (we need to access the builder)
    // For now, we'll execute directly and apply middleware to the result
    let result = await this.baseExecutor.execute(call);

    // Run after hooks
    for (const mw of this.middlewares) {
      if (mw.after) {
        result = await mw.after(result);
      }
    }

    return result;
  }

  /**
   * Execute batch transactions with middleware
   */
  async executeBatch(calls: Call[]): Promise<TransactionResult> {
    let result = await this.baseExecutor.executeBatch(calls);

    // Run after hooks
    for (const mw of this.middlewares) {
      if (mw.after) {
        result = await mw.after(result);
      }
    }

    return result;
  }

  /**
   * Simulate a transaction
   */
  async simulate(call: Call) {
    return await this.baseExecutor.simulate(call);
  }

  /**
   * Simulate batch transactions
   */
  async simulateBatch(calls: Call[]) {
    return await this.baseExecutor.simulateBatch(calls);
  }
}


