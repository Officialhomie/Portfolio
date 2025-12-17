'use client';

/**
 * Portfolio Token (HOMIE) Contract Hooks
 * Handles all PortfolioToken.sol interactions
 */

import { useAccount, useReadContract, useReadContracts, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { formatUnits, parseUnits } from 'viem';
import { base, baseSepolia } from 'wagmi/chains';
import { PORTFOLIO_TOKEN_ABI } from '@/lib/contracts/abis';
import { CONTRACT_ADDRESSES } from '@/lib/contracts/addresses';
import { useBiometricAuth } from '@/hooks/useBiometric';
import { signTransactionHashWithBiometric } from '@/lib/biometric/signer';
import { getStoredBiometricCredential, getStoredPublicKey } from '@/lib/biometric/auth';

/**
 * Get Portfolio Token contract address for current chain
 */
function getTokenAddress(chainId: number | undefined): `0x${string}` {
  if (!chainId) return CONTRACT_ADDRESSES[base.id].PortfolioToken;
  return CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES]?.PortfolioToken || CONTRACT_ADDRESSES[base.id].PortfolioToken;
}

/**
 * Read Portfolio Token data (balance, eligibility, total supply)
 */
export function usePortfolioToken() {
  const { address, chainId } = useAccount();
  const contractAddress = getTokenAddress(chainId);

  // Always fetch totalSupply and FAUCET_AMOUNT (don't need address)
  const { data: publicData, isLoading: publicLoading, refetch: refetchPublic } = useReadContracts({
    contracts: [
      {
        address: contractAddress,
        abi: PORTFOLIO_TOKEN_ABI,
        functionName: 'totalSupply',
        chainId: chainId || base.id,
      },
      {
        address: contractAddress,
        abi: PORTFOLIO_TOKEN_ABI,
        functionName: 'FAUCET_AMOUNT',
        chainId: chainId || base.id,
      },
    ],
    query: {
      staleTime: 30_000, // 30 seconds
    },
  });

  // Only fetch balance and canClaimFaucet when address is available
  const { data: userData, isLoading: userLoading, refetch: refetchUser } = useReadContracts({
    contracts: [
      {
        address: contractAddress,
        abi: PORTFOLIO_TOKEN_ABI,
        functionName: 'balanceOf',
        args: address ? [address] : undefined,
        chainId: chainId || base.id,
      },
      {
        address: contractAddress,
        abi: PORTFOLIO_TOKEN_ABI,
        functionName: 'canClaimFaucet',
        args: address ? [address] : undefined,
        chainId: chainId || base.id,
      },
    ],
    query: {
      enabled: !!address,
      staleTime: 30_000, // 30 seconds
    },
  });

  const data = publicData && userData ? [...publicData, ...userData] : publicData;
  const isLoading = publicLoading || userLoading;
  
  const refetch = async () => {
    await Promise.all([refetchPublic(), refetchUser()]);
  };

  const totalSupplyRaw = (data?.[0]?.result as bigint) || 0n;
  const faucetAmountRaw = (data?.[1]?.result as bigint) || parseUnits('100', 18);
  const balanceRaw = (data?.[2]?.result as bigint) || 0n;
  const canClaimFaucet = (data?.[3]?.result as boolean) ?? false;

  return {
    // Formatted values
    balance: formatUnits(balanceRaw, 18),
    totalSupply: formatUnits(totalSupplyRaw, 18),
    faucetAmount: formatUnits(faucetAmountRaw, 18),

    // Raw values (for calculations)
    balanceRaw,
    totalSupplyRaw,
    faucetAmountRaw,

    // State
    canClaimFaucet,
    isLoading,
    refetch,

    // Contract info
    contractAddress,
  };
}

/**
 * Claim faucet tokens
 */
export function useClaimFaucet() {
  const { chainId, address } = useAccount();
  const { refetch } = usePortfolioToken();
  const contractAddress = getTokenAddress(chainId);
  const { isEnabled } = useBiometricAuth();

  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const claimFaucet = async () => {
    if (!address) {
      throw new Error('Wallet not connected');
    }

    await writeContract({
      address: contractAddress,
      abi: PORTFOLIO_TOKEN_ABI,
      functionName: 'claimFaucet',
      chainId: chainId || base.id,
    });
  };

  // Auto-refetch balance on success
  if (isSuccess && hash) {
    refetch();
  }

  return {
    claimFaucet,
    isPending,
    isConfirming,
    isSuccess,
    error,
    txHash: hash,
  };
}

/**
 * Claim faucet tokens with biometric signature (EIP-7951)
 */
export function useClaimFaucetWithBiometric() {
  const { chainId, address } = useAccount();
  const { refetch } = usePortfolioToken();
  const contractAddress = getTokenAddress(chainId);
  const { isEnabled } = useBiometricAuth();

  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const claimFaucetWithBiometric = async () => {
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

    const publicKey = getStoredPublicKey();
    if (!publicKey) {
      throw new Error('Public key not found');
    }

    try {
      // Sign transaction hash with biometric
      const signature = await signTransactionHashWithBiometric({
        chainId: chainId || base.id,
        contractAddress,
        userAddress: address,
        functionName: 'claimFaucet',
      });

      // Call contract with biometric signature
      await writeContract({
        address: contractAddress,
        abi: PORTFOLIO_TOKEN_ABI,
        functionName: 'claimFaucetWithBiometric',
        args: [signature.r, signature.s, signature.publicKeyX, signature.publicKeyY],
        chainId: chainId || base.id,
      });
    } catch (err) {
      console.error('Biometric faucet claim error:', err);
      throw err;
    }
  };

  // Auto-refetch balance on success
  if (isSuccess && hash) {
    refetch();
  }

  return {
    claimFaucetWithBiometric,
    isPending,
    isConfirming,
    isSuccess,
    error,
    txHash: hash,
  };
}

/**
 * Check if user has enough tokens for voting
 */
export function useHasVotingBalance() {
  const { balanceRaw } = usePortfolioToken();
  const VOTE_COST = parseUnits('10', 18);

  return {
    hasEnough: balanceRaw >= VOTE_COST,
    balance: formatUnits(balanceRaw, 18),
    required: '10',
    shortfall: balanceRaw < VOTE_COST ? formatUnits(VOTE_COST - balanceRaw, 18) : '0',
  };
}

/**
 * Get token symbol and decimals
 */
export function useTokenInfo() {
  const { chainId } = useAccount();
  const contractAddress = getTokenAddress(chainId);

  const { data: symbolData } = useReadContract({
    address: contractAddress,
    abi: PORTFOLIO_TOKEN_ABI,
    functionName: 'symbol',
    chainId: chainId || base.id,
  });

  const { data: decimalsData } = useReadContract({
    address: contractAddress,
    abi: PORTFOLIO_TOKEN_ABI,
    functionName: 'decimals',
    chainId: chainId || base.id,
  });

  return {
    symbol: (symbolData as string) || 'HOMIE',
    decimals: (decimalsData as number) || 18,
  };
}
