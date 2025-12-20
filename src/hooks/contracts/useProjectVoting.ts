'use client';

/**
 * Project Voting Contract Hooks
 * Handles all ProjectVoting.sol interactions
 */

import { useState } from 'react';
import { useAccount, useReadContract, useReadContracts, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits, encodeFunctionData } from 'viem';
import { base } from 'wagmi/chains';
import { useSmartWallet } from '@/contexts/SmartWalletContext';
import { PROJECT_VOTING_ABI } from '@/lib/contracts/abis';
import { CONTRACT_ADDRESSES } from '@/lib/contracts/addresses';
import { usePortfolioToken } from './usePortfolioToken';
import { useBiometricAuth } from '@/hooks/useBiometric';
import { generateVoteHash } from '@/lib/biometric/message-hash';
import { signWithBiometric, getStoredBiometricCredential, getStoredPublicKey } from '@/lib/biometric/auth';
import { parseWebAuthnSignature } from '@/lib/biometric/signature-parser';
import { useNonce } from '@/hooks/useNonce';
import { assertTrustedContract } from '@/lib/biometric/contract-validation';

/**
 * Get Project Voting contract address
 */
function getVotingAddress(chainId: number | undefined): `0x${string}` {
  if (!chainId) return CONTRACT_ADDRESSES[base.id].ProjectVoting;
  return CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES]?.ProjectVoting || CONTRACT_ADDRESSES[base.id].ProjectVoting;
}

/**
 * Get vote count for a project
 */
export function useProjectVotes(projectId: string | undefined) {
  const { chainId } = useAccount();
  const contractAddress = getVotingAddress(chainId);

  const { data, isLoading, refetch } = useReadContract({
    address: contractAddress,
    abi: PROJECT_VOTING_ABI,
    functionName: 'getVotes',
    args: projectId ? [projectId] : undefined,
    chainId: chainId || base.id,
    query: {
      enabled: !!projectId,
      staleTime: 30_000, // 30 seconds
    },
  });

  return {
    voteCount: Number(data || 0),
    isLoading,
    refetch,
  };
}

/**
 * Check if user has voted for a project
 */
export function useHasVoted(projectId: string | undefined) {
  const { address, chainId } = useAccount();
  const contractAddress = getVotingAddress(chainId);

  const { data, isLoading, refetch } = useReadContract({
    address: contractAddress,
    abi: PROJECT_VOTING_ABI,
    functionName: 'checkVote',
    args: address && projectId ? [address, projectId] : undefined,
    chainId: chainId || base.id,
    query: {
      enabled: !!address && !!projectId,
      staleTime: 30_000,
    },
  });

  return {
    hasVoted: (data as boolean) ?? false,
    isLoading,
    refetch,
  };
}

/**
 * Get user's total votes cast
 */
export function useUserTotalVotes() {
  const { address, chainId } = useAccount();
  const contractAddress = getVotingAddress(chainId);

  const { data, isLoading } = useReadContract({
    address: contractAddress,
    abi: PROJECT_VOTING_ABI,
    functionName: 'getTotalVotesByAddress',
    args: address ? [address] : undefined,
    chainId: chainId || base.id,
    query: {
      enabled: !!address,
      staleTime: 30_000,
    },
  });

  return {
    totalVotes: Number(data || 0),
    isLoading,
  };
}

/**
 * Get total votes across all projects
 */
export function useTotalVotes() {
  const { chainId } = useAccount();
  const contractAddress = getVotingAddress(chainId);

  const { data, isLoading, refetch } = useReadContract({
    address: contractAddress,
    abi: PROJECT_VOTING_ABI,
    functionName: 'getTotalVotes',
    chainId: chainId || base.id,
    query: {
      staleTime: 30_000,
    },
  });

  return {
    totalVotes: Number(data || 0),
    isLoading,
    refetch,
  };
}

/**
 * Check if user can vote (has tokens and hasn't voted)
 */
export function useCanVote(projectId: string | undefined) {
  const { balanceRaw } = usePortfolioToken();
  const { hasVoted, isLoading: loadingVoteStatus } = useHasVoted(projectId);
  const VOTE_COST = parseUnits('10', 18);

  const hasEnoughTokens = balanceRaw >= VOTE_COST;
  const canVote = hasEnoughTokens && !hasVoted;

  let reason: string | null = null;
  if (hasVoted) {
    reason = 'Already voted for this project';
  } else if (!hasEnoughTokens) {
    reason = 'Insufficient $HOMIE tokens (need 10 $HOMIE)';
  }

  return {
    canVote,
    hasEnoughTokens,
    hasVoted,
    reason,
    isLoading: loadingVoteStatus,
  };
}

/**
 * Vote for a project via CDP smart wallet
 */
export function useVote(projectId: string | undefined) {
  const { chainId, address } = useAccount();
  const contractAddress = getVotingAddress(chainId);
  const { refetch: refetchVotes } = useProjectVotes(projectId);
  const { refetch: refetchHasVoted } = useHasVoted(projectId);
  const { refetch: refetchBalance } = usePortfolioToken();
  const { sendTransaction, isSendingTransaction, error, smartWalletAddress } = useSmartWallet();
  const [txHash, setTxHash] = useState<`0x${string}` | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  const vote = async () => {
    if (!projectId) {
      throw new Error('Project ID is required');
    }

    if (!address || !chainId) {
      throw new Error('Wallet not connected');
    }

    if (!smartWalletAddress) {
      throw new Error('Smart wallet not ready. Please complete biometric setup first.');
    }

    try {
      setIsConfirming(true);

      const data = encodeFunctionData({
        abi: PROJECT_VOTING_ABI,
        functionName: 'vote',
        args: [projectId],
      });

      // Send via CDP smart wallet (biometric signature)
      const hash = await sendTransaction({
        to: contractAddress,
        data,
        value: 0n,
      });

      setTxHash(hash);
      setIsSuccess(true);

      // Refetch data after transaction
      setTimeout(() => {
        refetchVotes();
        refetchHasVoted();
        refetchBalance(); // Balance changes due to token burn
      }, 2000);
    } catch (err) {
      console.error('Vote failed:', err);
      throw err;
    } finally {
      setIsConfirming(false);
    }
  };

  return {
    vote,
    isPending: isSendingTransaction,
    isConfirming,
    isSuccess,
    error,
    txHash,
  };
}

/**
 * Vote for a project with biometric signature (EIP-7951)
 * @deprecated Use useVote instead - all transactions now use smart wallets
 */
export function useVoteWithBiometric(projectId: string | undefined) {
  const { chainId, address } = useAccount();
  const contractAddress = getVotingAddress(chainId);
  const { refetch: refetchVotes } = useProjectVotes(projectId);
  const { refetch: refetchHasVoted } = useHasVoted(projectId);
  const { refetch: refetchBalance } = usePortfolioToken();
  const { isEnabled } = useBiometricAuth();
  const { sendTransaction, isSendingTransaction, smartWalletAddress } = useSmartWallet();

  const [isPending, setIsPending] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [txHash, setTxHash] = useState<`0x${string}` | null>(null);

  const voteWithBiometric = async () => {
    if (!projectId) {
      throw new Error('Project ID is required');
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

      console.log('🗳️ Voting via CDP Smart Wallet (gasless!)');
      console.log('   Smart Wallet Address:', smartWalletAddress);
      console.log('   Project ID:', projectId);

      // Encode function call
      const data = encodeFunctionData({
        abi: PROJECT_VOTING_ABI,
        functionName: 'vote',
        args: [projectId],
      });

      // Send via CDP Smart Wallet (GASLESS!)
      const hash = await sendTransaction({
        to: contractAddress,
        data,
        value: 0n,
      });

      setTxHash(hash);
      setIsSuccess(true);

      console.log('✅ Vote cast via CDP!');
      console.log('   Transaction Hash:', hash);
      console.log('   🎉 Gas fees sponsored by CDP Paymaster!');

      // Refetch data
      await refetchVotes();
      await refetchHasVoted();
      await refetchBalance();

    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to vote');
      setError(error);
      console.error('❌ Biometric vote error:', error);
      throw error;
    } finally {
      setIsPending(false);
      setIsConfirming(false);
    }
  };

  return {
    voteWithBiometric,
    isPending: isPending || isSendingTransaction,
    isConfirming,
    isSuccess,
    error,
    txHash,
  };
}

/**
 * Get vote cost
 */
export function useVoteCost() {
  const { chainId } = useAccount();
  const contractAddress = getVotingAddress(chainId);

  const { data } = useReadContract({
    address: contractAddress,
    abi: PROJECT_VOTING_ABI,
    functionName: 'voteCost',
    chainId: chainId || base.id,
  });

  return {
    voteCost: data ? Number(data) / 1e18 : 10, // Default 10 HOMIE
    voteCostRaw: data as bigint | undefined,
  };
}

/**
 * Get votes for multiple projects (batch)
 */
export function useBatchProjectVotes(projectIds: string[]) {
  const { chainId } = useAccount();
  const contractAddress = getVotingAddress(chainId);

  const { data, isLoading } = useReadContracts({
    contracts: projectIds.map((projectId) => ({
      address: contractAddress,
      abi: PROJECT_VOTING_ABI,
      functionName: 'getVotes',
      args: [projectId],
      chainId: chainId || base.id,
    })),
    query: {
      enabled: projectIds.length > 0,
      staleTime: 30_000,
    },
  });

  const voteCounts = data?.map((result, index) => ({
    projectId: projectIds[index],
    voteCount: result.status === 'success' ? Number(result.result || 0) : 0,
  })) || [];

  return {
    voteCounts,
    isLoading,
  };
}
