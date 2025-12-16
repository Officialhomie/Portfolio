'use client';

/**
 * Project Voting Contract Hooks
 * Handles all ProjectVoting.sol interactions
 */

import { useAccount, useReadContract, useReadContracts, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits } from 'viem';
import { base } from 'wagmi/chains';
import { PROJECT_VOTING_ABI } from '@/lib/contracts/abis';
import { CONTRACT_ADDRESSES } from '@/lib/contracts/addresses';
import { usePortfolioToken } from './usePortfolioToken';
import { useBiometricAuth } from '@/hooks/useBiometric';
import { signTransactionHashWithBiometric } from '@/lib/biometric/signer';
import { getStoredBiometricCredential, getStoredPublicKey } from '@/lib/biometric/auth';

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
    reason = 'Insufficient HOMIE tokens (need 10 HOMIE)';
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
 * Vote for a project
 */
export function useVote(projectId: string | undefined) {
  const { chainId } = useAccount();
  const contractAddress = getVotingAddress(chainId);
  const { refetch: refetchVotes } = useProjectVotes(projectId);
  const { refetch: refetchHasVoted } = useHasVoted(projectId);
  const { refetch: refetchBalance } = usePortfolioToken();

  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const vote = async () => {
    if (!projectId) {
      throw new Error('Project ID is required');
    }

    await writeContract({
      address: contractAddress,
      abi: PROJECT_VOTING_ABI,
      functionName: 'vote',
      args: [projectId],
      chainId: chainId || base.id,
    });
  };

  // Auto-refetch on success
  if (isSuccess && hash) {
    refetchVotes();
    refetchHasVoted();
    refetchBalance(); // Balance changes due to token burn
  }

  return {
    vote,
    isPending,
    isConfirming,
    isSuccess,
    error,
    txHash: hash,
  };
}

/**
 * Vote for a project with biometric signature (EIP-7951)
 */
export function useVoteWithBiometric(projectId: string | undefined) {
  const { chainId, address } = useAccount();
  const contractAddress = getVotingAddress(chainId);
  const { refetch: refetchVotes } = useProjectVotes(projectId);
  const { refetch: refetchHasVoted } = useHasVoted(projectId);
  const { refetch: refetchBalance } = usePortfolioToken();
  const { isEnabled } = useBiometricAuth();

  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const voteWithBiometric = async () => {
    if (!projectId) {
      throw new Error('Project ID is required');
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
      // Sign transaction hash with biometric
      const signature = await signTransactionHashWithBiometric({
        chainId: chainId || base.id,
        contractAddress,
        userAddress: address,
        functionName: 'vote',
        functionParams: [projectId],
      });

      // Call contract with biometric signature
      await writeContract({
        address: contractAddress,
        abi: PROJECT_VOTING_ABI,
        functionName: 'voteWithBiometric',
        args: [projectId, signature.r, signature.s, signature.publicKeyX, signature.publicKeyY],
        chainId: chainId || base.id,
      });
    } catch (err) {
      console.error('Biometric vote error:', err);
      throw err;
    }
  };

  // Auto-refetch on success
  if (isSuccess && hash) {
    refetchVotes();
    refetchHasVoted();
    refetchBalance();
  }

  return {
    voteWithBiometric,
    isPending,
    isConfirming,
    isSuccess,
    error,
    txHash: hash,
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
