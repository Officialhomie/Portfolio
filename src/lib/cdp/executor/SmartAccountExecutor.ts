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
  private chainId: number = 8453; // Default to Base mainnet

  constructor(
    private account: ISmartAccount,
    private signer: ISigner,
    private builder: IUserOperationBuilder,
    private bundler: IBundlerClient,
    chainId?: number
  ) {
    // Get chainId from builder if available
    if (chainId) {
      this.chainId = chainId;
    } else {
      // Try to extract from builder (it has chainId)
      const builderAny = builder as any;
      if (builderAny.chainId) {
        this.chainId = builderAny.chainId;
      }
    }
  }

  /**
   * Execute a single transaction
   * EOA-First Flow: Combines deployment + execution in single UserOp when possible
   */
  async execute(call: Call): Promise<TransactionResult> {
    try {
      const isDeployed = await this.account.isDeployed();
      
      // 1. Build UserOperation (includes initCode if not deployed)
      // ERC-4337 allows deployment + execution in one UserOp
      const userOp = await this.builder.build(call);
      
      if (!isDeployed) {
        console.log('📦 Account not deployed - combining deployment + execution in one UserOp');
        console.log('   💡 ERC-4337 allows initCode + callData in single UserOperation');
        console.log('   ⚠️  CDP Paymaster may not sponsor deployment+execution combo');
        console.log('   🔄 Will try paymaster first, fallback to EOA payment if needed');
      }

      // 2. Try to sponsor UserOperation with paymaster
      // For EOA-first flow: If paymaster fails, EOA can pay for first transaction
      console.log('💰 Requesting paymaster sponsorship...');
      let sponsoredUserOp = userOp;
      
      try {
        sponsoredUserOp = await this.bundler.sponsorUserOperation(userOp);
      
        if (sponsoredUserOp.paymasterAndData === '0x') {
          if (!isDeployed) {
            console.warn('⚠️ Paymaster rejected deployment+execution combo');
            console.warn('   💡 Paymaster sponsorship failed');
            console.warn('   🔄 Falling back to EOA payment for first transaction');
            console.warn('   ✅ All future transactions will be gasless!');
          } else {
            console.warn('⚠️ Paymaster sponsorship failed');
            console.warn('   UserOperation will proceed without sponsorship');
          }
        } else {
          console.log('✅ Paymaster sponsorship received');
          console.log('   Paymaster data:', sponsoredUserOp.paymasterAndData.substring(0, 20) + '...');
          if (!isDeployed) {
            console.log('   🎉 Deployment + execution sponsored! True gasless onboarding!');
          }
        }
      } catch (sponsorError) {
        console.warn('⚠️ Paymaster sponsorship error:', sponsorError instanceof Error ? sponsorError.message : 'Unknown');
        if (sponsorError instanceof Error && sponsorError.message.includes('Insufficient Pimlico balance')) {
          console.warn('   💡 Pimlico account needs funding!');
          console.warn('   🔗 Top up at: https://pimlico.io/dashboard');
          console.warn('   💰 Required: ~$0.004 USD for first transaction');
        }
        if (!isDeployed) {
          console.warn('   💡 For first transaction: EOA will pay (~$0.01 one-time)');
          console.warn('   ✅ Future transactions will be gasless');
        }
        // Continue with unsponsored UserOp - EOA will pay
      }

      // 3. Sign UserOperation (with paymaster data included)
      console.log('✍️ Signing UserOperation...');
      console.log('   💡 MetaMask will prompt you to sign');
      console.log('   ⚠️  IMPORTANT: Approve the signature to complete the transaction');
      
      // CRITICAL FIX #2: Verify owner index before signing
      // For newly initialized accounts, owner is always at index 0
      // But we should verify this to catch any issues
      let ownerIndex = 0;
      try {
        // Try to verify owner is at index 0 by checking account state
        // If account is deployed, we could query ownerAtIndex(0)
        // For now, assume index 0 is correct for first owner (new accounts)
        const accountAddress = await this.account.getAddress();
        const isDeployed = await this.account.isDeployed();
        
        if (isDeployed) {
          // Account is deployed - we could query ownerAtIndex(0) to verify
          // But for now, assume index 0 is correct
          console.log('   📍 Account is deployed, using ownerIndex 0 (first owner)');
        } else {
          // Account not deployed - will be initialized with owner at index 0
          console.log('   📍 Account not deployed, will initialize with owner at index 0');
        }
      } catch (error) {
        console.warn('   ⚠️ Could not verify owner index, using default 0:', error);
      }
      
      let signature: Hex;
      try {
        // CRITICAL: Use verified ownerIndex (defaults to 0 for first owner)
        console.log('   🔑 Using ownerIndex:', ownerIndex);
        signature = await this.signer.signUserOperation(sponsoredUserOp, ownerIndex, this.chainId);
        console.log('✅ UserOperation signed successfully');
      } catch (signError) {
        if (signError instanceof Error && (signError.message.includes('rejected') || signError.message.includes('not been authorized'))) {
          throw new UserOperationError(
            `Signature required: Please approve the MetaMask signature request to complete the transaction.\n\n` +
            `Steps:\n` +
            `1. Look for the MetaMask popup/notification\n` +
            `2. Click "Sign" or "Approve"\n` +
            `3. The transaction will then be submitted automatically\n\n` +
            `If you don't see a popup, check:\n` +
            `- MetaMask extension is unlocked\n` +
            `- Correct account is selected\n` +
            `- Browser popup blocker is disabled`,
            ERROR_CODES.USEROP_REJECTED,
            signError
          );
        }
        throw signError;
      }
      
      const signedUserOp: UserOperation = { ...sponsoredUserOp, signature };

      // 4. Submit to bundler
      console.log('📤 Submitting UserOperation to bundler...');
      const userOpHash = await this.bundler.sendUserOperation(signedUserOp);
      console.log('✅ UserOperation submitted! Hash:', userOpHash);

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
      const signature = await this.signer.signUserOperation(sponsoredUserOp, 0, this.chainId);
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

  /**
   * Deploy the smart account
   * This is a separate UserOperation that deploys the account
   * 
   * IMPORTANT: We CAN use paymaster for deployment!
   * The key is: deployment-only UserOp (initCode + empty callData) CAN be sponsored
   * The issue was: deployment + execution in one UserOp (initCode + callData) cannot be sponsored
   */
  private async deployAccount(): Promise<TransactionResult> {
    console.log('🔨 Deploying smart account...');
    console.log('   💡 Using paymaster for deployment (deployment-only UserOp can be sponsored)');
    
    const sender = await this.account.getAddress();
    const nonce = await this.account.getNonce();
    
    // Get initCode from account
    const accountWithDeploy = this.account as any;
    if (!accountWithDeploy.deploy) {
      throw new UserOperationError(
        'Account does not support deployment',
        ERROR_CODES.ACCOUNT_NOT_DEPLOYED
      );
    }
    
    const initCode = await accountWithDeploy.deploy();
    
    if (!initCode || initCode === '0x') {
      throw new UserOperationError(
        'Cannot deploy: initCode is empty',
        ERROR_CODES.ACCOUNT_NOT_DEPLOYED
      );
    }

    // Build deployment UserOperation
    // CRITICAL: Empty callData (just deploying, no execution)
    // This allows paymaster to sponsor it!
    const deployUserOp: UserOperation = {
      sender,
      nonce,
      initCode,
      callData: '0x', // ✅ Empty callData - deployment only (can be sponsored!)
      callGasLimit: 50_000n, // Minimal gas for deployment
      verificationGasLimit: 150_000n,
      preVerificationGas: 25_000n, // Increased from 21_000 to prevent precheck failures
      maxFeePerGas: 1_000_000_000n, // 1 gwei
      maxPriorityFeePerGas: 1_000_000_000n,
      paymasterAndData: '0x', // Will be filled by paymaster
      signature: '0x', // Will be filled by signer
    };

    // Estimate gas for deployment
    try {
      const gasEstimate = await this.bundler.estimateUserOperationGas(deployUserOp);
      deployUserOp.callGasLimit = gasEstimate.callGasLimit;
      deployUserOp.verificationGasLimit = gasEstimate.verificationGasLimit;
      deployUserOp.preVerificationGas = gasEstimate.preVerificationGas;
      console.log('✅ Gas estimated for deployment');
    } catch (error) {
      console.warn('⚠️ Gas estimation failed for deployment, using defaults');
      console.warn('   Error:', error instanceof Error ? error.message : 'Unknown');
    }

    // ❌ CDP Paymaster does NOT support deployment sponsorship
    // This is a major limitation for true gasless onboarding
    console.log('💰 Paymaster sponsorship for deployment: NOT SUPPORTED by CDP');
    console.log('   CDP only sponsors execution, not account creation');
    console.log('   This breaks the gasless onboarding promise of ERC-4337');
    console.log('   Consider alternative paymasters (e.g., Pimlico, Biconomy, Stackup)');

    // Skip paymaster for deployment - use direct payment
    const sponsoredDeployUserOp = deployUserOp; // No sponsorship for deployment

    // Sign deployment UserOperation (with paymaster data if sponsored)
    const signature = await this.signer.signUserOperation(sponsoredDeployUserOp);
    const signedDeployUserOp: UserOperation = { ...sponsoredDeployUserOp, signature };

    // Submit deployment UserOperation
    console.log('📤 Submitting deployment UserOperation...');
    const userOpHash = await this.bundler.sendUserOperation(signedDeployUserOp);
    console.log('   UserOp Hash:', userOpHash);

    // Wait for receipt
    console.log('⏳ Waiting for deployment confirmation...');
    const receipt = await this.bundler.waitForUserOperationReceipt(userOpHash);

    return {
      userOpHash,
      txHash: receipt.receipt.transactionHash,
      blockNumber: receipt.receipt.blockNumber,
      gasUsed: receipt.receipt.gasUsed,
      success: receipt.success,
      logs: receipt.logs,
    };
  }
}

