'use client';

/**
 * Privy Wallet Hook
 * Replacement for useSmartWallet() hook
 * Provides unified interface for wallet operations using Privy
 */

import { usePrivy, useWallets } from '@privy-io/react-auth';
import { useSmartWallets } from '@privy-io/react-auth/smart-wallets';
import { useAccount, useSendTransaction, useWalletClient, usePublicClient } from 'wagmi';
import { type Address, type Hex } from 'viem';
import { useState, useCallback, useMemo, useEffect } from 'react';

export interface Call {
  to: Address;
  data: Hex;
  value?: bigint;
}

export interface TransactionResult {
  hash: `0x${string}`;
  userOpHash?: `0x${string}`;
  txHash: `0x${string}`;
  gasUsed?: bigint;
}

/**
 * Hook to access Privy wallet functionality
 * Provides similar API to useSmartWallet() for easier migration
 */
export function usePrivyWallet() {
  const privy = usePrivy();
  const { wallets } = useWallets();
  const { client: smartWalletClient, getClientForChain } = useSmartWallets();
  const { address: wagmiAddress, chainId } = useAccount();
  const { sendTransactionAsync } = useSendTransaction();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const [isSendingTransaction, setIsSendingTransaction] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isSmartWalletDeployed, setIsSmartWalletDeployed] = useState(false);
  const [isCheckingDeployment, setIsCheckingDeployment] = useState(false);

  // Debug: Log smart wallet client configuration
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (smartWalletClient) {
        console.log('🔧 Smart Wallet Client Configuration:', {
          account: smartWalletClient.account?.address,
          chain: smartWalletClient.chain,
          hasPaymaster: !!smartWalletClient.paymaster,
          // @ts-ignore
          paymasterUrl: smartWalletClient.paymaster?.transport?.url,
          // @ts-ignore
          bundlerUrl: smartWalletClient.transport?.url,
        });
      } else if (privy.authenticated) {
        console.warn('⚠️ No Smart Wallet Client - Check Privy Dashboard Configuration:', {
          authenticated: privy.authenticated,
          hasUser: !!privy.user,
          linkedAccounts: privy.user?.linkedAccounts?.length || 0,
          linkedAccountTypes: privy.user?.linkedAccounts?.map((acc: any) => acc.type) || [],
        });
      }
    }
  }, [smartWalletClient, privy.authenticated, privy.user]);

  // In Privy v3, smart wallets appear in user.linkedAccounts with type 'smart_wallet'
  // We get the smart wallet address from the linkedAccounts, not from wallets array
  const smartWalletAddress = useMemo(() => {
    if (!privy.user) return null;

    // Find smart wallet in linked accounts
    const smartWallet = privy.user.linkedAccounts.find(
      (account: any) => account.type === 'smart_wallet'
    ) as { address?: string } | undefined;

    // Debug logging
    if (typeof window !== 'undefined' && privy.authenticated) {
      console.log('🔍 Privy Smart Wallet Debug:', {
        authenticated: privy.authenticated,
        linkedAccounts: privy.user.linkedAccounts.map((acc: any) => ({
          type: acc.type,
          address: (acc as any).address || 'N/A',
        })),
        smartWalletFound: !!smartWallet,
        smartWalletAddress: smartWallet?.address,
        smartWalletClientReady: !!smartWalletClient,
      });
    }

    return (smartWallet?.address as Address) || null;
  }, [privy.user, privy.authenticated, smartWalletClient]);

  // Get EOA address (embedded wallet or connected wallet)
  const eoaAddress = privy.user?.wallet?.address as Address | undefined || wagmiAddress;

  // Check if smart wallet is actually deployed on-chain
  useEffect(() => {
    const checkDeployment = async () => {
      if (!smartWalletAddress || !publicClient) {
        setIsSmartWalletDeployed(false);
        return;
      }

      setIsCheckingDeployment(true);
      try {
        // Get the bytecode at the smart wallet address
        const code = await publicClient.getBytecode({
          address: smartWalletAddress as `0x${string}`,
        });

        // If code exists and is not '0x', the contract is deployed
        const deployed = !!code && code !== '0x';
        setIsSmartWalletDeployed(deployed);

        if (typeof window !== 'undefined') {
          console.log('🔍 Smart Wallet Deployment Check:', {
            address: smartWalletAddress,
            codeLength: code?.length || 0,
            isDeployed: deployed,
            code: code?.slice(0, 20) + '...' || '0x',
          });
        }
      } catch (error) {
        console.error('Error checking smart wallet deployment:', error);
        setIsSmartWalletDeployed(false);
      } finally {
        setIsCheckingDeployment(false);
      }
    };

    checkDeployment();
  }, [smartWalletAddress, publicClient]);

  // Debug logging for wallet addresses
  useEffect(() => {
    if (typeof window !== 'undefined' && privy.authenticated) {
      console.log('💼 Wallet Status:', {
        isConnected: privy.authenticated,
        isReady: privy.ready,
        eoaAddress,
        smartWalletAddress,
        isSmartWalletReady: !!smartWalletAddress && !!smartWalletClient,
        isSmartWalletDeployed,
        isCheckingDeployment,
        smartWalletClientReady: !!smartWalletClient,
        wagmiAddress,
        privyUserWallet: privy.user?.wallet?.address,
      });
    }
  }, [privy.authenticated, privy.ready, eoaAddress, smartWalletAddress, smartWalletClient, isSmartWalletDeployed, isCheckingDeployment, wagmiAddress, privy.user?.wallet?.address]);

  // Get the active wallet (smart wallet preferred, fallback to EOA)
  const activeWallet = smartWalletAddress || eoaAddress;

  /**
   * Send a transaction using Privy
   * Uses smart wallet if available, otherwise uses EOA
   */
  const sendTransaction = useCallback(async (call: Call): Promise<TransactionResult> => {
    if (!activeWallet) {
      throw new Error('No wallet connected');
    }

    if (!chainId) {
      throw new Error('No chain ID');
    }

    setIsSendingTransaction(true);

    try {
      // Use wagmi's sendTransactionAsync which works with Privy wallets
      // Privy integrates with wagmi, so we can use wagmi hooks directly
      // Smart wallets will automatically be used if available
      if (!walletClient) {
        throw new Error('Wallet client not available');
      }

      // Send transaction via wagmi (works with both smart wallets and EOA)
      // Privy's smart wallets are compatible with wagmi's transaction API
      const txHash = await sendTransactionAsync({
        to: call.to,
        data: call.data,
        value: call.value || BigInt(0),
      });

      setIsSendingTransaction(false);

      return {
        hash: txHash as `0x${string}`,
        txHash: txHash as `0x${string}`,
        userOpHash: smartWalletAddress ? txHash : undefined, // Smart wallet transactions are UserOps
      };
    } catch (err) {
      setIsSendingTransaction(false);
      const error = err instanceof Error ? err : new Error('Transaction failed');
      setError(error);
      throw error;
    }
  }, [walletClient, sendTransactionAsync, smartWalletAddress, chainId]);

  /**
   * Send batch transactions
   * Note: Wagmi doesn't support batch transactions directly, so we send them sequentially
   * Smart wallets may support batch operations, but we use sequential for compatibility
   */
  const sendBatchTransaction = useCallback(async (calls: Call[]): Promise<TransactionResult> => {
    if (!activeWallet) {
      throw new Error('No wallet connected');
    }

    if (!walletClient) {
      throw new Error('Wallet client not available');
    }

    // Send transactions sequentially
    // Smart wallets will handle each transaction appropriately
    setIsSendingTransaction(true);
    try {
      let lastHash: `0x${string}` | undefined;
      for (const call of calls) {
        const txHash = await sendTransactionAsync({
          to: call.to,
          data: call.data,
          value: call.value || BigInt(0),
        });
        lastHash = txHash;
      }
      
      if (!lastHash) {
        throw new Error('Failed to send batch transactions');
      }
      
      setIsSendingTransaction(false);
      return {
        hash: lastHash,
        txHash: lastHash,
        userOpHash: smartWalletAddress ? lastHash : undefined,
      };
    } catch (err) {
      setIsSendingTransaction(false);
      const error = err instanceof Error ? err : new Error('Batch transaction failed');
      setError(error);
      throw error;
    }
  }, [activeWallet, walletClient, sendTransactionAsync, smartWalletAddress]);

  /**
   * Connect wallet (login)
   */
  const connect = useCallback(() => {
    privy.login();
  }, [privy]);

  /**
   * Disconnect wallet (logout)
   */
  const disconnect = useCallback(async () => {
    return privy.logout();
  }, [privy]);

  return {
    // Wallet addresses
    eoaAddress: eoaAddress as Address | null,
    smartWalletAddress: smartWalletAddress || null,
    activeWallet: activeWallet || null,

    // State
    isConnected: privy.authenticated,
    isReady: privy.ready,
    isSmartWalletReady: !!smartWalletAddress && !!smartWalletClient,
    isSmartWalletDeployed, // Now uses actual on-chain check
    isCheckingDeployment,

    // Transaction state
    isSendingTransaction,
    isConfirming: false,
    isSuccess: false,

    // Actions
    sendTransaction,
    sendBatchTransaction,
    connect,
    disconnect,

    // Privy instance (for advanced usage)
    privy,

    // Smart wallet client (for advanced usage)
    smartWalletClient,

    // Error
    error,
  };
}

