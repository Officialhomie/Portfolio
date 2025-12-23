'use client';

/**
 * Smart Wallet Hooks
 * React hooks for BiometricWallet operations
 */

import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { Address, keccak256, encodePacked } from 'viem';
import { useEffect, useState, useCallback } from 'react';
import { getSmartWalletAddress, type Transaction } from '@/lib/wallet/smart-wallet';
import { getContractAddress } from '@/lib/contracts/addresses';

const BIOMETRIC_WALLET_FACTORY_ABI = [
  {
    type: 'function',
    name: 'isWalletDeployed',
    inputs: [{ name: 'walletAddress', type: 'address' }],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
  },
] as const;

/**
 * Get smart wallet address for current user
 */
export function useSmartWalletAddress() {
  const { chainId } = useAccount();
  const [walletAddress, setWalletAddress] = useState<Address | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function computeAddress() {
      if (!chainId) {
        setIsLoading(false);
        return;
      }

      try {
        // Deprecated: This hook is no longer used - smart wallets are created via CDP system
        if (!cancelled) setIsLoading(false);
        return;
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error('Failed to get wallet address'));
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    computeAddress();

    return () => {
      cancelled = true;
    };
  }, [chainId]);

  return { walletAddress, isLoading, error };
}

/**
 * Check if wallet is deployed
 */
export function useIsWalletDeployed(walletAddress: Address | null) {
  const { chainId } = useAccount();
  
  const { data: deployed, isLoading, refetch } = useReadContract({
    address: walletAddress && chainId ? getContractAddress(chainId, 'BiometricWalletFactory' as any) : undefined,
    abi: BIOMETRIC_WALLET_FACTORY_ABI,
    functionName: 'isWalletDeployed',
    args: walletAddress ? [walletAddress] : undefined,
    query: {
      enabled: !!walletAddress && !!chainId,
    },
  });

  return { isDeployed: deployed ?? false, isLoading, refetch };
}

/**
 * Deploy smart wallet hook
 */
export function useDeployWallet() {
  const { chainId, address } = useAccount();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const deploy = useCallback(async (sponsored: boolean = true) => {
    // Deprecated: Use SmartWalletContext instead
    throw new Error('This hook is deprecated. Use SmartWalletContext for wallet operations.');
  }, []);

  return {
    deploy,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

/**
 * Execute transaction via smart wallet
 */
export function useExecuteFromWallet() {
  const { chainId, address } = useAccount();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const execute = useCallback(async (
    walletAddress: Address,
    tx: Transaction
  ) => {
    // Deprecated: Use SmartWalletContext executor instead
    throw new Error('This hook is deprecated. Use SmartWalletContext executor for transactions.');
  }, []);

  return {
    execute,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

/**
 * Register wallet in portfolio contracts
 */
export function useRegisterWallet() {
  const { chainId, address } = useAccount();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const register = useCallback(async (
    walletAddress: Address,
    contractName: 'PortfolioToken' | 'VisitorBook' | 'ProjectNFT' | 'ProjectVoting' | 'VisitNFT'
  ) => {
    if (!chainId || !address) {
      throw new Error('Wallet not connected');
    }

    const contractAddress = getContractAddress(chainId, contractName);
    if (!contractAddress) {
      throw new Error(`${contractName} not deployed on this chain`);
    }

    writeContract({
      address: contractAddress,
      abi: [
        {
          type: 'function',
          name: 'registerWallet',
          inputs: [
            { name: 'walletAddress', type: 'address' },
            { name: 'userAddress', type: 'address' },
          ],
          outputs: [],
          stateMutability: 'nonpayable',
        },
      ] as const,
      functionName: 'registerWallet',
      args: [walletAddress, address],
    });
  }, [chainId, address, writeContract]);

  return {
    register,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

