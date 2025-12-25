/**
 * Gas Tracking Middleware
 * Tracks gas usage for analytics
 */

import { IMiddleware } from './IMiddleware';
import type { TransactionResult } from '../core/types';
import { FEATURE_FLAGS } from '../core/constants';

/**
 * Gas Tracking Middleware implementation
 */
export class GasTrackingMiddleware implements IMiddleware {
  readonly name = 'gas-tracking';

  async after(result: TransactionResult): Promise<TransactionResult> {
    if (FEATURE_FLAGS.enableGasTracking) {
      // In production, you would send this to analytics
      // For now, just log it
      console.log('📊 Gas Usage:', {
        gasUsed: result.gasUsed.toString(),
        userOpHash: result.userOpHash,
        success: result.success,
      });

      // Example: Send to analytics service
      // await analytics.track('gas_used', {
      //   gasUsed: result.gasUsed.toString(),
      //   userOpHash: result.userOpHash,
      // });
    }
    return result;
  }
}


