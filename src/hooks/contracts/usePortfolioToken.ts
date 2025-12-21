'use client';

/**
 * Portfolio Token (HOMIE) Contract Hooks
 * Handles all PortfolioToken.sol interactions
 */

import { useState } from 'react';
import { useAccount, useReadContract, useReadContracts, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { formatUnits, parseUnits, encodeFunctionData } from 'viem';
import { base, baseSepolia } from 'wagmi/chains';
import { PORTFOLIO_TOKEN_ABI } from '@/lib/contracts/abis';
import { CONTRACT_ADDRESSES } from '@/lib/contracts/addresses';
import { useBiometricAuth } from '@/hooks/useBiometric';
import { signTransactionHashWithBiometric } from '@/lib/biometric/signer';
import { getStoredBiometricCredential, getStoredPublicKey } from '@/lib/biometric/auth';
import { useSmartWallet } from '@/contexts/SmartWalletContext';

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
      refetchInterval: 60_000, // Refetch every minute to update countdown
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
  
  // canClaimFaucet returns (bool canClaim, uint256 timeUntilClaim)
  const canClaimResult = data?.[3]?.result as [boolean, bigint] | undefined;
  const canClaimFaucet = canClaimResult?.[0] ?? false;
  const timeUntilClaimRaw = canClaimResult?.[1] ?? 0n;
  const timeUntilClaim = Number(timeUntilClaimRaw);

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
    timeUntilClaim, // Seconds until next claim available
    isLoading,
    refetch,

    // Contract info
    contractAddress,
  };
}

/**
 * Claim faucet tokens via CDP smart wallet
 */
export function useClaimFaucet() {
  const { chainId, address } = useAccount();
  const { refetch } = usePortfolioToken();
  const contractAddress = getTokenAddress(chainId);
  const { executor, isSendingTransaction, error, smartWalletAddress } = useSmartWallet();
  const [txHash, setTxHash] = useState<`0x${string}` | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  const claimFaucet = async () => {
    console.log('🎯 useClaimFaucet.claimFaucet() called');
    console.log('   address:', address);
    console.log('   chainId:', chainId);
    console.log('   smartWalletAddress:', smartWalletAddress);
    
    if (!address || !chainId) {
      throw new Error('Wallet not connected');
    }

    if (!smartWalletAddress) {
      console.error('❌ Smart wallet not ready!');
      throw new Error('Smart wallet not ready. Please complete biometric setup first.');
    }

    try {
      console.log('✅ Pre-flight checks passed, starting transaction...');
      setIsConfirming(true);
      
      // Build transaction data - smart wallet calls claimFaucet() directly
      // Contract will use walletToUser[msg.sender] to get the user
      const data = encodeFunctionData({
        abi: PORTFOLIO_TOKEN_ABI,
        functionName: 'claimFaucet',
        args: [],
      });

      console.log('📦 Transaction data encoded, calling sendTransaction...');
      console.log('   Contract:', contractAddress);
      console.log('   Data length:', data.length);

      // Execute via executor (handles UserOp flow: Build → Sign → Submit)
      if (!executor) {
        throw new Error('Smart wallet executor not ready');
      }

      const result = await executor.execute({
        to: contractAddress,
        data,
        value: 0n,
      });

      console.log('✅ Transaction complete!');
      console.log('   UserOp Hash:', result.userOpHash);
      console.log('   TX Hash:', result.txHash);
      console.log('   Gas Used:', result.gasUsed.toString());

      setTxHash(result.txHash);
      setIsSuccess(true);
      
      // Refetch balance after a short delay to allow transaction to be mined
      setTimeout(() => {
        refetch();
      }, 2000);
    } catch (err) {
      console.error('Faucet claim failed:', err);
      throw err;
    } finally {
      setIsConfirming(false);
    }
  };

  return {
    claimFaucet,
    isPending: isSendingTransaction,
    isConfirming,
    isSuccess,
    error,
    txHash,
  };
}

/**
 * Claim faucet tokens with biometric signature (EIP-7951)
 * @deprecated Use useClaimFaucet instead - all transactions now use smart wallets
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

    const publicKey = await getStoredPublicKey();
    if (!publicKey || !publicKey.x || !publicKey.y) {
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
