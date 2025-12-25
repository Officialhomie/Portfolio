'use client';

/**
 * Portfolio Token (HOMIE) Contract Hooks
 * Handles all PortfolioToken.sol interactions
 */

import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useReadContracts, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { formatUnits, parseUnits, encodeFunctionData, type Address } from 'viem';
import { base, baseSepolia } from 'wagmi/chains';
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

  // Get smart wallet address for registration check
  const { smartWalletAddress, eoaAddress: privyEOA } = usePrivyWallet();
  
  // Only fetch balance and canClaimFaucet when address is available
  // CRITICAL: Always use EOA address for balance and canClaimFaucet checks
  // Tokens are minted to EOA address (via walletToUser mapping if wallet is registered)
  const { data: userData, isLoading: userLoading, refetch: refetchUser } = useReadContracts({
    contracts: [
      {
        address: contractAddress,
        abi: PORTFOLIO_TOKEN_ABI,
        functionName: 'balanceOf',
        args: address ? [address] : undefined, // EOA address - tokens are minted here
        chainId: chainId || base.id,
      },
      {
        address: contractAddress,
        abi: PORTFOLIO_TOKEN_ABI,
        functionName: 'canClaimFaucet',
        args: address ? [address] : undefined, // EOA address - checks claim eligibility for EOA
        chainId: chainId || base.id,
      },
      // Check if smart wallet is registered (if smart wallet exists)
      // walletToUser is a public mapping, so we can read it directly
      ...(smartWalletAddress && address ? [{
        address: contractAddress,
        abi: PORTFOLIO_TOKEN_ABI,
        functionName: 'walletToUser',
        args: [smartWalletAddress],
        chainId: chainId || base.id,
      }] : []),
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
  
  // Check if smart wallet is registered (walletToUser mapping)
  // If registered, walletToUser[smartWalletAddress] should equal EOA address
  const registeredUserAddress = data?.[4]?.result as Address | undefined;
  const isWalletRegistered = smartWalletAddress && address 
    ? registeredUserAddress?.toLowerCase() === address.toLowerCase()
    : true; // If no smart wallet, consider it "registered" (direct EOA calls)
  
  // Log registration status for debugging
  if (smartWalletAddress && address && registeredUserAddress) {
    console.log('🔍 Wallet registration check:');
    console.log('   Smart Wallet:', smartWalletAddress);
    console.log('   EOA Address:', address);
    console.log('   Registered User:', registeredUserAddress);
    console.log('   Is Registered:', isWalletRegistered);
    if (!isWalletRegistered && registeredUserAddress !== '0x0000000000000000000000000000000000000000') {
      console.warn('⚠️ Wallet registered to different EOA! Expected:', address, 'Got:', registeredUserAddress);
    }
  }

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

    // Wallet registration status
    isWalletRegistered, // Whether smart wallet is registered with PortfolioToken
    needsWalletRegistration: smartWalletAddress && !isWalletRegistered, // True if wallet needs registration

    // Contract info
    contractAddress,
  };
}

/**
 * Claim faucet tokens via CDP smart wallet or EOA wallet
 */
export function useClaimFaucet() {
  const { chainId, address } = useAccount();
  const { refetch, isWalletRegistered, needsWalletRegistration } = usePortfolioToken();
  const contractAddress = getTokenAddress(chainId);
  const { sendTransaction, isSendingTransaction, error: privyError, smartWalletAddress, eoaAddress: privyEOA } = usePrivyWallet();
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

  const claimFaucet = async () => {
    console.log('🎯 useClaimFaucet.claimFaucet() called');
    console.log('   EOA address:', address);
    console.log('   chainId:', chainId);
    console.log('   smartWalletAddress:', smartWalletAddress);
    console.log('   Wallet registered:', isWalletRegistered);
    console.log('   Needs registration:', needsWalletRegistration);
    
    if (!address || !chainId) {
      throw new Error('Wallet not connected');
    }

    // If smart wallet is available, use it (preferred method)
    if (smartWalletAddress) {
      console.log('✅ Using smart wallet for claim');

      // CRITICAL: Check if wallet is registered before claiming
      // If not registered, tokens will be minted to smart wallet address instead of EOA
      // This causes balance mismatch: balance is read from EOA, but tokens are in smart wallet
      if (needsWalletRegistration) {
        console.warn('⚠️ Smart wallet not registered with PortfolioToken!');
        console.warn('   Registering wallet before claiming...');
        console.warn('   This ensures tokens are minted to your EOA address, not the smart wallet');
        
        // Register wallet first via Privy transaction
        const registerData = encodeFunctionData({
          abi: PORTFOLIO_TOKEN_ABI,
          functionName: 'registerWallet',
          args: [smartWalletAddress, address],
        });
        
        console.log('📝 Registering wallet with PortfolioToken...');
        console.log('   Smart Wallet:', smartWalletAddress);
        console.log('   EOA Address:', address);
        
        try {
          await sendTransaction({
            to: contractAddress,
            data: registerData,
            value: 0n,
          });
          
          console.log('✅ Wallet registered successfully');
          // Wait a bit for the registration to be mined and indexed
          await new Promise(resolve => setTimeout(resolve, 3000));
          
          // Refetch to update registration status
          await refetch();
        } catch (regError) {
          console.error('❌ Wallet registration failed:', regError);
          throw new Error(`Failed to register wallet: ${regError instanceof Error ? regError.message : 'Unknown error'}. Please try again.`);
        }
      }

      try {
        console.log('✅ Pre-flight checks passed, starting transaction...');
        setIsConfirming(true);
        
        // Build transaction data - smart wallet calls claimFaucet() directly
        // Contract will use walletToUser[msg.sender] to get the user (EOA address)
        // Tokens will be minted to EOA address if wallet is registered
        const data = encodeFunctionData({
          abi: PORTFOLIO_TOKEN_ABI,
          functionName: 'claimFaucet',
          args: [],
        });
        
        console.log('📋 Claim details:');
        console.log('   Smart Wallet:', smartWalletAddress);
        console.log('   Will mint to EOA:', address);
        console.log('   Wallet registered:', isWalletRegistered);

        console.log('📦 Transaction data encoded, calling sendTransaction...');
        console.log('   Contract:', contractAddress);
        console.log('   Data length:', data.length);

        // Execute via Privy transaction
        const result = await sendTransaction({
          to: contractAddress,
          data,
          value: 0n,
        });

        console.log('✅ Transaction complete!');
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
