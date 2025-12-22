'use client';

/**
 * Smart Wallet Context - Composable ERC-4337 Architecture
 * Uses the new modular executor pattern with CDP Paymaster integration
 *
 * Architecture:
 * - WebAuthn biometric authentication
 * - ERC-4337 UserOperations (not direct transactions)
 * - CDP Bundler + Paymaster for gas sponsorship
 * - Fusaka EIP-7951 R1 precompile for 93% gas savings
 */

import { createContext, useContext, useEffect, useState, useCallback, useRef, type ReactNode } from 'react';
import { type Address, type Hex } from 'viem';
import { useAccount } from 'wagmi';
import { useBiometricAuth } from '@/hooks/useBiometric';

// Import new composable architecture
import { createSmartWallet, type Call, type TransactionResult } from '@/lib/cdp';
import type { ISmartAccount, ITransactionExecutor, ISigner } from '@/lib/cdp';

interface SmartWalletContextValue {
  // Smart Wallet State
  account: ISmartAccount | null;
  executor: ITransactionExecutor | null;
  signer: ISigner | null;
  smartWalletAddress: Address | null;
  isSmartWalletReady: boolean;
  isSmartWalletDeployed: boolean;

  // EOA (hidden from user, used internally)
  eoaAddress: Address | null;

  // Balance & Info
  balance: bigint | null;
  estimatedGasSavings: number; // percentage

  // Actions (NEW: Returns TransactionResult instead of just hash)
  sendTransaction: (tx: Call) => Promise<TransactionResult>;
  sendBatchTransaction: (txs: Call[]) => Promise<TransactionResult>;
  refreshBalance: () => Promise<void>;

  // Loading States
  isCreatingSmartWallet: boolean;
  isSendingTransaction: boolean;

  // Errors
  error: Error | null;
}

const SmartWalletContext = createContext<SmartWalletContextValue | null>(null);

export function SmartWalletProvider({ children }: { children: ReactNode }) {
  const { address: eoaAddress, isConnected, chainId } = useAccount();
  const { isEnabled: isBiometricEnabled } = useBiometricAuth();

  // Smart Wallet State (new composable architecture)
  const [account, setAccount] = useState<ISmartAccount | null>(null);
  const [executor, setExecutor] = useState<ITransactionExecutor | null>(null);
  const [signer, setSigner] = useState<ISigner | null>(null);
  const [smartWalletAddress, setSmartWalletAddress] = useState<Address | null>(null);
  const [isSmartWalletDeployed, setIsSmartWalletDeployed] = useState(false);
  const [balance, setBalance] = useState<bigint | null>(null);

  // Loading & Error States
  const [isCreatingSmartWallet, setIsCreatingSmartWallet] = useState(false);
  const [isSendingTransaction, setIsSendingTransaction] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Prevent race conditions
  const isInitializingRef = useRef(false);
  // Track last EOA address to detect changes
  const lastEOARef = useRef<Address | null>(null);
  // Track last error to prevent infinite retries
  const lastErrorRef = useRef<Error | null>(null);
  const errorCountRef = useRef(0);

  /**
   * Create smart wallet using new composable architecture
   */
  const createSmartWalletInstance = useCallback(async () => {
    console.log('🔍 createSmartWalletInstance called');
    console.log('   chainId:', chainId);
    console.log('   eoaAddress:', eoaAddress);
    console.log('   isBiometricEnabled:', isBiometricEnabled);

    // Guard: Prevent duplicate initialization
    if (isInitializingRef.current) {
      console.log('⏭️ Skipping: Already initializing');
      return;
    }

    // Guard: Check prerequisites
    if (!chainId) {
      console.log('⏭️ Skipping: No chainId');
      return;
    }

    if (!isConnected || !eoaAddress) {
      console.log('⏭️ Skipping: No EOA connected');
      return;
    }

    // CRITICAL FIX: Use EOA signer when EOA is connected
    // This ensures each EOA gets its own unique smart wallet
    // Only use WebAuthn if no EOA is connected (biometric-only mode)
    const useEOASigner = Boolean(eoaAddress);
    const signerType = useEOASigner ? 'eoa' : 'webauthn';

    // Guard: Don't re-create if already exists AND EOA hasn't changed
    if (executor && smartWalletAddress && eoaAddress === lastEOARef.current) {
      // If we already have a wallet for this exact EOA, skip
      console.log('⏭️ Skipping: Wallet already exists for current EOA');
      return;
    }

    try {
      isInitializingRef.current = true;
      setIsCreatingSmartWallet(true);
      setError(null);

      console.log('🔄 Creating smart wallet with new architecture...');
      console.log('   Chain ID:', chainId);
      console.log('   EOA Address:', eoaAddress);
      console.log('   Signer:', signerType, useEOASigner ? '(EOA-based)' : '(WebAuthn)');
      console.log('   Paymaster: Enabled (Pimlico - supports deployment sponsorship)');

      // Create wallet using new composable architecture
      // CRITICAL FIX: Use EOA signer so each EOA gets unique smart wallet
      // Pass EOA address to avoid querying window.ethereum
      // Using Pimlico bundler by default (supports deployment sponsorship for true gasless onboarding)
      const wallet = await createSmartWallet({
        chainId,
        signer: signerType,
        paymaster: true,
        eoaAddress: eoaAddress || undefined, // Pass EOA address when using EOA signer
        bundlerType: 'pimlico', // Use Pimlico for deployment sponsorship (CDP doesn't support it)
      });

      console.log('✅ Wallet created successfully');

      // Extract components
      const { account: acc, executor: exec, signer: sign } = wallet;

      // Get address
      const address = await acc.getAddress();
      console.log('✅ Smart account address:', address);

      // Check deployment
      const deployed = await acc.isDeployed();
      console.log('✅ Deployment status:', deployed);

      // Get balance
      const bal = await acc.getBalance();
      console.log('✅ Balance:', bal.toString());

      // Update state
      setAccount(acc);
      setExecutor(exec);
      setSigner(sign);
      setSmartWalletAddress(address);
      setIsSmartWalletDeployed(deployed);
      setBalance(bal);

      console.log('✅ Smart Wallet Ready!');
      console.log('   EOA Address:', eoaAddress);
      console.log('   Smart Wallet Address:', address);
      console.log('   Deployed:', deployed);
      console.log('   Signer:', sign.type);
      console.log('   Paymaster: Enabled (Pimlico)');
      console.log('   Expected gas cost: $0 (sponsored by Pimlico)');
      console.log('');
      console.log('📋 To use this address for testing:');
      console.log(`   const SENDER = '${address}';`);
      console.log('');

      // Expose globally for easy testing access
      if (typeof window !== 'undefined') {
        (window as any).smartWalletAddress = address;
        console.log('💡 Quick access: window.smartWalletAddress');
      }

    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to create smart wallet');
      setError(error);
      console.error('❌ Smart wallet creation failed:', error);

      // Track error to prevent infinite retries
      lastErrorRef.current = error;
      errorCountRef.current += 1;

      // Clear partial state
      setAccount(null);
      setExecutor(null);
      setSigner(null);
      setSmartWalletAddress(null);
      setIsSmartWalletDeployed(false);
      setBalance(null);
    } finally {
      setIsCreatingSmartWallet(false);
      isInitializingRef.current = false;
    }
  }, [chainId, eoaAddress, isConnected, isBiometricEnabled, executor, smartWalletAddress]);

  /**
   * Refresh balance
   */
  const refreshBalance = useCallback(async () => {
    if (!account) return;

    try {
      const bal = await account.getBalance();
      setBalance(bal);
    } catch (err) {
      console.error('Failed to refresh balance:', err);
    }
  }, [account]);

  /**
   * Send transaction using new executor pattern
   * Returns full TransactionResult with txHash, userOpHash, gasUsed, etc.
   */
  const sendTransaction = useCallback(
    async (tx: Call): Promise<TransactionResult> => {
      console.log('🚀 sendTransaction called (new architecture)');
      console.log('   executor exists:', !!executor);
      console.log('   account exists:', !!account);

      if (!executor) {
        throw new Error('Smart wallet not ready. Please complete biometric setup.');
      }

      if (!account) {
        throw new Error('Smart account not initialized.');
      }

      try {
        setIsSendingTransaction(true);
        setError(null);

        console.log('📤 Executing transaction via SmartAccountExecutor');
        console.log('   To:', tx.to);
        console.log('   Value:', tx.value?.toString() || '0');
        console.log('   Data length:', tx.data?.length || 0);
        console.log('   🎯 Flow: Build UserOp → Sign with biometric → CDP sponsors → Submit');

        // Execute via executor (handles entire UserOp flow)
        // Note: execute() takes a single Call, not an array
        const result = await executor.execute(tx);

        console.log('✅ Transaction complete!');
        console.log('   UserOp Hash:', result.userOpHash);
        console.log('   TX Hash:', result.txHash);
        console.log('   Block:', result.blockNumber.toString());
        console.log('   Gas Used:', result.gasUsed.toString());
        console.log('   Gas Cost: $0 (sponsored by CDP Paymaster)');
        console.log('   View on BaseScan:', `https://basescan.org/tx/${result.txHash}`);

        // Refresh balance after successful transaction
        await refreshBalance();

        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Transaction failed');
        setError(error);
        console.error('❌ Transaction failed:', error);
        throw error;
      } finally {
        setIsSendingTransaction(false);
      }
    },
    [executor, account, refreshBalance]
  );

  /**
   * Send batch transactions
   */
  const sendBatchTransaction = useCallback(
    async (txs: Call[]): Promise<TransactionResult> => {
      if (!executor) {
        throw new Error('Smart wallet not ready');
      }

      if (!txs || txs.length === 0) {
        throw new Error('Batch must contain at least one transaction');
      }

      try {
        setIsSendingTransaction(true);
        setError(null);

        console.log(`📤 Executing batch of ${txs.length} transactions`);
        console.log('   🎯 All transactions in single UserOp (cheaper!)');

        // Execute batch via executor
        const result = await executor.executeBatch(txs);

        console.log('✅ Batch transaction complete!');
        console.log('   TX Hash:', result.txHash);
        console.log('   Gas Used:', result.gasUsed.toString());

        await refreshBalance();

        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Batch transaction failed');
        setError(error);
        throw error;
      } finally {
        setIsSendingTransaction(false);
      }
    },
    [executor, refreshBalance]
  );

  /**
   * Auto-create smart wallet when EOA is connected
   * CRITICAL FIX: Recreate wallet when EOA address changes
   * Also listens for storage events to detect when biometric is enabled
   */
  useEffect(() => {
    let cancelled = false;
    let timeoutId: NodeJS.Timeout | null = null;
    let checkInterval: NodeJS.Timeout | null = null;

    const attemptCreate = async () => {
      // CRITICAL FIX: Check if EOA has changed - if so, clear existing wallet
      const eoaChanged = eoaAddress && lastEOARef.current && eoaAddress !== lastEOARef.current;
      
      if (eoaChanged && executor) {
        // EOA changed - need to recreate wallet
        console.log('🔄 EOA address changed - clearing old wallet');
        console.log('   Old EOA:', lastEOARef.current);
        console.log('   New EOA:', eoaAddress);
        // Clear existing wallet state to force recreation
        setAccount(null);
        setExecutor(null);
        setSigner(null);
        setSmartWalletAddress(null);
        setIsSmartWalletDeployed(false);
        setBalance(null);
        // Reset error tracking when EOA changes
        errorCountRef.current = 0;
        lastErrorRef.current = null;
      }

      // Update last EOA ref
      if (eoaAddress) {
        lastEOARef.current = eoaAddress;
      }

      // For EOA-based wallets, we don't need biometric
      // For WebAuthn-only mode, check biometric configuration
      if (!isConnected || !chainId) {
        // If no EOA, check for biometric-only mode
        if (!eoaAddress) {
      const { isBiometricConfigured } = await import('@/lib/biometric/auth');
      const actuallyConfigured = await isBiometricConfigured();
      
      if (
        !chainId ||
        !isBiometricEnabled ||
            !actuallyConfigured ||
        executor ||
        isCreatingSmartWallet ||
        isInitializingRef.current
      ) {
            return;
          }
        } else {
          return; // No chainId or not connected
        }
      } else if (eoaAddress) {
        // EOA is connected - proceed with EOA-based wallet creation
        // CRITICAL FIX: Prevent infinite retries on persistent errors
        if (
          (executor && !eoaChanged) || // Already have wallet for this EOA
          isCreatingSmartWallet ||
          isInitializingRef.current ||
          (errorCountRef.current > 3 && lastErrorRef.current) // Stop after 3 consecutive errors
        ) {
          if (errorCountRef.current > 3) {
            console.warn('⚠️ Stopping wallet creation attempts after multiple failures');
          }
          return;
        }
      } else {
        // No EOA and not connected - can't create wallet
        return;
      }

      // Debounce rapid state changes
      timeoutId = setTimeout(async () => {
        if (cancelled) return;

        // CRITICAL FIX: For EOA-based wallets, just check EOA connection
        // For biometric-only mode, check biometric configuration
        if (eoaAddress && isConnected && chainId) {
          // EOA is connected - create wallet
          if (
            !executor &&
            !isCreatingSmartWallet &&
            !isInitializingRef.current &&
            errorCountRef.current <= 3 // Stop after 3 consecutive errors
          ) {
            try {
              // Reset error count on new attempt (EOA might have changed)
              if (eoaAddress !== lastEOARef.current) {
                errorCountRef.current = 0;
                lastErrorRef.current = null;
              }
              await createSmartWalletInstance();
              // Reset error tracking on success
              errorCountRef.current = 0;
              lastErrorRef.current = null;
            } catch (error) {
              if (!cancelled) {
                console.error('Smart wallet creation attempt failed:', error);
              }
            }
          }
        } else {
          // Biometric-only mode - check biometric configuration
          const { isBiometricConfigured } = await import('@/lib/biometric/auth');
        const finalCheck = await isBiometricConfigured();
        if (
          chainId &&
          isBiometricEnabled &&
          finalCheck &&
          !executor &&
          !isCreatingSmartWallet &&
            !isInitializingRef.current &&
            errorCountRef.current <= 3 // Stop after 3 consecutive errors
        ) {
          try {
              // Reset error count on new attempt
              errorCountRef.current = 0;
              lastErrorRef.current = null;
            await createSmartWalletInstance();
              // Reset error tracking on success
              errorCountRef.current = 0;
              lastErrorRef.current = null;
          } catch (error) {
            if (!cancelled) {
              console.error('Smart wallet creation attempt failed:', error);
              }
            }
          }
        }
      }, 500); // Increased debounce to 500ms
    };

    attemptCreate();

    // Also check periodically in case EOA changes or credentials are added
    // CRITICAL FIX: Don't retry if we've had too many errors
    checkInterval = setInterval(() => {
      if (
        !cancelled &&
        chainId &&
        (!executor || (eoaAddress && isConnected)) &&
        errorCountRef.current <= 3 // Stop retrying after 3 errors
      ) {
        attemptCreate();
      }
    }, 3000); // Check every 3 seconds (event-driven is faster anyway)

    // Listen for custom biometric setup event (same-tab)
    const handleBiometricSetup = () => {
      console.log('🔔 Biometric setup complete - creating smart wallet...');
      attemptCreate();
    };

    // Listen for storage events (cross-tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'biometric_credential_id' || e.key === 'biometric_public_key') {
        console.log('🔄 Biometric storage changed (cross-tab), re-attempting wallet creation...');
        attemptCreate();
      }
    };

    window.addEventListener('biometric-setup-complete', handleBiometricSetup);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      cancelled = true;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      if (checkInterval) {
        clearInterval(checkInterval);
      }
      window.removeEventListener('biometric-setup-complete', handleBiometricSetup);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [
    isConnected,
    chainId,
    eoaAddress,
    isBiometricEnabled,
    executor,
    isCreatingSmartWallet,
    createSmartWalletInstance,
    smartWalletAddress,
  ]);

  /**
   * Cleanup on disconnect
   */
  useEffect(() => {
    if (!isConnected || !eoaAddress) {
      setAccount(null);
      setExecutor(null);
      setSigner(null);
      setSmartWalletAddress(null);
      setIsSmartWalletDeployed(false);
      setBalance(null);
      setError(null);
      lastEOARef.current = null; // Reset EOA tracking
      errorCountRef.current = 0; // Reset error tracking
      lastErrorRef.current = null;
    }
  }, [isConnected, eoaAddress]);

  const value: SmartWalletContextValue = {
    // Smart Wallet Components
    account,
    executor,
    signer,
    smartWalletAddress,
    isSmartWalletReady: Boolean(executor && smartWalletAddress),
    isSmartWalletDeployed,

    // EOA (hidden)
    eoaAddress: eoaAddress || null,

    // Balance & Info
    balance,
    estimatedGasSavings: 93, // 93% savings with EIP-7951 R1 precompile

    // Actions (new signature)
    sendTransaction,
    sendBatchTransaction,
    refreshBalance,

    // Loading
    isCreatingSmartWallet,
    isSendingTransaction,

    // Errors
    error,
  };

  return (
    <SmartWalletContext.Provider value={value}>
      {children}
    </SmartWalletContext.Provider>
  );
}

/**
 * Hook to access smart wallet context
 */
export function useSmartWallet() {
  const context = useContext(SmartWalletContext);

  if (!context) {
    throw new Error('useSmartWallet must be used within SmartWalletProvider');
  }

  return context;
}

/**
 * Hook to get displayed wallet address (always smart wallet)
 */
export function useDisplayedWalletAddress(): Address | null {
  const { smartWalletAddress } = useSmartWallet();
  return smartWalletAddress;
}

/**
 * Hook to check if wallet is ready
 */
export function useIsWalletReady(): boolean {
  const { isSmartWalletReady } = useSmartWallet();
  return isSmartWalletReady;
}
