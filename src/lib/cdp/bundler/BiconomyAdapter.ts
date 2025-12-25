/**
 * Biconomy Bundler Client Adapter
 * Uses Biconomy SDK (@biconomy/account) to provide IBundlerClient interface
 * Follows ONESEED architecture pattern
 * 
 * This adapter bridges Biconomy SDK to our composable architecture while
 * maintaining compatibility with our existing SmartAccount contracts.
 */

import type { Address, Hex } from 'viem';
import { createBundler, type Bundler } from '@biconomy/account';
import type { UserOperationStruct } from '@biconomy/account';
import { IBundlerClient } from './IBundlerClient';
import { BundlerError } from '../core/errors';
import { ERROR_CODES } from '../core/constants';
import type { UserOperation, UserOperationReceipt, GasEstimate } from '../core/types';

/**
 * Biconomy Adapter Configuration
 */
export interface BiconomyAdapterConfig {
  bundlerUrl: string;
  paymasterApiKey?: string;
  entryPoint: Address;
  chainId: number;
}

/**
 * Biconomy Bundler Client Adapter
 * Implements IBundlerClient using Biconomy SDK
 */
export class BiconomyAdapter implements IBundlerClient {
  private bundler: Bundler | null = null;
  private bundlerUrl: string;
  private paymasterApiKey?: string;
  private entryPoint: Address;
  private chainId: number;

  constructor(config: BiconomyAdapterConfig) {
    this.bundlerUrl = config.bundlerUrl;
    this.entryPoint = config.entryPoint;
    this.chainId = config.chainId;
    this.paymasterApiKey = config.paymasterApiKey;

    if (!config.bundlerUrl || config.bundlerUrl === '' || config.bundlerUrl.includes('YOUR_')) {
      console.error('❌ Biconomy Bundler URL not configured!');
      console.error('   Please set NEXT_PUBLIC_BICONOMY_BUNDLER_URL_BASE in .env.local');
      throw new BundlerError(
        'Biconomy Bundler URL not configured. Please set NEXT_PUBLIC_BICONOMY_BUNDLER_URL_BASE in .env.local',
        ERROR_CODES.BUNDLER_RPC_ERROR
      );
    }


    console.log('✅ BiconomyAdapter initialized');
    console.log('   Bundler URL:', config.bundlerUrl.substring(0, 60) + (config.bundlerUrl.length > 60 ? '...' : ''));
    console.log('   Entry Point:', config.entryPoint);
    console.log('   Chain ID:', config.chainId);
    console.log('   Paymaster:', config.paymasterApiKey ? 'Enabled' : 'Disabled');
  }

  /**
   * Initialize Biconomy SDK Bundler (lazy initialization)
   */
  private async getBundler(): Promise<Bundler> {
    if (!this.bundler) {
      this.bundler = await createBundler({
        bundlerUrl: this.bundlerUrl,
        entryPointAddress: this.entryPoint,
        chainId: this.chainId,
      });
      console.log('✅ Biconomy SDK Bundler initialized');
    }
    return this.bundler;
  }

  /**
   * Convert our UserOperation to Biconomy's UserOperationStruct
   * BigNumberish accepts string, number, or bigint, but SDK needs strings for JSON serialization
   */
  private convertToBiconomyUserOp(userOp: UserOperation): UserOperationStruct {
    return {
      sender: userOp.sender,
      nonce: `0x${userOp.nonce.toString(16)}`, // Convert bigint to hex string for serialization
      initCode: userOp.initCode || '0x',
      callData: userOp.callData,
      callGasLimit: `0x${userOp.callGasLimit.toString(16)}`, // Convert bigint to hex string
      verificationGasLimit: `0x${userOp.verificationGasLimit.toString(16)}`, // Convert bigint to hex string
      preVerificationGas: `0x${userOp.preVerificationGas.toString(16)}`, // Convert bigint to hex string
      maxFeePerGas: `0x${userOp.maxFeePerGas.toString(16)}`, // Convert bigint to hex string
      maxPriorityFeePerGas: `0x${userOp.maxPriorityFeePerGas.toString(16)}`, // Convert bigint to hex string
      paymasterAndData: userOp.paymasterAndData || '0x',
      signature: userOp.signature,
    };
  }

  /**
   * Send UserOperation to Biconomy bundler using SDK
   */
  async sendUserOperation(userOp: UserOperation): Promise<Hex> {
    try {
      const bundler = await this.getBundler();
      const biconomyUserOp = this.convertToBiconomyUserOp(userOp);
      
      console.log('📤 Sending UserOperation via Biconomy SDK...');
      console.log('   Sender:', biconomyUserOp.sender);
      console.log('   Nonce:', biconomyUserOp.nonce);
      const initCodeStr = typeof biconomyUserOp.initCode === 'string' ? biconomyUserOp.initCode : '0x';
      console.log('   Has initCode:', initCodeStr !== '0x' && initCodeStr.length > 2);
      console.log('   Has signature:', biconomyUserOp.signature && biconomyUserOp.signature.length > 2);
      console.log('   Full UserOp being sent:', JSON.stringify(biconomyUserOp, (key, value) => 
        typeof value === 'bigint' ? value.toString() : value, 2));
      
      let response: any;
      try {
        response = await bundler.sendUserOp(biconomyUserOp);
      } catch (sdkError: any) {
        console.error('❌ SDK sendUserOp threw error:', sdkError);
        console.error('   Error message:', sdkError?.message);
        console.error('   Error stack:', sdkError?.stack);
        console.error('   Error details:', JSON.stringify(sdkError, null, 2));
        throw new BundlerError(
          `SDK sendUserOp failed: ${sdkError?.message || 'Unknown error'}. Details: ${JSON.stringify(sdkError)}`,
          ERROR_CODES.BUNDLER_RPC_ERROR,
          sdkError
        );
      }
      
      // Log full response for debugging
      console.log('📤 SDK sendUserOp response:', JSON.stringify(response, null, 2));
      
      if (!response) {
        throw new BundlerError(
          'Bundler returned null/undefined response',
          ERROR_CODES.BUNDLER_RPC_ERROR
        );
      }
      
      // Check if response has userOpHash property
      const userOpHash = response.userOpHash || (response as any).hash || (response as any).result;
      
      if (!userOpHash) {
        console.error('❌ Response structure:', JSON.stringify(response, null, 2));
        throw new BundlerError(
          `Bundler returned invalid response. Expected userOpHash but got: ${JSON.stringify(response)}`,
          ERROR_CODES.BUNDLER_RPC_ERROR
        );
      }

      console.log('✅ UserOperation sent successfully');
      console.log('   UserOpHash:', userOpHash);
      
      return userOpHash as Hex;
    } catch (error) {
      console.error('❌ Send UserOperation error:', error);
      if (error instanceof BundlerError) {
        throw error;
      }
      
      // Check for paymaster funding errors
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('insufficient funds') || errorMessage.includes('paymaster') || errorMessage.includes('sponsor')) {
        throw new BundlerError(
          `Paymaster funding issue: ${errorMessage}. Please fund your Biconomy paymaster or check your API key configuration.`,
          ERROR_CODES.BUNDLER_RPC_ERROR,
          error
        );
      }
      
      throw new BundlerError(
        `Failed to send UserOperation: ${errorMessage}`,
        ERROR_CODES.BUNDLER_RPC_ERROR,
        error
      );
    }
  }

  /**
   * Estimate gas for UserOperation using SDK
   * CRITICAL: SDK requires a dummy signature for gas estimation
   */
  async estimateUserOperationGas(userOp: UserOperation): Promise<GasEstimate> {
    try {
      const bundler = await this.getBundler();
      const biconomyUserOp = this.convertToBiconomyUserOp(userOp);
      
      // CRITICAL: SDK requires a dummy signature for gas estimation
      // Use a dummy signature if none is provided (65 bytes: 32 r + 32 s + 1 v)
      if (!biconomyUserOp.signature || biconomyUserOp.signature === '0x' || (typeof biconomyUserOp.signature === 'string' && biconomyUserOp.signature.length < 132)) {
        // Dummy signature: 65 bytes of zeros (0x + 130 hex chars)
        biconomyUserOp.signature = ('0x' + '0'.repeat(130)) as Hex;
        console.log('📊 Using dummy signature for gas estimation (SDK requirement)');
      }
      
      console.log('📊 Estimating gas via Biconomy SDK...');
      console.log('   UserOp sender:', biconomyUserOp.sender);
      const initCodeStr = typeof biconomyUserOp.initCode === 'string' ? biconomyUserOp.initCode : '0x';
      console.log('   UserOp has initCode:', initCodeStr !== '0x' && initCodeStr.length > 2);
      console.log('   Has signature:', biconomyUserOp.signature && biconomyUserOp.signature.length >= 132);
      
      let estimate: any;
      try {
        estimate = await bundler.estimateUserOpGas(biconomyUserOp);
        
        // Log the full response for debugging
        console.log('📊 SDK gas estimate response:', JSON.stringify(estimate, null, 2));
        
        // SDK returns UserOpGasResponse with hex strings
        // If estimate is undefined, the bundler likely returned an error
        if (!estimate || typeof estimate !== 'object') {
          console.error('❌ SDK returned undefined/empty response');
          console.error('   This usually means the bundler rejected the UserOperation');
          console.error('   Common causes:');
          console.error('   1. UserOperation format is invalid');
          console.error('   2. Account address mismatch');
          console.error('   3. EntryPoint address mismatch');
          console.error('   4. Signature format is invalid');
          console.error('   5. Bundler API key is invalid or expired');
          
          // Try to get more info by checking if we can access the raw response
          // The SDK might have error details we can't access, so we'll throw a helpful error
          throw new BundlerError(
            `Bundler gas estimation failed: SDK returned undefined. This usually means the bundler rejected the UserOperation. ` +
            `Please check: 1) UserOperation format, 2) Account/EntryPoint addresses, 3) Signature format, 4) API key validity. ` +
            `UserOp sender: ${biconomyUserOp.sender}, EntryPoint: ${this.entryPoint}`,
            ERROR_CODES.GAS_ESTIMATION_FAILED
          );
        }
      } catch (sdkError: any) {
        console.error('❌ SDK estimateUserOpGas threw error:', sdkError);
        console.error('   Error message:', sdkError?.message);
        console.error('   Error stack:', sdkError?.stack);
        console.error('   Error details:', JSON.stringify(sdkError, null, 2));
        
        // Check if it's a bundler rejection error
        const errorMsg = sdkError?.message || String(sdkError);
        if (errorMsg.includes('undefined') || errorMsg.includes('null')) {
          throw new BundlerError(
            `Bundler rejected UserOperation for gas estimation. ` +
            `This could be due to: invalid UserOp format, account not deployed, or bundler configuration issue. ` +
            `Original error: ${errorMsg}`,
            ERROR_CODES.GAS_ESTIMATION_FAILED,
            sdkError
          );
        }
        
        throw new BundlerError(
          `SDK gas estimation failed: ${errorMsg}. Details: ${JSON.stringify(sdkError)}`,
          ERROR_CODES.GAS_ESTIMATION_FAILED,
          sdkError
        );
      }
      
      // SDK returns hex strings or BigNumberish, convert to BigInt
      const toBigInt = (value: any, fieldName: string): bigint => {
        if (value === undefined || value === null) {
          console.warn(`⚠️ Gas estimate missing ${fieldName}, using default`);
          return BigInt('0x0');
        }
        if (typeof value === 'bigint') return value;
        if (typeof value === 'string') {
          // Handle hex strings
          if (value.startsWith('0x')) {
            return BigInt(value);
          }
          // Handle decimal strings
          return BigInt(value);
        }
        return BigInt(value?.toString() || '0');
      };
      
      const result = {
        callGasLimit: toBigInt(estimate.callGasLimit, 'callGasLimit'),
        verificationGasLimit: toBigInt(estimate.verificationGasLimit, 'verificationGasLimit'),
        preVerificationGas: toBigInt(estimate.preVerificationGas, 'preVerificationGas'),
        maxFeePerGas: toBigInt(estimate.maxFeePerGas || `0x${userOp.maxFeePerGas.toString(16)}`, 'maxFeePerGas'),
        maxPriorityFeePerGas: toBigInt(estimate.maxPriorityFeePerGas || `0x${userOp.maxPriorityFeePerGas.toString(16)}`, 'maxPriorityFeePerGas'),
      };
      
      console.log('✅ Gas estimate converted:', {
        callGasLimit: result.callGasLimit.toString(),
        verificationGasLimit: result.verificationGasLimit.toString(),
        preVerificationGas: result.preVerificationGas.toString(),
      });
      
      return result;
    } catch (error) {
      console.error('❌ Gas estimation error:', error);
      if (error instanceof BundlerError) {
        throw error;
      }
      throw new BundlerError(
        `Failed to estimate gas: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ERROR_CODES.GAS_ESTIMATION_FAILED,
        error
      );
    }
  }

  /**
   * Sponsor UserOperation with Biconomy Paymaster
   * Biconomy uses pm_sponsorUserOperation method (similar to Pimlico)
   */
  async sponsorUserOperation(userOp: UserOperation): Promise<UserOperation> {
    try {
      if (!this.paymasterApiKey) {
        console.warn('⚠️ Biconomy paymaster API key not configured');
        console.warn('   Proceeding without sponsorship');
        return userOp;
      }

      console.log('💰 Requesting Biconomy paymaster sponsorship...');
      console.log('   ✅ Biconomy supports deployment sponsorship!');
      
      const hasInitCode = userOp.initCode && userOp.initCode !== '0x';
      if (hasInitCode) {
        console.log('   🎯 This is a deployment UserOp - Biconomy will sponsor it!');
      }

      // Biconomy uses pm_sponsorUserOperation method via direct RPC (paymaster not in bundler SDK)
      // CRITICAL: For API v3, paymaster calls might need different format
      const biconomyUserOp = this.convertToBiconomyUserOp(userOp);
      const formattedUserOp = this.formatUserOperationForRPC(biconomyUserOp);
      
      // Try different paymaster call formats based on Biconomy API v3
      // Format 1: With entryPointAddress and chainId in options (current)
      // Format 2: Just UserOp and entryPoint (standard ERC-4337)
      // Format 3: With simulation type
      
      console.log('   📋 Paymaster request format:');
      console.log('      Method: pm_sponsorUserOperation');
      console.log('      EntryPoint:', this.entryPoint);
      console.log('      ChainId:', this.chainId);
      console.log('      UserOp sender:', formattedUserOp.sender);
      console.log('      Has initCode:', formattedUserOp.initCode && formattedUserOp.initCode !== '0x');
      
      // Try Format 1 first (with entryPointAddress and chainId)
      let requestBody = {
        jsonrpc: '2.0',
        id: 1,
        method: 'pm_sponsorUserOperation',
        params: [
          formattedUserOp,
          {
            entryPointAddress: this.entryPoint,
            chainId: this.chainId,
          },
        ],
      };
      
      let response = await fetch(this.bundlerUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
      
      // If Format 1 fails with "Wrong transaction type", try Format 2 (standard ERC-4337)
      if (!response.ok || (await response.json().then(r => r.error?.message?.includes('Wrong transaction type')).catch(() => false))) {
        const errorResponse = await response.json().catch(() => ({}));
        if (errorResponse.error?.message?.includes('Wrong transaction type')) {
          console.log('   🔄 Format 1 failed, trying Format 2 (standard ERC-4337)...');
          
          // Format 2: Standard ERC-4337 format (just UserOp and entryPoint)
          requestBody = {
            jsonrpc: '2.0',
            id: 1,
            method: 'pm_sponsorUserOperation',
            params: [formattedUserOp, String(this.entryPoint)] as any,
          };
          
          response = await fetch(this.bundlerUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
          });
        }
      }

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Failed to read error');
        console.warn('⚠️ Biconomy paymaster RPC error:', response.status);
        console.warn('   Response:', errorText.substring(0, 500));
        return userOp; // Return unsponsored
      }

      const result = await response.json();

      if (result.error) {
        const errorMsg = result.error.message || '';
        const errorCode = result.error.code;
        
        console.warn('⚠️ Biconomy paymaster rejected:', errorMsg);
        console.warn('   Code:', errorCode);
        
        // Check for funding-related errors
        if (errorMsg.includes('insufficient') || errorMsg.includes('balance') || errorMsg.includes('fund')) {
          console.error('💰 PAYMASTER FUNDING REQUIRED!');
          console.error('   Your Biconomy paymaster account needs funding.');
          console.error('   Please fund your paymaster in the Biconomy dashboard.');
          console.error('   Required: ~$0.004 USD for first transaction');
        }
        
        return userOp; // Return unsponsored
      }

      const paymasterAndData = result.result?.paymasterAndData as Hex;
      
      if (paymasterAndData && paymasterAndData !== '0x') {
        console.log('✅ Biconomy paymaster sponsorship approved!');
        console.log('   Paymaster data length:', paymasterAndData.length);
        console.log('   Paymaster data (first 66):', paymasterAndData.substring(0, 66) + '...');
        
        if (hasInitCode) {
          console.log('   🎉🎉🎉 DEPLOYMENT SPONSORSHIP CONFIRMED! 🎉🎉🎉');
          console.log('   ✅ True gasless onboarding achieved!');
          console.log('   💰 User pays $0 for first transaction (deployment + execution)');
          console.log('   🚀 All future transactions will also be gasless!');
        } else {
          console.log('   ✅ Execution sponsorship confirmed!');
        }
        
        return {
          ...userOp,
          paymasterAndData,
        };
      }

      console.warn('⚠️ Biconomy paymaster returned empty paymasterAndData');
      return userOp;
    } catch (error) {
      console.warn('⚠️ Biconomy paymaster error:', error instanceof Error ? error.message : 'Unknown');
      return userOp; // Return unsponsored
    }
  }

  /**
   * Get UserOperation receipt using SDK
   */
  async getUserOperationReceipt(hash: Hex): Promise<UserOperationReceipt> {
    try {
      const bundler = await this.getBundler();
      const receipt = await bundler.getUserOpReceipt(hash);
      
      return this.parseUserOperationReceipt(receipt);
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
   * Format UserOperationStruct for RPC (used for paymaster calls)
   * Biconomy API v3 format - converts BigNumberish to hex strings
   */
  private formatUserOperationForRPC(userOp: UserOperationStruct): Record<string, string> {
    const formatted: Record<string, string> = {
      sender: userOp.sender,
      nonce: typeof userOp.nonce === 'string' ? userOp.nonce : `0x${BigInt(userOp.nonce).toString(16)}`,
      callData: userOp.callData as string,
      callGasLimit: typeof userOp.callGasLimit === 'string' ? userOp.callGasLimit : `0x${BigInt(userOp.callGasLimit || '0').toString(16)}`,
      verificationGasLimit: typeof userOp.verificationGasLimit === 'string' ? userOp.verificationGasLimit : `0x${BigInt(userOp.verificationGasLimit || '0').toString(16)}`,
      preVerificationGas: typeof userOp.preVerificationGas === 'string' ? userOp.preVerificationGas : `0x${BigInt(userOp.preVerificationGas || '0').toString(16)}`,
      maxFeePerGas: typeof userOp.maxFeePerGas === 'string' ? userOp.maxFeePerGas : `0x${BigInt(userOp.maxFeePerGas || '0').toString(16)}`,
      maxPriorityFeePerGas: typeof userOp.maxPriorityFeePerGas === 'string' ? userOp.maxPriorityFeePerGas : `0x${BigInt(userOp.maxPriorityFeePerGas || '0').toString(16)}`,
      paymasterAndData: (userOp.paymasterAndData as string) || '0x',
      signature: userOp.signature as string,
    };

    // Only include initCode if it's not empty (Biconomy might reject empty initCode)
    if (userOp.initCode && userOp.initCode !== '0x') {
      formatted.initCode = userOp.initCode as string;
    }

    return formatted;
  }

  /**
   * Parse UserOperation receipt from Biconomy SDK response
   */
  private parseUserOperationReceipt(receipt: any): UserOperationReceipt {
    // Biconomy SDK returns receipt in a specific format
    // actualGasCost and actualGasUsed are Hex strings
    return {
      userOpHash: receipt.userOpHash,
      entryPoint: receipt.entryPoint,
      sender: receipt.sender,
      nonce: BigInt(receipt.nonce || '0x0'),
      paymaster: receipt.paymaster || '0x',
      actualGasCost: BigInt(receipt.actualGasCost || '0x0'),
      actualGasUsed: BigInt(receipt.actualGasUsed || '0x0'),
      success: receipt.success === 'true' || receipt.success === true,
      reason: receipt.reason || '',
      logs: receipt.logs || [],
      receipt: {
        transactionHash: receipt.receipt?.transactionHash || receipt.transactionHash || '0x',
        blockNumber: BigInt(receipt.receipt?.blockNumber || receipt.blockNumber || '0x0'),
        blockHash: receipt.receipt?.blockHash || receipt.blockHash || '0x',
        gasUsed: BigInt(receipt.receipt?.gasUsed || receipt.gasUsed || '0x0'),
        effectiveGasPrice: BigInt(receipt.receipt?.effectiveGasPrice || receipt.effectiveGasPrice || '0x0'),
        status: receipt.receipt?.status === '0x1' || receipt.status === '0x1' ? 'success' : 'reverted',
        logs: receipt.receipt?.logs || receipt.logs || [],
      },
    };
  }
}

