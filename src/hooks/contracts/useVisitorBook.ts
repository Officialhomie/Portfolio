'use client';

/**
 * Visitor Book Contract Hooks
 * Handles all VisitorBook.sol interactions
 */

import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useReadContracts, useWriteContract, useWaitForTransactionReceipt, useSignTypedData } from 'wagmi';
import { base } from 'wagmi/chains';
import { VISITOR_BOOK_ABI } from '@/lib/contracts/abis';
import { CONTRACT_ADDRESSES } from '@/lib/contracts/addresses';
import type { Visitor, VisitorTuple } from '@/lib/types/contracts';
import { generateVisitorBookSignature, getVisitorBookDomain, visitorSignatureTypes } from '@/lib/eip712/visitor-book';
import { useWalletClient } from 'wagmi';
import { usePrivyWallet } from '@/hooks/usePrivyWallet';
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
 * Sign visitor book via Privy smart wallet or EOA wallet
 */
export function useSignVisitorBook() {
  const { address, chainId } = useAccount();
  const contractAddress = getVisitorBookAddress(chainId);
  const { refetch: refetchVisitors } = useTotalVisitors();
  const { refetch: refetchHasVisited } = useHasVisited();
  const { sendTransaction, isSendingTransaction, error: privyError, smartWalletAddress } = usePrivyWallet();
  const { writeContract, data: writeTxHash, isPending: isWritePending, error: writeError } = useWriteContract();
  const [txHash, setTxHash] = useState<`0x${string}` | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  
  // Update txHash when writeContract succeeds
  useEffect(() => {
    if (writeTxHash) {
      setTxHash(writeTxHash);
    }
  }, [writeTxHash]);

  // Wait for EOA transaction receipt
  const { isLoading: isWaitingTx, isSuccess: isTxSuccess, data: receipt } = useWaitForTransactionReceipt({
    hash: txHash || undefined,
  });

  const signVisitorBook = async (message: string, useEIP712: boolean = false) => {
    if (!message || message.length < 1 || message.length > 500) {
      throw new Error('Message must be between 1 and 500 characters');
    }

    if (!address) {
      throw new Error('Wallet not connected');
    }

    // If smart wallet is available, use it (preferred method)
    if (smartWalletAddress) {
      console.log('✅ Using smart wallet for visitor book signing');

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

        // Execute via Privy transaction
        const result = await sendTransaction({
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
    } else {
      // Fallback: Sign directly from EOA wallet using wagmi
      console.log('⚠️ Smart wallet not available, using EOA wallet directly');
      console.log('   This will sign the visitor book directly from your EOA address');
      
      try {
        setIsConfirming(true);
        
        console.log('📦 Calling signVisitorBook directly from EOA...');
        console.log('   Contract:', contractAddress);
        console.log('   EOA Address:', address);
        console.log('   Message:', message);
        
        // Use wagmi's writeContract to call signVisitorBook directly
        // The contract will use msg.sender as the visitor address
        writeContract({
          address: contractAddress,
          abi: VISITOR_BOOK_ABI,
          functionName: 'signVisitorBook',
          args: [message],
        });

        console.log('✅ Transaction submitted!');
        // The hash will be available in writeTxHash from the hook
        
      } catch (err) {
        console.error('Sign visitor book failed:', err);
        setIsConfirming(false);
        throw err;
      }
    }
  };

  // Handle EOA transaction success
  useEffect(() => {
    if (isTxSuccess && receipt && !isSuccess) {
      console.log('✅ EOA transaction confirmed!');
      setIsSuccess(true);
      setIsConfirming(false);
      
      // Refetch data after transaction
      setTimeout(() => {
        refetchVisitors();
        refetchHasVisited();
      }, 2000);
    }
  }, [isTxSuccess, receipt, isSuccess, refetchVisitors, refetchHasVisited]);

  return {
    signVisitorBook,
    isPending: isSendingTransaction || isWritePending || isWaitingTx,
    isConfirming,
    isSuccess,
    error: privyError || writeError || null,
    txHash,
    signature: null, // EIP-712 signature not used with smart wallet
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
 * Get all messages for the connected user
 * Note: Users can sign multiple times, so this returns all their messages
 */
export function useUserMessages() {
  const { address, chainId } = useAccount();
  const contractAddress = getVisitorBookAddress(chainId);
  const { totalVisitors } = useTotalVisitors();

  // Get all visitors (we'll filter client-side)
  // For efficiency, we could add a contract function to get user-specific messages
  const { data, isLoading, refetch } = useReadContract({
    address: contractAddress,
    abi: VISITOR_BOOK_ABI,
    functionName: 'getVisitors',
    args: [0n, BigInt(totalVisitors)], // Get all visitors
    chainId: chainId || base.id,
    query: {
      enabled: !!address && totalVisitors > 0,
      staleTime: 30_000,
    },
  });

  // Filter visitors to only those from the connected user
  const userMessages: Visitor[] = data && address
    ? (data as readonly VisitorTuple[])
        .filter((v) => v[0].toLowerCase() === address.toLowerCase())
        .map((v) => ({
          visitor: v[0],
          message: v[1],
          timestamp: v[2],
        }))
        .reverse() // Most recent first
    : [];

  // Get most recent message
  const latestMessage = userMessages.length > 0 ? userMessages[0] : null;

  return {
    messages: userMessages,
    latestMessage,
    messageCount: userMessages.length,
    isLoading,
    refetch,
  };
}

/**
 * Get the most recent message for the connected user
 * Convenience hook that returns just the latest message
 */
export function useUserLatestMessage() {
  const { latestMessage, isLoading, refetch } = useUserMessages();
  
  return {
    message: latestMessage?.message || null,
    visitor: latestMessage?.visitor || null,
    timestamp: latestMessage?.timestamp || null,
    hasMessage: !!latestMessage,
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
