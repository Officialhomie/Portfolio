'use client';

/**
 * Visit NFT Contract Hooks
 * Handles all VisitNFT.sol interactions
 */

import { useAccount, useReadContract, useReadContracts, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { base } from 'wagmi/chains';
import { VISIT_NFT_ABI } from '@/lib/contracts/abis';
import { CONTRACT_ADDRESSES } from '@/lib/contracts/addresses';
import { useBiometricAuth } from '@/hooks/useBiometric';
import { signTransactionHashWithBiometric } from '@/lib/biometric/signer';
import { getStoredBiometricCredential, getStoredPublicKey } from '@/lib/biometric/auth';

/**
 * Get Visit NFT contract address
 */
function getVisitNFTAddress(chainId: number | undefined): `0x${string}` {
  if (!chainId) return CONTRACT_ADDRESSES[base.id].VisitNFT;
  return CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES]?.VisitNFT || CONTRACT_ADDRESSES[base.id].VisitNFT;
}

/**
 * Get Visit NFT data (supply, eligibility, etc.)
 */
export function useVisitNFT() {
  const { address, chainId } = useAccount();
  const contractAddress = getVisitNFTAddress(chainId);

  const { data, isLoading, refetch } = useReadContracts({
    contracts: [
      {
        address: contractAddress,
        abi: VISIT_NFT_ABI,
        functionName: 'totalSupply',
        chainId: chainId || base.id,
      },
      {
        address: contractAddress,
        abi: VISIT_NFT_ABI,
        functionName: 'hasMinted',
        args: address ? [address] : undefined,
        chainId: chainId || base.id,
      },
      {
        address: contractAddress,
        abi: VISIT_NFT_ABI,
        functionName: 'MAX_SUPPLY',
        chainId: chainId || base.id,
      },
      {
        address: contractAddress,
        abi: VISIT_NFT_ABI,
        functionName: 'balanceOf',
        args: address ? [address] : undefined,
        chainId: chainId || base.id,
      },
    ],
    query: {
      enabled: !!address,
      staleTime: 30_000,
    },
  });

  const totalSupply = Number(data?.[0]?.result || 0);
  const hasMinted = (data?.[1]?.result as boolean) ?? false;
  const maxSupply = Number(data?.[2]?.result || 100);
  const balance = Number(data?.[3]?.result || 0);

  const remainingSupply = Math.max(0, maxSupply - totalSupply);
  const canMint = !hasMinted && remainingSupply > 0;

  return {
    totalSupply,
    hasMinted,
    maxSupply,
    remainingSupply,
    canMint,
    balance,
    isLoading,
    refetch,
    contractAddress,
  };
}

/**
 * Mint Visit NFT
 */
export function useMintVisitNFT() {
  const { chainId } = useAccount();
  const contractAddress = getVisitNFTAddress(chainId);
  const { refetch } = useVisitNFT();

  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const mintVisitNFT = async () => {
    await writeContract({
      address: contractAddress,
      abi: VISIT_NFT_ABI,
      functionName: 'mintVisitNFT',
      chainId: chainId || base.id,
    });
  };

  // Auto-refetch on success
  if (isSuccess && hash) {
    refetch();
  }

  return {
    mintVisitNFT,
    isPending,
    isConfirming,
    isSuccess,
    error,
    txHash: hash,
  };
}

/**
 * Mint Visit NFT with biometric signature (EIP-7951)
 */
export function useMintVisitNFTWithBiometric() {
  const { chainId, address } = useAccount();
  const contractAddress = getVisitNFTAddress(chainId);
  const { refetch } = useVisitNFT();
  const { isEnabled } = useBiometricAuth();

  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const mintVisitNFTWithBiometric = async () => {
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
        functionName: 'mintVisitNFT',
      });

      // Call contract with biometric signature
      await writeContract({
        address: contractAddress,
        abi: VISIT_NFT_ABI,
        functionName: 'mintVisitNFTWithBiometric',
        args: [signature.r, signature.s, signature.publicKeyX, signature.publicKeyY],
        chainId: chainId || base.id,
      });
    } catch (err) {
      console.error('Biometric mint Visit NFT error:', err);
      throw err;
    }
  };

  // Auto-refetch on success
  if (isSuccess && hash) {
    refetch();
  }

  return {
    mintVisitNFTWithBiometric,
    isPending,
    isConfirming,
    isSuccess,
    error,
    txHash: hash,
  };
}

/**
 * Get mint timestamp for a token
 */
export function useMintTimestamp(tokenId: bigint | undefined) {
  const { chainId } = useAccount();
  const contractAddress = getVisitNFTAddress(chainId);

  const { data, isLoading } = useReadContract({
    address: contractAddress,
    abi: VISIT_NFT_ABI,
    functionName: 'getMintTimestamp',
    args: tokenId !== undefined ? [tokenId] : undefined,
    chainId: chainId || base.id,
    query: {
      enabled: tokenId !== undefined,
    },
  });

  return {
    timestamp: data as bigint | undefined,
    isLoading,
  };
}

/**
 * Get user's Visit NFT token ID (if they have one)
 */
export function useUserVisitNFTTokenId() {
  const { address, chainId } = useAccount();
  const contractAddress = getVisitNFTAddress(chainId);
  const { balance } = useVisitNFT();

  const { data, isLoading } = useReadContract({
    address: contractAddress,
    abi: VISIT_NFT_ABI,
    functionName: 'tokenOfOwnerByIndex',
    args: address && balance > 0 ? [address, 0n] : undefined,
    chainId: chainId || base.id,
    query: {
      enabled: !!address && balance > 0,
    },
  });

  return {
    tokenId: data as bigint | undefined,
    isLoading,
  };
}

/**
 * Get token URI for Visit NFT
 */
export function useVisitNFTTokenURI(tokenId: bigint | undefined) {
  const { chainId } = useAccount();
  const contractAddress = getVisitNFTAddress(chainId);

  const { data, isLoading } = useReadContract({
    address: contractAddress,
    abi: VISIT_NFT_ABI,
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
 * Check supply urgency (for UI warnings)
 */
export function useSupplyUrgency() {
  const { remainingSupply, maxSupply } = useVisitNFT();

  const percentageRemaining = (remainingSupply / maxSupply) * 100;

  let urgency: 'none' | 'low' | 'medium' | 'high' | 'critical' = 'none';
  if (remainingSupply === 0) {
    urgency = 'none'; // Sold out
  } else if (percentageRemaining <= 5) {
    urgency = 'critical'; // < 5% left
  } else if (percentageRemaining <= 10) {
    urgency = 'high'; // < 10% left
  } else if (percentageRemaining <= 25) {
    urgency = 'medium'; // < 25% left
  } else {
    urgency = 'low';
  }

  return {
    urgency,
    percentageRemaining,
    remainingSupply,
    isSoldOut: remainingSupply === 0,
  };
}
