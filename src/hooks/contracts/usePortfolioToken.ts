'use client';

/**
 * Portfolio Token (HOMIE) Contract Hooks
 * Handles all PortfolioToken.sol interactions
 */

import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useReadContracts, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { formatUnits, parseUnits, encodeFunctionData } from 'viem';
import { base } from 'wagmi/chains';
import { PORTFOLIO_TOKEN_ABI } from '@/lib/contracts/abis';
import { CONTRACT_ADDRESSES } from '@/lib/contracts/addresses';
import { usePrivyWallet } from '@/hooks/usePrivyWallet';

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

  // Get active wallet address (smart wallet preferred, EOA as fallback)
  const { activeWallet } = usePrivyWallet();

  // Use the active wallet for ALL operations
  // If user logged in with email → smart wallet address
  // If user connected external wallet → that wallet address
  // Tokens are minted to whoever calls the contract (msg.sender)
  const walletToUse = activeWallet || address;

  // Only fetch balance and canClaimFaucet when wallet address is available
  const { data: userData, isLoading: userLoading, refetch: refetchUser } = useReadContracts({
    contracts: [
      {
        address: contractAddress,
        abi: PORTFOLIO_TOKEN_ABI,
        functionName: 'balanceOf',
        args: walletToUse ? [walletToUse] : undefined, // Active wallet - tokens are here
        chainId: chainId || base.id,
      },
      {
        address: contractAddress,
        abi: PORTFOLIO_TOKEN_ABI,
        functionName: 'canClaimFaucet',
        args: walletToUse ? [walletToUse] : undefined, // Active wallet - check eligibility
        chainId: chainId || base.id,
      },
    ],
    query: {
      enabled: !!walletToUse,
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

    // Wallet info (for debugging)
    walletAddress: walletToUse,
  };
}

/**
 * Claim faucet tokens via CDP smart wallet or EOA wallet
 */
export function useClaimFaucet() {
  const { chainId, address } = useAccount();
  const { refetch } = usePortfolioToken();
  const contractAddress = getTokenAddress(chainId);
  const { sendTransaction, isSendingTransaction, error: privyError, smartWalletAddress, activeWallet } = usePrivyWallet();
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

  // Wait for transaction receipt
  const { isLoading: isWaitingTx, isSuccess: isTxSuccess, data: receipt } = useWaitForTransactionReceipt({
    hash: txHash || undefined,
  });

  const claimFaucet = async () => {
    console.log('🎯 useClaimFaucet.claimFaucet() called');
    console.log('   Active Wallet:', activeWallet);
    console.log('   Smart Wallet:', smartWalletAddress);
    console.log('   Chain ID:', chainId);

    if (!activeWallet || !chainId) {
      throw new Error('Wallet not connected');
    }

    // Build transaction data for claimFaucet()
    // Tokens will be minted directly to msg.sender (the caller)
    const data = encodeFunctionData({
      abi: PORTFOLIO_TOKEN_ABI,
      functionName: 'claimFaucet',
      args: [],
    });

    // If smart wallet is available, use it (preferred method)
    if (smartWalletAddress) {
      console.log('✅ Using smart wallet for claim');
      console.log('   Tokens will be minted to:', smartWalletAddress);

      try {
        setIsConfirming(true);

        // Execute via Privy smart wallet transaction
        const result = await sendTransaction({
          to: contractAddress,
          data,
          value: 0n,
        });

        console.log('✅ Smart wallet transaction complete!');
        console.log('   UserOp Hash:', result.userOpHash);
        console.log('   TX Hash:', result.txHash);

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
    } else {
      // Fallback: Claim directly from EOA wallet using wagmi
      console.log('⚠️ Smart wallet not available, using EOA wallet directly');
      console.log('   This will mint tokens directly to your EOA address');
      
      try {
        setIsConfirming(true);
        
        console.log('📦 Calling claimFaucet directly from EOA...');
        console.log('   Contract:', contractAddress);
        console.log('   EOA Address:', address);
        
        // Use wagmi's writeContract to call claimFaucet directly
        writeContract({
          address: contractAddress,
          abi: PORTFOLIO_TOKEN_ABI,
          functionName: 'claimFaucet',
          args: [],
        });

        console.log('✅ Transaction submitted!');
        // The hash will be available in writeTxHash from the hook
        
        // Wait for transaction receipt
        // Note: We'll handle success in useEffect watching receipt
        
      } catch (err) {
        console.error('Faucet claim failed:', err);
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
      
      // Refetch balance after a short delay
      setTimeout(() => {
        refetch();
      }, 2000);
    }
  }, [isTxSuccess, receipt, isSuccess, refetch]);

  return {
    claimFaucet,
    isPending: isSendingTransaction || isWritePending || isWaitingTx,
    isConfirming,
    isSuccess,
    error: privyError || writeError || null,
    txHash,
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
