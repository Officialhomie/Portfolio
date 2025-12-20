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
import { getStoredPublicKey, getStoredBiometricCredential } from '@/lib/biometric/auth';

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
        const publicKey = getStoredPublicKey();
        if (!publicKey) {
          if (!cancelled) setIsLoading(false);
          return;
        }

        const address = await getSmartWalletAddress(
          { x: publicKey.x as `0x${string}`, y: publicKey.y as `0x${string}` },
          chainId
        );
        if (!cancelled) {
          setWalletAddress(address);
          setError(null);
        }
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
    if (!chainId || !address) {
      throw new Error('Wallet not connected');
    }

    const publicKey = getStoredPublicKey();
    if (!publicKey) {
      throw new Error('Biometric key not registered');
    }

    const factoryAddress = getContractAddress(chainId, 'BiometricWalletFactory' as any);
    if (!factoryAddress) {
      throw new Error('BiometricWalletFactory not deployed on this chain');
    }

    const functionName = sponsored ? 'createWalletSponsored' : 'createWallet';
    const salt = `0x${'0'.repeat(64)}` as `0x${string}`;

    writeContract({
      address: factoryAddress,
      abi: [
        {
          type: 'function',
          name: functionName,
          inputs: [
            { name: 'publicKeyX', type: 'bytes32' },
            { name: 'publicKeyY', type: 'bytes32' },
            { name: 'salt', type: 'bytes32' },
          ],
          outputs: [{ name: 'walletAddress', type: 'address' }],
          stateMutability: 'nonpayable',
        },
      ] as const,
      functionName,
      args: [publicKey.x as `0x${string}`, publicKey.y as `0x${string}`, salt],
    });
  }, [chainId, address, writeContract]);

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
    if (!chainId || !address) {
      throw new Error('Wallet not connected');
    }

    const publicKey = getStoredPublicKey();
    if (!publicKey) {
      throw new Error('Biometric key not registered');
    }

    const credentialId = getStoredBiometricCredential();
    if (!credentialId) {
      throw new Error('Biometric credential not found');
    }

    // Get nonce for the public key
    const publicKeyHash = keccak256(encodePacked(['bytes32', 'bytes32'], [publicKey.x as `0x${string}`, publicKey.y as `0x${string}`]));
    
    // Read nonce from wallet
    const { getPublicClient } = await import('@wagmi/core');
    const { wagmiConfig } = await import('@/lib/wagmi/config');
    const client = getPublicClient(wagmiConfig, { chainId });
    
    if (!client) {
      throw new Error('Public client not available');
    }
    
    const nonce = await client.readContract({
      address: walletAddress,
      abi: [
        {
          type: 'function',
          name: 'getNonce',
          inputs: [{ name: 'publicKeyHash', type: 'bytes32' }],
          outputs: [{ name: '', type: 'uint256' }],
          stateMutability: 'view',
        },
      ] as const,
      functionName: 'getNonce',
      args: [publicKeyHash],
    });

    // Build message hash for wallet execute function
    const messageHash = keccak256(encodePacked(
      ['string', 'uint256', 'address', 'address', 'uint256', 'bytes32', 'uint256'],
      ['execute', BigInt(chainId), walletAddress, tx.to, tx.value || 0n, keccak256(tx.data), nonce]
    ));

    // Sign with biometric
    const { signWithBiometric } = await import('@/lib/biometric/auth');
    const { parseWebAuthnSignature } = await import('@/lib/biometric/signature-parser');
    
    const messageHashBytes = new Uint8Array(Buffer.from(messageHash.slice(2), 'hex'));
    const derSignature = await signWithBiometric(messageHashBytes, credentialId);
    const { r, s } = parseWebAuthnSignature(derSignature);

    // Execute via wallet
    writeContract({
      address: walletAddress,
      abi: [
        {
          type: 'function',
          name: 'execute',
          inputs: [
            { name: 'to', type: 'address' },
            { name: 'value', type: 'uint256' },
            { name: 'data', type: 'bytes' },
            { name: 'r', type: 'bytes32' },
            { name: 's', type: 'bytes32' },
            { name: 'publicKeyX', type: 'bytes32' },
            { name: 'publicKeyY', type: 'bytes32' },
            { name: 'nonce', type: 'uint256' },
          ],
          outputs: [],
          stateMutability: 'nonpayable',
        },
      ] as const,
      functionName: 'execute',
      args: [
        tx.to,
        tx.value || 0n,
        tx.data,
        r,
        s,
        publicKey.x as `0x${string}`,
        publicKey.y as `0x${string}`,
        nonce,
      ],
    });
  }, [chainId, address, writeContract]);

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

