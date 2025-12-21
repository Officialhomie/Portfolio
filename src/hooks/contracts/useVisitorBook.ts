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
import { useSmartWallet } from '@/contexts/SmartWalletContext';
import { encodeFunctionData } from 'viem';

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
 * Sign visitor book via CDP smart wallet
 */
export function useSignVisitorBook() {
  const { address, chainId } = useAccount();
  const contractAddress = getVisitorBookAddress(chainId);
  const { refetch: refetchVisitors } = useTotalVisitors();
  const { refetch: refetchHasVisited } = useHasVisited();
  const { executor, isSendingTransaction, error, smartWalletAddress } = useSmartWallet();
  const [txHash, setTxHash] = useState<`0x${string}` | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  const signVisitorBook = async (message: string, useEIP712: boolean = false) => {
    if (!message || message.length < 1 || message.length > 500) {
      throw new Error('Message must be between 1 and 500 characters');
    }

    if (!address) {
      throw new Error('Wallet not connected');
    }

    if (!smartWalletAddress) {
      throw new Error('Smart wallet not ready. Please complete biometric setup first.');
    }

    try {
      setIsConfirming(true);
      const currentChainId = chainId || base.id;
      const timestamp = BigInt(Math.floor(Date.now() / 1000));

      let data: `0x${string}`;

      // Use EIP-712 signature if supported and requested
      if (useEIP712) {
        // For EIP-712, we'd need to sign the typed data first, then send via smart wallet
        // For now, we'll use the simpler direct signing approach
        // TODO: Implement EIP-712 signing with smart wallet if needed
        console.warn('EIP-712 signing with smart wallet not yet implemented, using direct signing');
        data = encodeFunctionData({
          abi: VISITOR_BOOK_ABI,
          functionName: 'signVisitorBook',
          args: [message],
        });
      } else {
        // Direct signing via smart wallet
        data = encodeFunctionData({
          abi: VISITOR_BOOK_ABI,
          functionName: 'signVisitorBook',
          args: [message],
        });
      }

      // Execute via executor
      if (!executor) {
        throw new Error('Smart wallet executor not ready');
      }

      const result = await executor.execute({
        to: contractAddress,
        data,
        value: 0n,
      });

      setTxHash(result.txHash);
      setIsSuccess(true);

      // Refetch data after transaction
      setTimeout(() => {
        refetchVisitors();
        refetchHasVisited();
      }, 2000);
    } catch (err) {
      console.error('Sign visitor book failed:', err);
      throw err;
    } finally {
      setIsConfirming(false);
    }
  };

  return {
    signVisitorBook,
    isPending: isSendingTransaction,
    isConfirming,
    isSuccess,
    error,
    txHash,
    signature: null, // EIP-712 signature not used with smart wallet
  };
}

/**
 * Sign visitor book with biometric signature (EIP-7951)
 * @deprecated Use useSignVisitorBook instead - all transactions now use smart wallets
 */
export function useSignVisitorBookWithBiometric() {
  const { address, chainId } = useAccount();
  const contractAddress = getVisitorBookAddress(chainId);
  const { refetch: refetchVisitors } = useTotalVisitors();
  const { refetch: refetchHasVisited } = useHasVisited();
  const { isEnabled } = useBiometricAuth();
  const { executor, isSendingTransaction, smartWalletAddress } = useSmartWallet();

  const [isPending, setIsPending] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [txHash, setTxHash] = useState<`0x${string}` | null>(null);

  const signVisitorBookWithBiometric = async (message: string) => {
    if (!message || message.length < 1 || message.length > 500) {
      throw new Error('Message must be between 1 and 500 characters');
    }

    if (!isEnabled) {
      throw new Error('Biometric authentication not enabled');
    }

    if (!smartWalletAddress) {
      throw new Error('Smart wallet not ready. Please complete biometric setup first.');
    }

    const credentialId = getStoredBiometricCredential();
    if (!credentialId) {
      throw new Error('Biometric authentication not configured');
    }

    try {
      setIsPending(true);
      setIsConfirming(true);
      setError(null);

      console.log('🔐 Signing visitor book via CDP Smart Wallet (gasless!)');
      console.log('   Smart Wallet Address:', smartWalletAddress);
      console.log('   Message:', message);

      // Encode function call
      const data = encodeFunctionData({
        abi: VISITOR_BOOK_ABI,
        functionName: 'signVisitorBook',
        args: [message],
      });

      // Execute via executor
      if (!executor) {
        throw new Error('Smart wallet executor not ready');
      }

      const result = await executor.execute({
        to: contractAddress,
        data,
        value: 0n,
      });

      setTxHash(result.txHash);
      setIsSuccess(true);

      console.log('✅ Visitor book signed via CDP!');
      console.log('   Transaction Hash:', result.txHash);
      console.log('   🎉 Gas fees sponsored by CDP Paymaster!');

      // Refetch data
      await refetchVisitors();
      await refetchHasVisited();

    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to sign visitor book');
      setError(error);
      console.error('❌ Biometric sign visitor book error:', error);
      throw error;
    } finally {
      setIsPending(false);
      setIsConfirming(false);
    }
  };

  return {
    signVisitorBookWithBiometric,
    isPending: isPending || isSendingTransaction,
    isConfirming,
    isSuccess,
    error,
    txHash,
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
