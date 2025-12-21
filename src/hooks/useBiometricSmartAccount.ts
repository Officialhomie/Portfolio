/**
 * React Hook for Biometric Smart Account
 * Manages CDP Smart Account + secp256r1 biometric signing
 */

import { useState, useEffect, useCallback } from 'react';
import { type Address, type Hex } from 'viem';
import { useAccount } from 'wagmi';
import {
  CDPSmartAccount,
  createCDPSmartAccount,
  isCDPSmartAccountAvailable,
} from '@/lib/cdp/smart-account';
import { useBiometricAuth } from './useBiometric';

export interface UseBiometricSmartAccountReturn {
  // Smart account state
  smartAccount: CDPSmartAccount | null;
  smartAccountAddress: Address | null;
  isSmartAccountReady: boolean;
  isSmartAccountDeployed: boolean;
  balance: bigint | null;

  // Actions
  initialize: () => Promise<void>;
  sendTransaction: (tx: { to: Address; value?: bigint; data?: Hex }) => Promise<Hex>;
  sendBatchTransaction: (txs: Array<{ to: Address; value?: bigint; data?: Hex }>) => Promise<Hex>;

  // Loading states
  isInitializing: boolean;
  isSending: boolean;

  // Errors
  error: Error | null;
}

export function useBiometricSmartAccount(): UseBiometricSmartAccountReturn {
  const { chainId } = useAccount();
  const { isEnabled: isBiometricEnabled } = useBiometricAuth();
  const isRegistered = isBiometricEnabled;

  const [smartAccount, setSmartAccount] = useState<CDPSmartAccount | null>(null);
  const [smartAccountAddress, setSmartAccountAddress] = useState<Address | null>(null);
  const [isSmartAccountDeployed, setIsSmartAccountDeployed] = useState(false);
  const [balance, setBalance] = useState<bigint | null>(null);

  const [isInitializing, setIsInitializing] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Initialize smart account
   */
  const initialize = useCallback(async () => {
    if (!isBiometricEnabled || !isRegistered) {
      setError(new Error('Biometric authentication not enabled or registered'));
      return;
    }

    if (!chainId) {
      setError(new Error('Chain not connected'));
      return;
    }

    try {
      setIsInitializing(true);
      setError(null);

      console.log('Initializing CDP Smart Account...');

      const account = await createCDPSmartAccount(chainId, true);
      const address = await account.getAddress();
      const deployed = await account.isDeployed();
      const bal = await account.getBalance();

      setSmartAccount(account);
      setSmartAccountAddress(address);
      setIsSmartAccountDeployed(deployed);
      setBalance(bal);

      console.log('✅ Smart Account Ready:', address);
      console.log('Deployed:', deployed);
      console.log('Balance:', bal.toString());

    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to initialize smart account');
      setError(error);
      console.error('Smart account initialization failed:', error);
    } finally {
      setIsInitializing(false);
    }
  }, [chainId, isBiometricEnabled, isRegistered]);

  /**
   * Send a single transaction
   */
  const sendTransaction = useCallback(
    async (tx: { to: Address; value?: bigint; data?: Hex }): Promise<Hex> => {
      if (!smartAccount) {
        throw new Error('Smart account not initialized');
      }

      try {
        setIsSending(true);
        setError(null);

        const txHash = await smartAccount.sendTransaction(tx);

        // Refresh balance after transaction
        const newBalance = await smartAccount.getBalance();
        setBalance(newBalance);

        return txHash;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Transaction failed');
        setError(error);
        throw error;
      } finally {
        setIsSending(false);
      }
    },
    [smartAccount]
  );

  /**
   * Send batch transactions
   */
  const sendBatchTransaction = useCallback(
    async (txs: Array<{ to: Address; value?: bigint; data?: Hex }>): Promise<Hex> => {
      if (!smartAccount) {
        throw new Error('Smart account not initialized');
      }

      try {
        setIsSending(true);
        setError(null);

        const txHash = await smartAccount.sendBatchTransaction(txs);

        // Refresh balance
        const newBalance = await smartAccount.getBalance();
        setBalance(newBalance);

        return txHash;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Batch transaction failed');
        setError(error);
        throw error;
      } finally {
        setIsSending(false);
      }
    },
    [smartAccount]
  );

  /**
   * Auto-initialize when biometric is ready
   */
  useEffect(() => {
    if (isBiometricEnabled && isRegistered && chainId && !smartAccount && !isInitializing) {
      initialize();
    }
  }, [isBiometricEnabled, isRegistered, chainId, smartAccount, isInitializing, initialize]);

  return {
    // State
    smartAccount,
    smartAccountAddress,
    isSmartAccountReady: Boolean(smartAccount && smartAccountAddress),
    isSmartAccountDeployed,
    balance,

    // Actions
    initialize,
    sendTransaction,
    sendBatchTransaction,

    // Loading
    isInitializing,
    isSending,

    // Errors
    error,
  };
}

/**
 * Hook to check if smart account is available
 */
export function useIsBiometricSmartAccountAvailable() {
  const { isEnabled } = useBiometricAuth();
  const isRegistered = isEnabled;
  const [isAvailable, setIsAvailable] = useState(false);

  useEffect(() => {
    async function checkAvailability() {
      if (isEnabled && isRegistered) {
        const available = await isCDPSmartAccountAvailable();
        setIsAvailable(available);
      } else {
        setIsAvailable(false);
      }
    }
    checkAvailability();
  }, [isEnabled, isRegistered]);

  return isEnabled && isRegistered && isAvailable;
}
