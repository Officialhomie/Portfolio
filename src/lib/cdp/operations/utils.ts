/**
 * UserOperation utility functions
 */

import type { Address, Hex } from 'viem';
import { keccak256, encodePacked } from 'viem';
import type { UserOperation } from '../core/types';
import { ENTRYPOINT_ADDRESS } from '../core/constants';

/**
 * Get the hash of a UserOperation (ERC-4337 v0.6)
 * @see https://eips.ethereum.org/EIPS/eip-4337
 */
export function getUserOperationHash(userOp: UserOperation): Hex {
  // Pack UserOperation fields (without signature)
  const packed = encodePacked(
    [
      'address', // sender
      'uint256', // nonce
      'bytes32', // initCode hash
      'bytes32', // callData hash
      'uint256', // callGasLimit
      'uint256', // verificationGasLimit
      'uint256', // preVerificationGas
      'uint256', // maxFeePerGas
      'uint256', // maxPriorityFeePerGas
      'bytes32', // paymasterAndData hash
    ],
    [
      userOp.sender,
      userOp.nonce,
      keccak256(userOp.initCode),
      keccak256(userOp.callData),
      userOp.callGasLimit,
      userOp.verificationGasLimit,
      userOp.preVerificationGas,
      userOp.maxFeePerGas,
      userOp.maxPriorityFeePerGas,
      keccak256(userOp.paymasterAndData),
    ]
  );

  // Hash the packed data
  const userOpHash = keccak256(packed);

  // Encode with entry point address and chain ID
  // Note: In production, you should get chain ID from the chain config
  const chainId = 8453n; // Base mainnet - should be dynamic
  const encoded = encodePacked(
    ['bytes32', 'address', 'uint256'],
    [userOpHash, ENTRYPOINT_ADDRESS, chainId]
  );

  return keccak256(encoded);
}

/**
 * Encode a single call to callData
 */
export function encodeCallData(call: { to: Address; value?: bigint; data?: Hex }): Hex {
  // For a single call, we use the account's execute function
  // Format: execute(to, value, data)
  // This will be handled by the UserOperationBuilder
  return call.data || '0x';
}

/**
 * Encode multiple calls to batch callData
 */
export function encodeBatchCallData(calls: Array<{ to: Address; value?: bigint; data?: Hex }>): Hex {
  // For batch calls, we use the account's executeBatch function
  // Format: executeBatch([(to, value, data), ...])
  // This will be handled by the UserOperationBuilder
  // For now, return the first call's data
  if (calls.length === 0) {
    return '0x';
  }
  return calls[0].data || '0x';
}

