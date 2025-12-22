/**
 * UserOperation Builder Implementation
 * Builds ERC-4337 UserOperations with gas estimation
 */

import type { Address, Hex, PublicClient } from 'viem';
import { encodePacked, pad, encodeFunctionData } from 'viem';
import { IUserOperationBuilder } from './IUserOperationBuilder';
import { ISmartAccount } from '../account/ISmartAccount';
import { UserOperationError } from '../core/errors';
import { ERROR_CODES, DEFAULT_GAS_LIMITS, ENTRYPOINT_ADDRESS } from '../core/constants';
import type { UserOperation, Call, GasEstimate } from '../core/types';
import { getUserOperationHash } from './utils';

/**
 * UserOperation Builder implementation
 */
export class UserOperationBuilder implements IUserOperationBuilder {
  private bundlerClient: any = null; // Optional bundler for gas estimation

  constructor(
    private account: ISmartAccount,
    private entryPoint: Address,
    private publicClient: PublicClient,
    private chainId: number,
    bundlerClient?: any // Optional bundler client for real gas estimation
  ) {
    this.bundlerClient = bundlerClient || null;
  }

  /**
   * Build a UserOperation from a single call
   */
  async build(call: Call): Promise<UserOperation> {
    const sender = await this.account.getAddress();
    
    // CRITICAL FIX #1: Force fresh deployment check - never cache this
    const code = await this.publicClient.getCode({ address: sender });
    const isDeployed = code !== undefined && code !== '0x';
    
    // CRITICAL FIX #2: Defensive logging to catch initCode issues
    console.log('🔍 Building UserOperation...');
    console.log('   Sender:', sender);
    console.log('   Code length:', code?.length || 0);
    console.log('   Is deployed:', isDeployed);
    
    const nonce = await this.account.getNonce();
    console.log('   Nonce:', nonce.toString());
    
    // CRITICAL FIX #3: Always generate initCode if account has no code
    // Never trust cached isDeployed() - check fresh on-chain
    const initCode = isDeployed ? '0x' : await this.getInitCode();
    
    console.log('   InitCode length:', initCode.length);
    console.log('   InitCode (first 50 chars):', initCode.substring(0, 50) + '...');
    
    // CRITICAL FIX #4: Validate initCode is non-empty for undeployed accounts
    if (!isDeployed && (initCode === '0x' || initCode.length < 42)) {
      console.error('❌ CRITICAL ERROR: Account not deployed but initCode is empty!');
      console.error('   Sender:', sender);
      console.error('   Code:', code);
      console.error('   InitCode:', initCode);
      throw new UserOperationError(
        `Cannot build UserOperation: account at ${sender} is not deployed but initCode is empty. ` +
        `This will cause "simulation had no valid calls in calldata" error.`,
        ERROR_CODES.USEROP_REJECTED
      );
    }

    // Encode call data
    const callData = this.encodeCallData(call);

    // Get fee data
    const feeData = await this.getFeeData();

    // Build initial UserOperation with default gas (will be refined by bundler)
    const initialUserOp: UserOperation = {
      sender,
      nonce,
      initCode,
      callData,
      callGasLimit: DEFAULT_GAS_LIMITS.callGasLimit,
      verificationGasLimit: DEFAULT_GAS_LIMITS.verificationGasLimit,
      preVerificationGas: DEFAULT_GAS_LIMITS.preVerificationGas,
      maxFeePerGas: feeData.maxFeePerGas,
      maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
      paymasterAndData: '0x', // Will be filled by paymaster
      signature: '0x', // Will be filled by signer
    };

    // Get real gas estimates from bundler if available
    const gasEstimate = await this.estimateGasForCall(initialUserOp);

    // Build final UserOperation with accurate gas estimates
    const userOp: UserOperation = {
      ...initialUserOp,
      callGasLimit: gasEstimate.callGasLimit,
      verificationGasLimit: gasEstimate.verificationGasLimit,
      preVerificationGas: gasEstimate.preVerificationGas,
    };

    return userOp;
  }

  /**
   * Build a UserOperation from multiple calls (batch)
   */
  async buildBatch(calls: Call[]): Promise<UserOperation> {
    if (calls.length === 0) {
      throw new UserOperationError('Cannot build batch with zero calls', ERROR_CODES.USEROP_REJECTED);
    }

    const sender = await this.account.getAddress();
    
    // CRITICAL FIX #1: Force fresh deployment check
    const code = await this.publicClient.getCode({ address: sender });
    const isDeployed = code !== undefined && code !== '0x';
    
    console.log('🔍 Building Batch UserOperation...');
    console.log('   Sender:', sender);
    console.log('   Code length:', code?.length || 0);
    console.log('   Is deployed:', isDeployed);
    
    const nonce = await this.account.getNonce();
    console.log('   Nonce:', nonce.toString());
    
    // CRITICAL FIX #3: Always generate initCode if account has no code
    const initCode = isDeployed ? '0x' : await this.getInitCode();
    
    console.log('   InitCode length:', initCode.length);
    
    // CRITICAL FIX #4: Validate initCode is non-empty for undeployed accounts
    if (!isDeployed && (initCode === '0x' || initCode.length < 42)) {
      console.error('❌ CRITICAL ERROR: Account not deployed but initCode is empty!');
      throw new UserOperationError(
        `Cannot build batch UserOperation: account at ${sender} is not deployed but initCode is empty.`,
        ERROR_CODES.USEROP_REJECTED
      );
    }

    // Encode batch call data
    const callData = this.encodeBatchCallData(calls);

    // Get fee data
    const feeData = await this.getFeeData();

    // Build initial UserOperation with default gas (will be refined by bundler)
    const initialUserOp: UserOperation = {
      sender,
      nonce,
      initCode,
      callData,
      callGasLimit: DEFAULT_GAS_LIMITS.callGasLimit * BigInt(calls.length), // Scale for batch
      verificationGasLimit: DEFAULT_GAS_LIMITS.verificationGasLimit,
      preVerificationGas: DEFAULT_GAS_LIMITS.preVerificationGas,
      maxFeePerGas: feeData.maxFeePerGas,
      maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
      paymasterAndData: '0x', // Will be filled by paymaster
      signature: '0x', // Will be filled by signer
    };

    // Get real gas estimates from bundler if available
    const gasEstimate = await this.estimateGasForCall(initialUserOp);

    // Build final UserOperation with accurate gas estimates
    const userOp: UserOperation = {
      ...initialUserOp,
      callGasLimit: gasEstimate.callGasLimit,
      verificationGasLimit: gasEstimate.verificationGasLimit,
      preVerificationGas: gasEstimate.preVerificationGas,
    };

    return userOp;
  }

  /**
   * Encode a single call to callData
   * CRITICAL: This wraps the contract call in execute(target, value, data)
   * The callData MUST call the Smart Account's execute() function, NOT the target contract directly
   * This is required for ERC-4337 UserOperations and Paymaster simulation
   */
  encodeCallData(call: Call): Hex {
    // For PasskeyAccount, we use the execute function
    // Format: execute(target, value, data)
    if (!('encodeExecuteCall' in this.account)) {
      throw new UserOperationError(
        'Account does not support encodeExecuteCall',
        ERROR_CODES.USEROP_REJECTED
      );
    }

    console.log('📦 Encoding callData for UserOperation...');
    console.log('   Target contract:', call.to);
    console.log('   Value:', call.value?.toString() || '0');
    console.log('   Inner call data:', call.data?.substring(0, 40) || '0x', '...');

    const account = this.account as any;
    const encoded = account.encodeExecuteCall(call.to, call.value || 0n, call.data || '0x');

    // CRITICAL FIX #3: Validate execute() selector matches contract
    const EXECUTE_SELECTOR = '0xb61d27f6'; // execute(address,uint256,bytes)
    if (!encoded.startsWith(EXECUTE_SELECTOR)) {
      console.error('❌ CRITICAL ERROR: callData does not start with execute() selector!');
      console.error('   Expected:', EXECUTE_SELECTOR);
      console.error('   Got:', encoded.substring(0, 10));
      console.error('   Full encoded:', encoded);
      throw new UserOperationError(
        `Invalid callData encoding: must start with execute() selector (${EXECUTE_SELECTOR}), got ${encoded.substring(0, 10)}. ` +
        `This will cause "simulation had no valid calls in calldata" error.`,
        ERROR_CODES.USEROP_REJECTED
      );
    }

    console.log('   ✅ Encoded callData:', encoded.substring(0, 50) + '...');
    console.log('   Selector:', encoded.substring(0, 10), '(✓ correct)');
    console.log('   Full callData length:', encoded.length);

    return encoded;
  }

  /**
   * Encode multiple calls to batch callData
   */
  encodeBatchCallData(calls: Call[]): Hex {
    // For PasskeyAccount, we use the executeBatch function
    // Format: executeBatch(targets[], values[], data[])
    if (!('encodeExecuteBatchCall' in this.account)) {
      throw new UserOperationError(
        'Account does not support encodeExecuteBatchCall',
        ERROR_CODES.USEROP_REJECTED
      );
    }

    const account = this.account as any;
    const targets = calls.map((c) => c.to);
    const values = calls.map((c) => c.value || 0n);
    const data = calls.map((c) => c.data || '0x');

    return account.encodeExecuteBatchCall(targets, values, data);
  }

  /**
   * Estimate gas for a UserOperation
   */
  async estimateGas(userOp: UserOperation): Promise<GasEstimate> {
    return {
      callGasLimit: userOp.callGasLimit,
      verificationGasLimit: userOp.verificationGasLimit,
      preVerificationGas: userOp.preVerificationGas,
      maxFeePerGas: userOp.maxFeePerGas,
      maxPriorityFeePerGas: userOp.maxPriorityFeePerGas,
    };
  }

  /**
   * Get initCode for account deployment
   * Encodes the factory.createAccount call for counterfactual deployment
   */
  private async getInitCode(): Promise<Hex> {
    // Access factory and ownerBytes from PasskeyAccount
    const account = this.account as any;

    console.log('🔧 getInitCode() called');
    console.log('   account.factory exists:', !!account.factory);
    console.log('   account.ownerBytes exists:', !!account.ownerBytes);
    console.log('   account.ownerBytes value:', account.ownerBytes);

    if (!account.factory || !account.ownerBytes) {
      console.error('❌ Factory or ownerBytes missing!');
      console.error('   account.factory:', account.factory);
      console.error('   account.ownerBytes:', account.ownerBytes);
      throw new UserOperationError(
        'Cannot generate initCode: factory or ownerBytes not available',
        ERROR_CODES.USEROP_REJECTED
      );
    }

    const factory = account.factory;
    const ownerBytes = account.ownerBytes;
    
    // CRITICAL FIX #4: Verify factory address consistency
    const factoryAddress = (factory as any).factoryAddress;
    if (!factoryAddress || factoryAddress === '0x' || factoryAddress.length < 42) {
      console.error('❌ Invalid factory address:', factoryAddress);
      throw new UserOperationError(
        `Cannot generate initCode: invalid factory address (${factoryAddress}). ` +
        `Please check NEXT_PUBLIC_PASSKEY_ACCOUNT_FACTORY_BASE in .env.local`,
        ERROR_CODES.USEROP_REJECTED
      );
    }

    const salt = 0n; // Default salt
    
    // CRITICAL FIX #4: Verify computed address matches factory.getAddress()
    const computedAddress = await this.account.getAddress();
    const factoryComputedAddress = await factory.getAddress(ownerBytes, salt);
    
    if (computedAddress.toLowerCase() !== factoryComputedAddress.toLowerCase()) {
      console.error('❌ CRITICAL: Factory address mismatch!');
      console.error('   Account computed:', computedAddress);
      console.error('   Factory computed:', factoryComputedAddress);
      console.error('   Factory address:', factoryAddress);
      console.error('   Owner bytes:', ownerBytes.substring(0, 50) + '...');
      throw new UserOperationError(
        `Factory address mismatch: account computed ${computedAddress} but factory computed ${factoryComputedAddress}. ` +
        `This will cause deployment to wrong address and "simulation had no valid calls" error.`,
        ERROR_CODES.USEROP_REJECTED
      );
    }

    console.log('🔧 Generating initCode for account deployment...');
    console.log('   Factory address:', factoryAddress);
    console.log('   Computed account address:', computedAddress);
    console.log('   Owner bytes length:', ownerBytes.length);
    console.log('   Owner bytes (first 50):', ownerBytes.substring(0, 50) + '...');
    console.log('   Salt:', salt.toString());

    // Encode factory.createAccount(owner, salt) call
    const initCallData = encodeFunctionData({
      abi: [
        {
          name: 'createAccount',
          type: 'function',
          stateMutability: 'nonpayable',
          inputs: [
            { name: 'owner', type: 'bytes' },
            { name: 'salt', type: 'uint256' },
          ],
          outputs: [{ name: 'account', type: 'address' }],
        },
      ],
      functionName: 'createAccount',
      args: [ownerBytes, salt],
    });

    console.log('   Encoded createAccount call data:', initCallData.substring(0, 50) + '...');
    console.log('   Owner bytes used in initCode:', ownerBytes.substring(0, 50) + '...');
    console.log('   Owner bytes length:', ownerBytes.length);

    // InitCode format: factoryAddress (20 bytes) + initCallData
    // ERC-4337 initCode is: factory address + factory.createAccount call data
    const initCode = `${factoryAddress}${initCallData.slice(2)}` as Hex;
    
    // CRITICAL FIX #1: Validate initCode is non-empty and properly formatted
    if (initCode.length < 42) {
      throw new UserOperationError(
        `Invalid initCode: length ${initCode.length}, expected at least 42 (factory address + some data)`,
        ERROR_CODES.USEROP_REJECTED
      );
    }
    
    console.log('   ✅ InitCode generated successfully');
    console.log('   InitCode length:', initCode.length);
    console.log('   InitCode (first 50):', initCode.substring(0, 50) + '...');
    console.log('   Factory address in initCode:', initCode.substring(0, 42));
    
    // CRITICAL FIX #4: Verify factory address matches
    if (initCode.substring(0, 42).toLowerCase() !== factoryAddress.toLowerCase()) {
      throw new UserOperationError(
        `Factory address mismatch in initCode: expected ${factoryAddress}, got ${initCode.substring(0, 42)}`,
        ERROR_CODES.USEROP_REJECTED
      );
    }
    
    return initCode;
  }

  /**
   * Estimate gas for a UserOperation
   * Uses bundler's gas estimation when available, falls back to defaults with safety margins
   */
  private async estimateGasForCall(userOp: UserOperation): Promise<{
    callGasLimit: bigint;
    verificationGasLimit: bigint;
    preVerificationGas: bigint;
  }> {
    // If bundler client is available, use it for real gas estimation
    if (this.bundlerClient && typeof this.bundlerClient.estimateUserOperationGas === 'function') {
      try {
        console.log('📊 Estimating gas via bundler...');
        const estimate = await this.bundlerClient.estimateUserOperationGas(userOp);
        
        console.log('✅ Bundler gas estimate received:');
        console.log('   callGasLimit:', estimate.callGasLimit.toString());
        console.log('   verificationGasLimit:', estimate.verificationGasLimit.toString());
        console.log('   preVerificationGas:', estimate.preVerificationGas.toString());
        
        // Apply safety margins to bundler estimates
        // Important: preVerificationGas needs higher margin as bundler is strict about it
        const result = {
          callGasLimit: (estimate.callGasLimit * 120n) / 100n, // 20% buffer
          verificationGasLimit: (estimate.verificationGasLimit * 130n) / 100n, // 30% buffer
          preVerificationGas: (estimate.preVerificationGas * 115n) / 100n, // 15% buffer for preVerificationGas
        };
        
        console.log('✅ Gas estimates with safety margins:');
        console.log('   callGasLimit:', result.callGasLimit.toString());
        console.log('   verificationGasLimit:', result.verificationGasLimit.toString());
        console.log('   preVerificationGas:', result.preVerificationGas.toString());
        
        return result;
      } catch (error) {
        // Fall back to defaults if bundler estimation fails
        console.warn('⚠️ Bundler gas estimation failed, using defaults:', error);
        console.warn('   Error:', error instanceof Error ? error.message : 'Unknown error');
      }
    }

    // Fallback to defaults with safety margins
    const baseLimits = {
      callGasLimit: DEFAULT_GAS_LIMITS.callGasLimit,
      verificationGasLimit: DEFAULT_GAS_LIMITS.verificationGasLimit,
      preVerificationGas: DEFAULT_GAS_LIMITS.preVerificationGas,
    };

    // Apply safety margins (higher for preVerificationGas as bundler is strict)
    return {
      callGasLimit: (baseLimits.callGasLimit * 120n) / 100n, // 20% buffer
      verificationGasLimit: (baseLimits.verificationGasLimit * 130n) / 100n, // 30% buffer
      preVerificationGas: (baseLimits.preVerificationGas * 115n) / 100n, // 15% buffer for preVerificationGas
    };
  }

  /**
   * Get current fee data from the network
   */
  private async getFeeData(): Promise<{
    maxFeePerGas: bigint;
    maxPriorityFeePerGas: bigint;
  }> {
    try {
      const feeData = await this.publicClient.estimateFeesPerGas();

      return {
        maxFeePerGas: feeData.maxFeePerGas || 100_000_000_000n, // 100 gwei fallback
        maxPriorityFeePerGas: feeData.maxPriorityFeePerGas || 1_000_000_000n, // 1 gwei fallback
      };
    } catch (error) {
      // Fallback to reasonable defaults
      return {
        maxFeePerGas: 100_000_000_000n, // 100 gwei
        maxPriorityFeePerGas: 1_000_000_000n, // 1 gwei
      };
    }
  }
}

