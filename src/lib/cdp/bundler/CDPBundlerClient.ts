/**
 * CDP (Coinbase Developer Platform) Bundler Client Implementation
 * Handles UserOperation submission and paymaster sponsorship
 * 
 * @deprecated This implementation is being phased out in favor of PimlicoBundlerClient
 * which supports deployment sponsorship for true gasless onboarding.
 * CDP Paymaster does not support deployment sponsorship.
 * 
 * This file is preserved for backward compatibility and fallback scenarios.
 * New implementations should use PimlicoBundlerClient.
 */

import type { Address, Hex, Transport } from 'viem';
import { createPublicClient, http, type PublicClient } from 'viem';
import { IBundlerClient } from './IBundlerClient';
import { BundlerError, PaymasterError } from '../core/errors';
import { ERROR_CODES, ENTRYPOINT_ADDRESS } from '../core/constants';
import type { UserOperation, GasEstimate, UserOperationReceipt } from '../core/types';

/**
 * CDP Bundler Client implementation
 */
export class CDPBundlerClient implements IBundlerClient {
  private publicClient: PublicClient;
  private chainId: number;

  constructor(
    private rpcUrl: string,
    private entryPoint: Address,
    private transport: Transport,
    chainId?: number
  ) {
    this.chainId = chainId || 8453; // Default to Base mainnet
    if (!rpcUrl || rpcUrl === '' || rpcUrl.includes('YOUR_CDP')) {
      console.error('❌ CDP Bundler URL not configured!');
      console.error('   RPC URL:', rpcUrl || '(empty)');
      console.error('   Please set NEXT_PUBLIC_CDP_PAYMASTER_RPC_URL_BASE in .env.local');
      throw new BundlerError(
        'CDP Bundler URL not configured. Please set NEXT_PUBLIC_CDP_PAYMASTER_RPC_URL_BASE in .env.local',
        ERROR_CODES.BUNDLER_RPC_ERROR
      );
    }
    
    console.log('✅ CDPBundlerClient initialized');
    console.log('   RPC URL:', rpcUrl.substring(0, 60) + (rpcUrl.length > 60 ? '...' : ''));
    console.log('   Entry Point:', entryPoint);

    // Create a public client for reading blockchain data
    // Extract chain from transport if possible, otherwise use base
    this.publicClient = createPublicClient({
      transport: http(rpcUrl),
    });
  }

  /**
   * Send a UserOperation to the bundler
   * NOTE: Paymaster sponsorship should be done BEFORE calling this method
   * The UserOperation should already have paymasterAndData set
   */
  async sendUserOperation(userOp: UserOperation): Promise<Hex> {
    try {
      // Send to bundler via RPC
      // Paymaster data should already be included in userOp.paymasterAndData
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
        const error = await response.json().catch(() => ({ error: { message: 'Unknown error' } }));
        throw new BundlerError(
          `Bundler RPC error: ${error.error?.message || 'Unknown error'}`,
          ERROR_CODES.BUNDLER_RPC_ERROR,
          error
        );
      }

      const result = await response.json();
      
      if (result.error) {
        throw new BundlerError(
          `Bundler error: ${result.error.message || 'Unknown error'}`,
          ERROR_CODES.USEROP_REJECTED,
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
   * Estimate gas for a UserOperation
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
        throw new BundlerError('Failed to estimate gas', ERROR_CODES.GAS_ESTIMATION_FAILED);
      }

      const result = await response.json();
      
      if (result.error) {
        throw new BundlerError(
          `Gas estimation error: ${result.error.message || 'Unknown error'}`,
          ERROR_CODES.GAS_ESTIMATION_FAILED,
          result.error
        );
      }

      const gas = result.result;
      
      // Parse hex strings to bigint
      const parseHex = (value: string | bigint | undefined, fallback: bigint): bigint => {
        if (typeof value === 'bigint') return value;
        if (typeof value === 'string') {
          // Handle hex strings
          if (value.startsWith('0x')) {
            return BigInt(value);
          }
          return BigInt(value);
        }
        return fallback;
      };
      
      return {
        callGasLimit: parseHex(gas.callGasLimit, userOp.callGasLimit),
        verificationGasLimit: parseHex(gas.verificationGasLimit, userOp.verificationGasLimit),
        preVerificationGas: parseHex(gas.preVerificationGas, userOp.preVerificationGas),
        maxFeePerGas: parseHex(gas.maxFeePerGas, userOp.maxFeePerGas),
        maxPriorityFeePerGas: parseHex(gas.maxPriorityFeePerGas, userOp.maxPriorityFeePerGas),
      };
    } catch (error) {
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
   * Sponsor a UserOperation with CDP Paymaster
   * Uses pm_getPaymasterStubData (Coinbase CDP specific)
   */
  async sponsorUserOperation(userOp: UserOperation): Promise<UserOperation> {
    try {
      // Check if RPC URL is configured
      if (!this.rpcUrl || this.rpcUrl === '' || this.rpcUrl.includes('YOUR_CDP')) {
        console.error('❌ CDP Paymaster URL not configured!');
        console.error('   RPC URL:', this.rpcUrl || '(empty)');
        console.error('   Please set NEXT_PUBLIC_CDP_PAYMASTER_RPC_URL_BASE in .env.local');
        console.warn('⚠️ Proceeding without paymaster sponsorship');
        console.warn('   Account will need ETH balance to pay for gas');
        return userOp;
      }

      console.log('📞 Requesting CDP paymaster sponsorship...');
      console.log('   RPC URL:', this.rpcUrl.substring(0, 60) + '...');
      console.log('   Entry Point:', this.entryPoint);
      console.log('   Sender:', userOp.sender);
      console.log('   Call Data:', userOp.callData.substring(0, 40) + '...');

      // CDP Paymaster uses pm_getPaymasterStubData
      // Params: [userOp, entryPoint, chainId (hex), context (optional)]
      const chainIdHex = `0x${this.chainId.toString(16)}`;

      const requestBody = {
        jsonrpc: '2.0',
        id: 1,
        method: 'pm_getPaymasterStubData',  // ✅ CDP-specific method
        params: [
          this.formatUserOperation(userOp),
          this.entryPoint,
          chainIdHex,  // ✅ Required by CDP
          {}  // Context object (empty for now)
        ],
      };

      console.log('   Method: pm_getPaymasterStubData (CDP)');
      console.log('   ChainID:', this.chainId, '(hex:', chainIdHex + ')');
      console.log('   Request:', JSON.stringify(requestBody, null, 2).substring(0, 500) + '...');

      const response = await fetch(this.rpcUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('   Response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Failed to read error');
        console.error('❌ Paymaster RPC error:', response.status);
        console.error('   Response:', errorText.substring(0, 500));
        console.warn('⚠️ Paymaster sponsorship not available, proceeding without sponsorship');
        console.warn('   Account will need ETH balance to pay for gas');
        return userOp;
      }

      const result = await response.json();
      console.log('   Response:', JSON.stringify(result, null, 2).substring(0, 500));

      if (result.error) {
        console.error('❌ Paymaster error:', result.error);
        console.error('   Error code:', result.error.code);
        console.error('   Error message:', result.error.message);
        console.warn('⚠️ Paymaster rejected sponsorship, proceeding without sponsorship');
        console.warn('   Account will need ETH balance to pay for gas');
        return userOp;
      }

      // CDP response format:
      // { sponsor: { name, icon }, paymasterAndData: "0x..." }
      const paymasterAndData = result.result?.paymasterAndData || '0x';
      const sponsorName = result.result?.sponsor?.name || 'Unknown';

      if (!paymasterAndData || paymasterAndData === '0x') {
        console.warn('⚠️ Paymaster returned empty data');
        console.warn('   Response result:', JSON.stringify(result.result || {}, null, 2));
        console.warn('   Proceeding without sponsorship');
        console.warn('   Account will need ETH balance to pay for gas');
        return userOp;
      }

      console.log('✅ Paymaster sponsorship approved!');
      console.log('   Sponsor:', sponsorName);
      console.log('   Paymaster data length:', paymasterAndData.length);
      console.log('   Paymaster data:', paymasterAndData.substring(0, 66) + '...');

      // Return UserOperation with paymaster data
      // Note: CDP doesn't always return gas estimates, we use our defaults
      return {
        ...userOp,
        paymasterAndData: paymasterAndData as Hex,
      };
    } catch (error) {
      // If paymaster fails, return original UserOperation
      console.error('❌ Paymaster sponsorship exception:', error);
      console.error('   Error type:', error instanceof Error ? error.constructor.name : typeof error);
      console.error('   Error message:', error instanceof Error ? error.message : 'Unknown error');
      if (error instanceof Error && error.stack) {
        console.error('   Stack:', error.stack.substring(0, 500));
      }
      console.warn('⚠️ Paymaster sponsorship failed, proceeding without sponsorship');
      console.warn('   Account will need ETH balance to pay for gas');
      return userOp;
    }
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

