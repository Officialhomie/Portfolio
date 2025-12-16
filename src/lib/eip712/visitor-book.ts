/**
 * EIP-712 Signature Generation for VisitorBook
 * Generates structured data signatures compatible with VisitorBook.sol
 */

import type { TypedDataDomain } from 'viem';
import type { Address } from 'viem';

/**
 * EIP-712 domain for VisitorBook contract
 */
export function getVisitorBookDomain(chainId: number, contractAddress: Address): TypedDataDomain {
  return {
    name: 'VisitorBook',
    version: '1',
    chainId,
    verifyingContract: contractAddress,
  };
}

/**
 * EIP-712 types for VisitorSignature
 */
export const visitorSignatureTypes = {
  VisitorSignature: [
    { name: 'visitor', type: 'address' },
    { name: 'message', type: 'string' },
    { name: 'timestamp', type: 'uint256' },
  ],
} as const;

/**
 * Generate EIP-712 signature for visitor book signing
 */
export async function generateVisitorBookSignature(
  signer: { signTypedData: (args: {
    domain: TypedDataDomain;
    types: typeof visitorSignatureTypes;
    primaryType: 'VisitorSignature';
    message: {
      visitor: Address;
      message: string;
      timestamp: bigint;
    };
  }) => Promise<`0x${string}`> },
  chainId: number,
  contractAddress: Address,
  visitor: Address,
  message: string,
  timestamp: bigint
): Promise<`0x${string}`> {
  const domainData = getVisitorBookDomain(chainId, contractAddress);

  return signer.signTypedData({
    domain: domainData,
    types: visitorSignatureTypes,
    primaryType: 'VisitorSignature',
    message: {
      visitor,
      message,
      timestamp,
    },
  });
}

/**
 * Prepare visitor book signature data
 */
export function prepareVisitorBookSignatureData(
  visitor: Address,
  message: string,
  timestamp: bigint
) {
  return {
    visitor,
    message,
    timestamp,
  };
}

