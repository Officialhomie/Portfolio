/**
 * Hook for managing biometric transaction nonces
 * Provides replay protection by ensuring each signature is unique
 */

'use client';

import { useReadContract, useAccount } from 'wagmi';

/**
 * Generic ABI for nonces function
 * All biometric-enabled contracts have this function
 */
const NONCE_ABI = [
  {
    inputs: [{ internalType: 'address', name: '', type: 'address' }],
    name: 'nonces',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

/**
 * Fetch current nonce for a user from a contract
 */
export function useNonce(contractAddress: `0x${string}` | undefined) {
  const { address, chainId } = useAccount();

  const { data, isLoading, refetch, error } = useReadContract({
    address: contractAddress,
    abi: NONCE_ABI,
    functionName: 'nonces',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!contractAddress,
      // Refetch on every render to ensure nonce is current
      staleTime: 0,
    },
  });

  return {
    nonce: data !== undefined ? data : BigInt(0),
    nonceRaw: data,
    isLoading,
    refetch,
    error,
  };
}

/**
 * Fetch nonces from multiple contracts
 * Useful for batch operations
 */
export function useMultipleNonces(contractAddresses: `0x${string}`[]) {
  const { address } = useAccount();
  const nonces: Record<string, bigint> = {};
  const isLoading: boolean[] = [];
  const errors: (Error | null)[] = [];

  // Note: This creates multiple hooks - in a real implementation,
  // you'd want to use useReadContracts for batch reading
  contractAddresses.forEach((contractAddress) => {
    const { data, isLoading: loading, error } = useReadContract({
      address: contractAddress,
      abi: NONCE_ABI,
      functionName: 'nonces',
      args: address ? [address] : undefined,
      query: {
        enabled: !!address,
        staleTime: 0,
      },
    });

    nonces[contractAddress] = data !== undefined ? data : BigInt(0);
    isLoading.push(loading);
    errors.push(error);
  });

  return {
    nonces,
    isLoading: isLoading.some((l) => l),
    errors: errors.filter((e) => e !== null),
    hasErrors: errors.some((e) => e !== null),
  };
}
