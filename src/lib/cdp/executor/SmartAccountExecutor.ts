/**
 * Smart Account Executor Implementation
 * Orchestrates the full transaction flow: Build → Sign → Submit → Wait
 */

import type { Hex } from 'viem';
import { ITransactionExecutor } from './ITransactionExecutor';
import { ISmartAccount } from '../account/ISmartAccount';
import { ISigner } from '../signers/ISigner';
import { IUserOperationBuilder } from '../operations/IUserOperationBuilder';
import { IBundlerClient } from '../bundler/IBundlerClient';
import { UserOperationError } from '../core/errors';
import { ERROR_CODES } from '../core/constants';
import type { Call, TransactionResult, SimulationResult, UserOperation } from '../core/types';

/**
 * Smart Account Executor implementation
 * Orchestrates the complete transaction flow
 */
export class SmartAccountExecutor implements ITransactionExecutor {
  constructor(
    private account: ISmartAccount,
    private signer: ISigner,
    private builder: IUserOperationBuilder,
    private bundler: IBundlerClient
  ) {}

  /**
   * Execute a single transaction
   */
  async execute(call: Call): Promise<TransactionResult> {
    try {
      // 1. Build UserOperation
      const userOp = await this.builder.build(call);

      // 2. Sponsor UserOperation with paymaster BEFORE signing
      // The signature must include paymaster data
      console.log('💰 Requesting paymaster sponsorship...');
      const sponsoredUserOp = await this.bundler.sponsorUserOperation(userOp);
      
      if (sponsoredUserOp.paymasterAndData === '0x') {
        console.warn('⚠️ Paymaster sponsorship failed or not available');
        console.warn('   UserOperation will proceed without sponsorship');
        console.warn('   Account needs ETH balance to pay for gas');
      } else {
        console.log('✅ Paymaster sponsorship received');
        console.log('   Paymaster data:', sponsoredUserOp.paymasterAndData.substring(0, 20) + '...');
      }

      // 3. Sign UserOperation (with paymaster data included)
      const signature = await this.signer.signUserOperation(sponsoredUserOp);
      const signedUserOp: UserOperation = { ...sponsoredUserOp, signature };

      // 4. Submit to bundler
      const userOpHash = await this.bundler.sendUserOperation(signedUserOp);

      // 4. Wait for receipt
      const receipt = await this.bundler.waitForUserOperationReceipt(userOpHash);

      // 5. Return result
      return {
        userOpHash,
        txHash: receipt.receipt.transactionHash,
        blockNumber: receipt.receipt.blockNumber,
        gasUsed: receipt.receipt.gasUsed,
        success: receipt.success,
        logs: receipt.logs,
      };
    } catch (error) {
      throw new UserOperationError(
        `Transaction execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ERROR_CODES.USEROP_REJECTED,
        error
      );
    }
  }

  /**
   * Execute multiple transactions in a batch
   */
  async executeBatch(calls: Call[]): Promise<TransactionResult> {
    if (calls.length === 0) {
      throw new UserOperationError('Cannot execute empty batch', ERROR_CODES.USEROP_REJECTED);
    }

    try {
      // 1. Build batch UserOperation
      const userOp = await this.builder.buildBatch(calls);

      // 2. Sponsor UserOperation with paymaster BEFORE signing
      console.log('💰 Requesting paymaster sponsorship for batch...');
      const sponsoredUserOp = await this.bundler.sponsorUserOperation(userOp);
      
      if (sponsoredUserOp.paymasterAndData === '0x') {
        console.warn('⚠️ Paymaster sponsorship failed or not available');
        console.warn('   UserOperation will proceed without sponsorship');
      } else {
        console.log('✅ Paymaster sponsorship received');
      }

      // 3. Sign UserOperation (with paymaster data included)
      const signature = await this.signer.signUserOperation(sponsoredUserOp);
      const signedUserOp: UserOperation = { ...sponsoredUserOp, signature };

      // 4. Submit to bundler
      const userOpHash = await this.bundler.sendUserOperation(signedUserOp);

      // 4. Wait for receipt
      const receipt = await this.bundler.waitForUserOperationReceipt(userOpHash);

      // 5. Return result
      return {
        userOpHash,
        txHash: receipt.receipt.transactionHash,
        blockNumber: receipt.receipt.blockNumber,
        gasUsed: receipt.receipt.gasUsed,
        success: receipt.success,
        logs: receipt.logs,
      };
    } catch (error) {
      throw new UserOperationError(
        `Batch transaction execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ERROR_CODES.USEROP_REJECTED,
        error
      );
    }
  }

  /**
   * Simulate a transaction without executing it
   */
  async simulate(call: Call): Promise<SimulationResult> {
    try {
      // Build UserOperation
      const userOp = await this.builder.build(call);

      // Estimate gas (this simulates the transaction)
      const gasEstimate = await this.bundler.estimateUserOperationGas(userOp);

      return {
        success: true,
        gasUsed: gasEstimate.callGasLimit + gasEstimate.verificationGasLimit + gasEstimate.preVerificationGas,
      };
    } catch (error) {
      return {
        success: false,
        gasUsed: 0n,
        error: error instanceof Error ? error.message : 'Simulation failed',
      };
    }
  }

  /**
   * Simulate a batch of transactions
   */
  async simulateBatch(calls: Call[]): Promise<SimulationResult> {
    if (calls.length === 0) {
      return {
        success: false,
        gasUsed: 0n,
        error: 'Cannot simulate empty batch',
      };
    }

    try {
      // Build batch UserOperation
      const userOp = await this.builder.buildBatch(calls);

      // Estimate gas
      const gasEstimate = await this.bundler.estimateUserOperationGas(userOp);

      return {
        success: true,
        gasUsed: gasEstimate.callGasLimit + gasEstimate.verificationGasLimit + gasEstimate.preVerificationGas,
      };
    } catch (error) {
      return {
        success: false,
        gasUsed: 0n,
        error: error instanceof Error ? error.message : 'Batch simulation failed',
      };
    }
  }
}

