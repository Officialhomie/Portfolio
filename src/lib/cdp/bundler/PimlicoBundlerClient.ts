/**
 * Pimlico Bundler Client Implementation
 * Supports deployment sponsorship for true gasless onboarding
 * 
 * @deprecated This is a new implementation - CDP is preserved in CDPBundlerClient.ts
 */

import type { Address, Hex } from 'viem';
import { IBundlerClient } from './IBundlerClient';
import { BundlerError } from '../core/errors';
import { ERROR_CODES } from '../core/constants';
import type { UserOperation, UserOperationReceipt, GasEstimate } from '../core/types';

/**
 * Pimlico Bundler Client
 * Full ERC-4337 support including deployment sponsorship
 */
export class PimlicoBundlerClient implements IBundlerClient {
  private rpcUrl: string;
  private entryPoint: Address;
  private chainId: number;

  constructor(config: {
    rpcUrl: string;
    entryPoint: Address;
    chainId: number;
  }) {
    this.rpcUrl = config.rpcUrl;
    this.entryPoint = config.entryPoint;
    this.chainId = config.chainId;

    if (!config.rpcUrl || config.rpcUrl === '' || config.rpcUrl.includes('YOUR_')) {
      console.error('❌ Pimlico Bundler URL not configured!');
      console.error('   Please set NEXT_PUBLIC_PIMLICO_BUNDLER_RPC_URL_BASE in .env.local');
      throw new BundlerError(
        'Pimlico Bundler URL not configured. Please set NEXT_PUBLIC_PIMLICO_BUNDLER_RPC_URL_BASE in .env.local',
        ERROR_CODES.BUNDLER_RPC_ERROR
      );
    }

    console.log('✅ PimlicoBundlerClient initialized');
    console.log('   RPC URL:', config.rpcUrl.substring(0, 60) + (config.rpcUrl.length > 60 ? '...' : ''));
    console.log('   Entry Point:', config.entryPoint);
    console.log('   Chain ID:', config.chainId);
  }

  /**
   * Send UserOperation to Pimlico bundler
   */
  async sendUserOperation(userOp: UserOperation): Promise<Hex> {
    try {
      const response = await fetch(this.rpcUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'eth_sendUserOperation',
          params: [this.formatUserOperation(userOp), this.entryPoint],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Failed to read error');
        throw new BundlerError(
          `Failed to send UserOperation: ${response.status} ${errorText.substring(0, 200)}`,
          ERROR_CODES.BUNDLER_RPC_ERROR
        );
      }

      const result = await response.json();
      
      if (result.error) {
        throw new BundlerError(
          `Bundler error: ${result.error.message || 'Unknown error'}`,
          ERROR_CODES.BUNDLER_RPC_ERROR,
          result.error
        );
      }

      return result.result as Hex;
    } catch (error) {
      if (error instanceof BundlerError) {
        throw error;
      }
      throw new BundlerError(
        `Failed to send UserOperation: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ERROR_CODES.BUNDLER_RPC_ERROR,
        error
      );
    }
  }

  /**
   * Estimate gas for UserOperation
   */
  async estimateUserOperationGas(userOp: UserOperation): Promise<GasEstimate> {
    try {
      const response = await fetch(this.rpcUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'eth_estimateUserOperationGas',
          params: [this.formatUserOperation(userOp), this.entryPoint],
        }),
      });

      if (!response.ok) {
        throw new BundlerError('Failed to estimate gas', ERROR_CODES.BUNDLER_RPC_ERROR);
      }

      const result = await response.json();
      
      if (result.error) {
        throw new BundlerError(
          `Gas estimation error: ${result.error.message || 'Unknown error'}`,
          ERROR_CODES.BUNDLER_RPC_ERROR,
          result.error
        );
      }

      const estimate = result.result;
      return {
        callGasLimit: BigInt(estimate.callGasLimit || '0x0'),
        verificationGasLimit: BigInt(estimate.verificationGasLimit || '0x0'),
        preVerificationGas: BigInt(estimate.preVerificationGas || '0x0'),
        maxFeePerGas: BigInt(estimate.maxFeePerGas || userOp.maxFeePerGas || '0x0'),
        maxPriorityFeePerGas: BigInt(estimate.maxPriorityFeePerGas || userOp.maxPriorityFeePerGas || '0x0'),
      };
    } catch (error) {
      if (error instanceof BundlerError) {
        throw error;
      }
      throw new BundlerError(
        `Failed to estimate gas: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ERROR_CODES.BUNDLER_RPC_ERROR,
        error
      );
    }
  }

  /**
   * Sponsor UserOperation with Pimlico Paymaster
   * ✅ SUPPORTS DEPLOYMENT SPONSORSHIP!
   */
  async sponsorUserOperation(userOp: UserOperation): Promise<UserOperation> {
    try {
      console.log('💰 Requesting Pimlico paymaster sponsorship...');
      console.log('   ✅ Pimlico supports deployment sponsorship!');
      
      const hasInitCode = userOp.initCode && userOp.initCode !== '0x';
      if (hasInitCode) {
        console.log('   🎯 This is a deployment UserOp - Pimlico will sponsor it!');
      }
      
      // Pimlico uses pm_sponsorUserOperation method
      const response = await fetch(this.rpcUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'pm_sponsorUserOperation',
          params: [
            this.formatUserOperation(userOp),
            {
              entryPoint: this.entryPoint,
              chainId: this.chainId,
            },
          ],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Failed to read error');
        console.warn('⚠️ Pimlico paymaster RPC error:', response.status);
        console.warn('   Response:', errorText.substring(0, 500));
        return userOp; // Return unsponsored
      }

      const result = await response.json();

      if (result.error) {
        console.warn('⚠️ Pimlico paymaster rejected:', result.error.message);
        console.warn('   Code:', result.error.code);
        return userOp; // Return unsponsored
      }

      const paymasterAndData = result.result?.paymasterAndData as Hex;
      
      if (paymasterAndData && paymasterAndData !== '0x') {
        console.log('✅ Pimlico paymaster sponsorship approved!');
        console.log('   Paymaster data:', paymasterAndData.substring(0, 66) + '...');
        
        if (hasInitCode) {
          console.log('   🎉 Deployment sponsorship confirmed! True gasless onboarding!');
        }
        
        return {
          ...userOp,
          paymasterAndData,
        };
      }

      console.warn('⚠️ Pimlico paymaster returned empty paymasterAndData');
      return userOp;
    } catch (error) {
      console.warn('⚠️ Pimlico paymaster error:', error instanceof Error ? error.message : 'Unknown');
      return userOp; // Return unsponsored
    }
  }

  /**
   * Get UserOperation receipt
   */
  async getUserOperationReceipt(hash: Hex): Promise<UserOperationReceipt> {
    try {
      const response = await fetch(this.rpcUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'eth_getUserOperationReceipt',
          params: [hash],
        }),
      });

      if (!response.ok) {
        throw new BundlerError('Failed to get UserOperation receipt', ERROR_CODES.BUNDLER_RPC_ERROR);
      }

      const result = await response.json();
      
      if (result.error) {
        throw new BundlerError(
          `Bundler error: ${result.error.message || 'Unknown error'}`,
          ERROR_CODES.BUNDLER_RPC_ERROR,
          result.error
        );
      }

      if (!result.result) {
        throw new BundlerError('UserOperation receipt not found', ERROR_CODES.BUNDLER_RPC_ERROR);
      }

      return this.parseUserOperationReceipt(result.result);
    } catch (error) {
      if (error instanceof BundlerError) {
        throw error;
      }
      throw new BundlerError(
        `Failed to get UserOperation receipt: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ERROR_CODES.BUNDLER_RPC_ERROR,
        error
      );
    }
  }

  /**
   * Wait for UserOperation receipt
   */
  async waitForUserOperationReceipt(hash: Hex, timeout: number = 120000): Promise<UserOperationReceipt> {
    const startTime = Date.now();
    const pollInterval = 2000; // 2 seconds

    while (Date.now() - startTime < timeout) {
      try {
        const receipt = await this.getUserOperationReceipt(hash);
        return receipt;
      } catch (error) {
        // If receipt not found, wait and retry
        if (error instanceof BundlerError && error.message.includes('not found')) {
          await new Promise((resolve) => setTimeout(resolve, pollInterval));
          continue;
        }
        throw error;
      }
    }

    throw new BundlerError('Timeout waiting for UserOperation receipt', ERROR_CODES.TIMEOUT);
  }

  /**
   * Format UserOperation for RPC
   */
  private formatUserOperation(userOp: UserOperation): Record<string, string> {
    return {
      sender: userOp.sender,
      nonce: `0x${userOp.nonce.toString(16)}`,
      initCode: userOp.initCode,
      callData: userOp.callData,
      callGasLimit: `0x${userOp.callGasLimit.toString(16)}`,
      verificationGasLimit: `0x${userOp.verificationGasLimit.toString(16)}`,
      preVerificationGas: `0x${userOp.preVerificationGas.toString(16)}`,
      maxFeePerGas: `0x${userOp.maxFeePerGas.toString(16)}`,
      maxPriorityFeePerGas: `0x${userOp.maxPriorityFeePerGas.toString(16)}`,
      paymasterAndData: userOp.paymasterAndData,
      signature: userOp.signature,
    };
  }

  /**
   * Parse UserOperation receipt from RPC response
   */
  private parseUserOperationReceipt(receipt: any): UserOperationReceipt {
    return {
      userOpHash: receipt.userOpHash,
      entryPoint: receipt.entryPoint,
      sender: receipt.sender,
      nonce: BigInt(receipt.nonce),
      paymaster: receipt.paymaster,
      actualGasCost: BigInt(receipt.actualGasCost || '0x0'),
      actualGasUsed: BigInt(receipt.actualGasUsed || '0x0'),
      success: receipt.success !== false,
      reason: receipt.reason,
      logs: receipt.logs || [],
      receipt: {
        transactionHash: receipt.receipt.transactionHash,
        blockNumber: BigInt(receipt.receipt.blockNumber),
        blockHash: receipt.receipt.blockHash,
        gasUsed: BigInt(receipt.receipt.gasUsed),
        effectiveGasPrice: BigInt(receipt.receipt.effectiveGasPrice || '0x0'),
        status: receipt.receipt.status === '0x1' ? 'success' : 'reverted',
        logs: receipt.receipt.logs || [],
      },
    };
  }
}

