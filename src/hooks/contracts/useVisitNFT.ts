'use client';

/**
 * Visit NFT Contract Hooks
 * Handles all VisitNFT.sol interactions
 */

import { useState } from 'react';
import { useAccount, useReadContract, useReadContracts, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { encodeFunctionData } from 'viem';
import { base } from 'wagmi/chains';
import { usePrivyWallet } from '@/hooks/usePrivyWallet';
import { VISIT_NFT_ABI } from '@/lib/contracts/abis';
import { CONTRACT_ADDRESSES } from '@/lib/contracts/addresses';

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
 * Mint Visit NFT via CDP smart wallet
 */
export function useMintVisitNFT() {
  const { chainId, address } = useAccount();
  const contractAddress = getVisitNFTAddress(chainId);
  const { refetch } = useVisitNFT();
  const { sendTransaction, isSendingTransaction, error, smartWalletAddress } = usePrivyWallet();
  const [txHash, setTxHash] = useState<`0x${string}` | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  const mintVisitNFT = async () => {
    if (!address || !chainId) {
      throw new Error('Wallet not connected');
    }

    if (!smartWalletAddress) {
      throw new Error('Smart wallet not ready. Please complete biometric setup first.');
    }

    try {
      setIsConfirming(true);

      const data = encodeFunctionData({
        abi: VISIT_NFT_ABI,
        functionName: 'mintVisitNFT',
        args: [],
      });

      // Execute via sendTransaction

      const result = await sendTransaction({
        to: contractAddress,
        data,
        value: BigInt(0),
      });

      setTxHash(result.txHash);
      setIsSuccess(true);

      // Refetch after transaction
      setTimeout(() => {
        refetch();
      }, 2000);
    } catch (err) {
      console.error('Mint Visit NFT failed:', err);
      throw err;
    } finally {
      setIsConfirming(false);
    }
  };

  return {
    mintVisitNFT,
    isPending: isSendingTransaction,
    isConfirming,
    isSuccess,
    error,
    txHash,
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
