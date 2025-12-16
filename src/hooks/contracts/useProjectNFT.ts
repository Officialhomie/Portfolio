'use client';

/**
 * Project NFT Contract Hooks
 * Handles all ProjectNFT.sol interactions
 */

import { useAccount, useReadContract, useReadContracts, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { base } from 'wagmi/chains';
import { PROJECT_NFT_ABI } from '@/lib/contracts/abis';
import { CONTRACT_ADDRESSES } from '@/lib/contracts/addresses';
import type { Project, ProjectTuple } from '@/lib/types/contracts';
import { useBiometricAuth } from '@/hooks/useBiometric';
import { signTransactionHashWithBiometric } from '@/lib/biometric/signer';
import { getStoredBiometricCredential, getStoredPublicKey } from '@/lib/biometric/auth';

/**
 * Get Project NFT contract address
 */
function getProjectNFTAddress(chainId: number | undefined): `0x${string}` {
  if (!chainId) return CONTRACT_ADDRESSES[base.id].ProjectNFT;
  return CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES]?.ProjectNFT || CONTRACT_ADDRESSES[base.id].ProjectNFT;
}

/**
 * Get total number of projects
 */
export function useTotalProjects() {
  const { chainId } = useAccount();
  const contractAddress = getProjectNFTAddress(chainId);

  const { data, isLoading, refetch } = useReadContract({
    address: contractAddress,
    abi: PROJECT_NFT_ABI,
    functionName: 'totalSupply',
    chainId: chainId || base.id,
    query: {
      staleTime: 60_000, // 1 minute
    },
  });

  return {
    totalProjects: Number(data || 0),
    isLoading,
    refetch,
  };
}

/**
 * Get all projects (batch fetch)
 */
export function useProjectList() {
  const { chainId } = useAccount();
  const contractAddress = getProjectNFTAddress(chainId);
  const { totalProjects, isLoading: loadingTotal } = useTotalProjects();

  // Generate array of token IDs
  const tokenIds = Array.from({ length: totalProjects }, (_, i) => BigInt(i));

  // Batch fetch all project data
  const { data, isLoading, refetch } = useReadContracts({
    contracts: tokenIds.map((tokenId) => ({
      address: contractAddress,
      abi: PROJECT_NFT_ABI,
      functionName: 'getProject',
      args: [tokenId],
      chainId: chainId || base.id,
    })),
    query: {
      enabled: totalProjects > 0,
      staleTime: 60_000,
    },
  });

  const projects = data?.map((result, index) => {
    if (result.status === 'success' && result.result) {
      const projectData = result.result as ProjectTuple;
      // Note: projectId is not in the Project struct - it must be fetched separately
      // For now, we'll use tokenId as a placeholder or fetch it separately if needed
      return {
        tokenId: projectData[0],
        projectId: `project-${projectData[0].toString()}`, // Temporary: derive from tokenId
        name: projectData[1],
        ipfsMetadataURI: projectData[2],
        creator: projectData[3],
        createdAt: projectData[4],
        endorsementCount: projectData[5],
      } as Project;
    }
    return null;
  }).filter(Boolean) as Project[];

  return {
    projects: projects || [],
    isLoading: loadingTotal || isLoading,
    refetch,
    totalProjects,
  };
}

/**
 * Get single project by token ID
 */
export function useProject(tokenId: bigint | undefined) {
  const { chainId } = useAccount();
  const contractAddress = getProjectNFTAddress(chainId);

  const { data, isLoading, refetch } = useReadContract({
    address: contractAddress,
    abi: PROJECT_NFT_ABI,
    functionName: 'getProject',
    args: tokenId !== undefined ? [tokenId] : undefined,
    chainId: chainId || base.id,
    query: {
      enabled: tokenId !== undefined,
      staleTime: 60_000,
    },
  });

  let project: Project | null = null;
  if (data) {
    const projectData = data as ProjectTuple;
    // Note: projectId is not in the Project struct - it must be fetched separately
    // For now, we'll use tokenId as a placeholder or fetch it separately if needed
    project = {
      tokenId: projectData[0],
      projectId: `project-${projectData[0].toString()}`, // Temporary: derive from tokenId
      name: projectData[1],
      ipfsMetadataURI: projectData[2],
      creator: projectData[3],
      createdAt: projectData[4],
      endorsementCount: projectData[5],
    };
  }

  return {
    project,
    isLoading,
    refetch,
  };
}

/**
 * Get project by project ID (string identifier)
 */
export function useProjectByProjectId(projectId: string | undefined) {
  const { chainId } = useAccount();
  const contractAddress = getProjectNFTAddress(chainId);

  // First get the token ID
  const { data: tokenIdData, isLoading: loadingTokenId } = useReadContract({
    address: contractAddress,
    abi: PROJECT_NFT_ABI,
    functionName: 'getTokenIdByProjectId',
    args: projectId ? [projectId] : undefined,
    chainId: chainId || base.id,
    query: {
      enabled: !!projectId,
    },
  });

  const tokenId = tokenIdData as bigint | undefined;

  // Then get the project
  const { project, isLoading: loadingProject, refetch } = useProject(tokenId);

  return {
    project,
    tokenId,
    isLoading: loadingTokenId || loadingProject,
    refetch,
  };
}

/**
 * Endorse a project
 */
export function useEndorseProject(tokenId: bigint | undefined) {
  const { chainId } = useAccount();
  const contractAddress = getProjectNFTAddress(chainId);
  const { refetch } = useProject(tokenId);

  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const endorseProject = async () => {
    if (tokenId === undefined) {
      throw new Error('Token ID is required');
    }

    await writeContract({
      address: contractAddress,
      abi: PROJECT_NFT_ABI,
      functionName: 'endorseProject',
      args: [tokenId],
      chainId: chainId || base.id,
    });
  };

  // Auto-refetch on success
  if (isSuccess && hash) {
    refetch();
  }

  return {
    endorseProject,
    isPending,
    isConfirming,
    isSuccess,
    error,
    txHash: hash,
  };
}

/**
 * Endorse a project with biometric signature (EIP-7951)
 */
export function useEndorseProjectWithBiometric(tokenId: bigint | undefined) {
  const { chainId, address } = useAccount();
  const contractAddress = getProjectNFTAddress(chainId);
  const { refetch } = useProject(tokenId);
  const { isEnabled } = useBiometricAuth();

  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const endorseProjectWithBiometric = async () => {
    if (tokenId === undefined) {
      throw new Error('Token ID is required');
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
        functionName: 'endorseProject',
        functionParams: [tokenId],
      });

      // Call contract with biometric signature
      await writeContract({
        address: contractAddress,
        abi: PROJECT_NFT_ABI,
        functionName: 'endorseProjectWithBiometric',
        args: [tokenId, signature.r, signature.s, signature.publicKeyX, signature.publicKeyY],
        chainId: chainId || base.id,
      });
    } catch (err) {
      console.error('Biometric endorse error:', err);
      throw err;
    }
  };

  // Auto-refetch on success
  if (isSuccess && hash) {
    refetch();
  }

  return {
    endorseProjectWithBiometric,
    isPending,
    isConfirming,
    isSuccess,
    error,
    txHash: hash,
  };
}

/**
 * Get token URI (IPFS metadata)
 */
export function useTokenURI(tokenId: bigint | undefined) {
  const { chainId } = useAccount();
  const contractAddress = getProjectNFTAddress(chainId);

  const { data, isLoading } = useReadContract({
    address: contractAddress,
    abi: PROJECT_NFT_ABI,
    functionName: 'tokenURI',
    args: tokenId !== undefined ? [tokenId] : undefined,
    chainId: chainId || base.id,
    query: {
      enabled: tokenId !== undefined,
      staleTime: Infinity, // IPFS URIs are immutable
    },
  });

  return {
    tokenURI: data as string | undefined,
    isLoading,
  };
}

/**
 * Check if user owns any project NFTs (for portfolio owner)
 */
export function useOwnsProjects() {
  const { address, chainId } = useAccount();
  const contractAddress = getProjectNFTAddress(chainId);

  const { data, isLoading } = useReadContract({
    address: contractAddress,
    abi: PROJECT_NFT_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    chainId: chainId || base.id,
    query: {
      enabled: !!address,
    },
  });

  return {
    balance: Number(data || 0),
    ownsProjects: Number(data || 0) > 0,
    isLoading,
  };
}
