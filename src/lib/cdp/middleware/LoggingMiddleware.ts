/**
 * Logging Middleware
 * Logs UserOperations and transaction results
 */

import { IMiddleware } from './IMiddleware';
import type { UserOperation, TransactionResult } from '../core/types';
import { FEATURE_FLAGS } from '../core/constants';

/**
 * Logging Middleware implementation
 */
export class LoggingMiddleware implements IMiddleware {
  readonly name = 'logging';

  async before(userOp: UserOperation): Promise<UserOperation> {
    if (FEATURE_FLAGS.enableLogging) {
      console.log('📤 Sending UserOperation:', {
        sender: userOp.sender,
        nonce: userOp.nonce.toString(),
        callData: userOp.callData.substring(0, 20) + '...',
        gasLimit: userOp.callGasLimit.toString(),
      });
    }
    return userOp;
  }

  async after(result: TransactionResult): Promise<TransactionResult> {
    if (FEATURE_FLAGS.enableLogging) {
      console.log('✅ Transaction confirmed:', {
        userOpHash: result.userOpHash,
        txHash: result.txHash,
        blockNumber: result.blockNumber.toString(),
        gasUsed: result.gasUsed.toString(),
        success: result.success,
      });
    }
    return result;
  }
}

