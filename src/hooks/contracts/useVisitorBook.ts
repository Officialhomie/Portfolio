'use client';

/**
 * Visitor Book Contract Hooks
 * Handles all VisitorBook.sol interactions
 */

import { useState } from 'react';
import { useAccount, useReadContract, useReadContracts, useWriteContract, useWaitForTransactionReceipt, useSignTypedData } from 'wagmi';
import { base } from 'wagmi/chains';
import { VISITOR_BOOK_ABI } from '@/lib/contracts/abis';
import { CONTRACT_ADDRESSES } from '@/lib/contracts/addresses';
import type { Visitor, VisitorTuple } from '@/lib/types/contracts';
import { useBiometricAuth } from '@/hooks/useBiometric';
import { generateVisitorBookSignature, getVisitorBookDomain, visitorSignatureTypes } from '@/lib/eip712/visitor-book';
import { useWalletClient } from 'wagmi';
import { signTransactionHashWithBiometric } from '@/lib/biometric/signer';
import { getStoredBiometricCredential, getStoredPublicKey } from '@/lib/biometric/auth';

/**
 * Get Visitor Book contract address
 */
function getVisitorBookAddress(chainId: number | undefined): `0x${string}` {
  if (!chainId) return CONTRACT_ADDRESSES[base.id].VisitorBook;
  return CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES]?.VisitorBook || CONTRACT_ADDRESSES[base.id].VisitorBook;
}

/**
 * Get total number of visitors
 */
export function useTotalVisitors() {
  const { chainId } = useAccount();
  const contractAddress = getVisitorBookAddress(chainId);

  const { data, isLoading, refetch } = useReadContract({
    address: contractAddress,
    abi: VISITOR_BOOK_ABI,
    functionName: 'getTotalVisitors',
    chainId: chainId || base.id,
    query: {
      staleTime: 30_000,
    },
  });

  return {
    totalVisitors: Number(data || 0),
    isLoading,
    refetch,
  };
}

/**
 * Get paginated visitor list
 */
export function useVisitorBook(pageSize: number = 20) {
  const { chainId } = useAccount();
  const contractAddress = getVisitorBookAddress(chainId);
  const [currentPage, setCurrentPage] = useState(0);
  const { totalVisitors } = useTotalVisitors();

  const offset = BigInt(currentPage * pageSize);
  const limit = BigInt(pageSize);

  const { data, isLoading, refetch } = useReadContract({
    address: contractAddress,
    abi: VISITOR_BOOK_ABI,
    functionName: 'getVisitors',
    args: [offset, limit],
    chainId: chainId || base.id,
    query: {
      enabled: totalVisitors > 0,
      staleTime: 30_000,
    },
  });

  const visitors: Visitor[] = data
    ? (data as readonly VisitorTuple[]).map((v) => ({
        visitor: v[0],
        message: v[1],
        timestamp: v[2],
      }))
    : [];

  const totalPages = Math.ceil(totalVisitors / pageSize);

  const nextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToPage = (page: number) => {
    if (page >= 0 && page < totalPages) {
      setCurrentPage(page);
    }
  };

  return {
    visitors,
    totalVisitors,
    currentPage,
    totalPages,
    pageSize,
    isLoading,
    refetch,
    nextPage,
    prevPage,
    goToPage,
    hasNextPage: currentPage < totalPages - 1,
    hasPrevPage: currentPage > 0,
  };
}

/**
 * Check if user has visited
 */
export function useHasVisited() {
  const { address, chainId } = useAccount();
  const contractAddress = getVisitorBookAddress(chainId);

  const { data, isLoading, refetch } = useReadContract({
    address: contractAddress,
    abi: VISITOR_BOOK_ABI,
    functionName: 'hasVisited',
    args: address ? [address] : undefined,
    chainId: chainId || base.id,
    query: {
      enabled: !!address,
      staleTime: 30_000,
    },
  });

  return {
    hasVisited: (data as boolean) ?? false,
    isLoading,
    refetch,
  };
}

/**
 * Get user's visit count
 */
export function useVisitCount() {
  const { address, chainId } = useAccount();
  const contractAddress = getVisitorBookAddress(chainId);

  const { data, isLoading } = useReadContract({
    address: contractAddress,
    abi: VISITOR_BOOK_ABI,
    functionName: 'getVisitCount',
    args: address ? [address] : undefined,
    chainId: chainId || base.id,
    query: {
      enabled: !!address,
    },
  });

  return {
    visitCount: Number(data || 0),
    isLoading,
  };
}

/**
 * Sign visitor book
 */
export function useSignVisitorBook() {
  const { address, chainId } = useAccount();
  const contractAddress = getVisitorBookAddress(chainId);
  const { refetch: refetchVisitors } = useTotalVisitors();
  const { refetch: refetchHasVisited } = useHasVisited();
  const { requestAuth, isEnabled } = useBiometricAuth();
  const { data: walletClient } = useWalletClient();

  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { signTypedData, data: signature, isPending: isSigning } = useSignTypedData();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const signVisitorBook = async (message: string, useEIP712: boolean = true) => {
    if (!message || message.length < 1 || message.length > 500) {
      throw new Error('Message must be between 1 and 500 characters');
    }

    if (!address) {
      throw new Error('Wallet not connected');
    }

    const currentChainId = chainId || base.id;
    const timestamp = BigInt(Math.floor(Date.now() / 1000));

    // Use EIP-712 signature if supported and requested
    if (useEIP712 && walletClient) {
      try {
        // Generate EIP-712 signature
        const eip712Signature = await generateVisitorBookSignature(
          walletClient,
          currentChainId,
          contractAddress,
          address,
          message,
          timestamp
        );

        // Call signVisitorBookWithSignature with timestamp parameter
        // Contract now accepts timestamp to match the signed timestamp
        await writeContract({
          address: contractAddress,
          abi: VISITOR_BOOK_ABI,
          functionName: 'signVisitorBookWithSignature',
          args: [message, eip712Signature, timestamp],
          chainId: currentChainId,
        });
        return;
      } catch (eip712Error) {
        console.warn('EIP-712 signing failed, falling back to direct signing:', eip712Error);
        // Fall through to direct signing
      }
    }

    // Fallback to direct signing
    await writeContract({
      address: contractAddress,
      abi: VISITOR_BOOK_ABI,
      functionName: 'signVisitorBook',
      args: [message],
      chainId: currentChainId,
    });
  };

  // Auto-refetch on success
  if (isSuccess && hash) {
    refetchVisitors();
    refetchHasVisited();
  }

  return {
    signVisitorBook,
    isPending: isPending || isSigning,
    isConfirming,
    isSuccess,
    error,
    txHash: hash,
    signature, // EIP-712 signature if used
  };
}

/**
 * Sign visitor book with biometric signature (EIP-7951)
 */
export function useSignVisitorBookWithBiometric() {
  const { address, chainId } = useAccount();
  const contractAddress = getVisitorBookAddress(chainId);
  const { refetch: refetchVisitors } = useTotalVisitors();
  const { refetch: refetchHasVisited } = useHasVisited();
  const { isEnabled } = useBiometricAuth();

  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const signVisitorBookWithBiometric = async (message: string) => {
    if (!message || message.length < 1 || message.length > 500) {
      throw new Error('Message must be between 1 and 500 characters');
    }

    if (!isEnabled) {
      throw new Error('Biometric authentication not enabled');
    }

    if (!address) {
      throw new Error('Wallet not connected');
    }

    const credentialId = getStoredBiometricCredential();
    if (!credentialId) {
      throw new Error('Biometric authentication not configured');
    }

    try {
      const currentChainId = chainId || base.id;
      const timestamp = BigInt(Math.floor(Date.now() / 1000));

      // Sign transaction hash with biometric
      const signature = await signTransactionHashWithBiometric({
        chainId: currentChainId,
        contractAddress,
        userAddress: address,
        functionName: 'signVisitorBook',
        functionParams: [message, timestamp],
      });

      // Call contract with biometric signature
      await writeContract({
        address: contractAddress,
        abi: VISITOR_BOOK_ABI,
        functionName: 'signVisitorBookWithBiometric',
        args: [message, signature.r, signature.s, signature.publicKeyX, signature.publicKeyY],
        chainId: currentChainId,
      });
    } catch (err) {
      console.error('Biometric sign visitor book error:', err);
      throw err;
    }
  };

  // Auto-refetch on success
  if (isSuccess && hash) {
    refetchVisitors();
    refetchHasVisited();
  }

  return {
    signVisitorBookWithBiometric,
    isPending,
    isConfirming,
    isSuccess,
    error,
    txHash: hash,
  };
}

/**
 * Get recent visitors (last N)
 */
export function useRecentVisitors(count: number = 5) {
  const { chainId } = useAccount();
  const contractAddress = getVisitorBookAddress(chainId);
  const { totalVisitors } = useTotalVisitors();

  // Calculate offset to get last N visitors
  const offset = BigInt(Math.max(0, totalVisitors - count));
  const limit = BigInt(count);

  const { data, isLoading, refetch } = useReadContract({
    address: contractAddress,
    abi: VISITOR_BOOK_ABI,
    functionName: 'getVisitors',
    args: [offset, limit],
    chainId: chainId || base.id,
    query: {
      enabled: totalVisitors > 0,
      staleTime: 30_000,
    },
  });

  const visitors: Visitor[] = data
    ? (data as readonly VisitorTuple[])
        .map((v) => ({
          visitor: v[0],
          message: v[1],
          timestamp: v[2],
        }))
        .reverse() // Show most recent first
    : [];

  return {
    visitors,
    isLoading,
    refetch,
  };
}

/**
 * Validate message length
 */
export function useMessageValidation(message: string) {
  const MIN_LENGTH = 1;
  const MAX_LENGTH = 500;

  const length = message.length;
  const isValid = length >= MIN_LENGTH && length <= MAX_LENGTH;
  const isTooShort = length < MIN_LENGTH;
  const isTooLong = length > MAX_LENGTH;
  const charactersRemaining = MAX_LENGTH - length;

  let warningLevel: 'none' | 'warning' | 'danger' = 'none';
  if (charactersRemaining <= 50 && charactersRemaining > 0) {
    warningLevel = 'warning';
  } else if (isTooLong) {
    warningLevel = 'danger';
  }

  return {
    isValid,
    isTooShort,
    isTooLong,
    length,
    minLength: MIN_LENGTH,
    maxLength: MAX_LENGTH,
    charactersRemaining,
    warningLevel,
  };
}
