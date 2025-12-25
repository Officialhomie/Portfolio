'use client';

/**
 * Privy Wallet Hook
 * Replacement for useSmartWallet() hook
 * Provides unified interface for wallet operations using Privy
 */

import { usePrivy, useWallets } from '@privy-io/react-auth';
import { useAccount, useSendTransaction, useWalletClient } from 'wagmi';
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
  const { address: wagmiAddress, chainId } = useAccount();
  const { sendTransactionAsync } = useSendTransaction();
  const { data: walletClient } = useWalletClient();
  const [isSendingTransaction, setIsSendingTransaction] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // In Privy v3, smart wallets are embedded wallets created by Privy
  // Embedded wallets have connectorType === 'embedded' and walletClientType === 'privy'
  const smartWallets = useMemo(() => {
    const filtered = wallets.filter(wallet => {
      // Smart wallets are embedded wallets created by Privy
      return wallet.connectorType === 'embedded' && wallet.walletClientType === 'privy';
    });
    
    // Debug logging
    if (typeof window !== 'undefined' && wallets.length > 0) {
      console.log('🔍 Privy Wallet Debug:', {
        totalWallets: wallets.length,
        smartWallets: filtered.length,
        allWallets: wallets.map(w => ({
          address: w.address,
          connectorType: w.connectorType,
          walletClientType: w.walletClientType,
        })),
      });
    }
    
    return filtered;
  }, [wallets]);

  // Get EOA address (embedded wallet or connected wallet)
  const eoaAddress = privy.user?.wallet?.address as Address | undefined || wagmiAddress;

  // Get smart wallet address (first smart wallet if available)
  const smartWalletAddress = smartWallets[0]?.address as Address | undefined;

  // Debug logging for wallet addresses
  useEffect(() => {
    if (typeof window !== 'undefined' && privy.authenticated) {
      console.log('💼 Wallet Status:', {
        isConnected: privy.authenticated,
        isReady: privy.ready,
        eoaAddress,
        smartWalletAddress,
        isSmartWalletReady: !!smartWalletAddress,
        isSmartWalletDeployed: !!smartWallets[0]?.address,
        wagmiAddress,
        privyUserWallet: privy.user?.wallet?.address,
      });
    }
  }, [privy.authenticated, privy.ready, eoaAddress, smartWalletAddress, smartWallets, wagmiAddress, privy.user?.wallet?.address]);

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
  const disconnect = useCallback(() => {
    privy.logout();
  }, [privy]);

  return {
    // Wallet addresses
    eoaAddress: eoaAddress as Address | null,
    smartWalletAddress: smartWalletAddress || null,
    activeWallet: activeWallet || null,

    // State
    isConnected: privy.authenticated,
    isReady: privy.ready,
    isSmartWalletReady: !!smartWalletAddress,
    isSmartWalletDeployed: !!smartWallets[0]?.address,

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

    // Error
    error,
  };
}

