/**
 * React hooks for biometric authentication
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  checkBiometricSupport,
  requestBiometricAuth,
  generateSecp256r1Key,
  isBiometricConfigured,
  getStoredBiometricCredential,
  storeBiometricCredential,
  clearBiometricCredential,
  getStoredPublicKey,
} from '@/lib/biometric/auth';
import { checkBaseSupport } from '@/lib/biometric/compatibility';
import {
  registerKeyOnAllContracts,
  checkRegistrationStatus,
  type RegistrationStatus,
  type BatchRegistrationResult,
} from '@/lib/biometric/registration';
import { useWriteContract, useWaitForTransactionReceipt, useAccount, useConfig } from 'wagmi';
import { CONTRACT_ADDRESSES } from '@/lib/contracts/addresses';
import { base } from 'wagmi/chains';
import type {
  BiometricCapability,
  BiometricAuthResult,
  BiometricAuthState,
  BiometricSetupState,
  Secp256r1KeyPair,
} from '@/lib/biometric/types';

/**
 * Hook to check biometric capabilities
 */
export function useBiometricCapability() {
  const [capability, setCapability] = useState<BiometricCapability | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function checkCapability() {
      try {
        setIsLoading(true);
        const result = await checkBiometricSupport();
        setCapability(result);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to check biometric capability');
        setCapability(null);
      } finally {
        setIsLoading(false);
      }
    }

    checkCapability();
  }, []);

  return {
    capability,
    isLoading,
    error,
    isAvailable: capability?.isAvailable ?? false,
  };
}

/**
 * Hook for biometric authentication
 */
export function useBiometricAuth() {
  const [authState, setAuthState] = useState<BiometricAuthState>({
    isEnabled: false,
    isAuthenticating: false,
  });
  const [lastAuthResult, setLastAuthResult] = useState<BiometricAuthResult | null>(null);

  /**
   * Check and update biometric configuration status
   */
  const checkConfiguration = useCallback(async () => {
    const configured = await isBiometricConfigured();
    setAuthState((prev) => ({
      ...prev,
      isEnabled: configured,
    }));
    return configured;
  }, []);

  // Check if biometric is configured on mount
  useEffect(() => {
    checkConfiguration();
  }, [checkConfiguration]);

  // Also check when localStorage changes (in case credentials are added externally)
  useEffect(() => {
    // Listen for custom biometric setup event (same-tab)
    const handleBiometricSetup = () => {
      console.log('🔔 Biometric setup event received - refreshing state');
      checkConfiguration();
    };

    // Listen for storage changes (cross-tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'biometric_credential_id' || e.key === 'biometric_public_key') {
        console.log('🔄 Biometric storage changed (cross-tab), rechecking configuration...');
        checkConfiguration();
      }
    };

    window.addEventListener('biometric-setup-complete', handleBiometricSetup);
    window.addEventListener('storage', handleStorageChange);

    // Poll to catch same-tab changes
    const interval = setInterval(() => {
      checkConfiguration();
    }, 2000); // Check every 2 seconds (reduced from 500ms to prevent spam)

    return () => {
      window.removeEventListener('biometric-setup-complete', handleBiometricSetup);
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [checkConfiguration]);

  /**
   * Request biometric authentication
   */
  const requestAuth = useCallback(async (message?: string): Promise<boolean> => {
    try {
      setAuthState((prev) => ({ ...prev, isAuthenticating: true }));

      const credentialId = getStoredBiometricCredential();
      if (!credentialId) {
        throw new Error('Biometric authentication not configured');
      }

      const result = await requestBiometricAuth(credentialId, message);
      setLastAuthResult(result);
      setAuthState((prev) => ({
        ...prev,
        isAuthenticating: false,
      }));

      return result.success;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
      setLastAuthResult({
        success: false,
        error: errorMessage,
        timestamp: Date.now(),
      });
      setAuthState((prev) => ({
        ...prev,
        isAuthenticating: false,
      }));
      return false;
    }
  }, []);

  return {
    ...authState,
    requestAuth,
    lastAuthResult,
    refresh: checkConfiguration, // Expose refresh function
  };
}

/**
 * Hook for biometric setup
 */
export function useBiometricSetup() {
  const [setupState, setSetupState] = useState<BiometricSetupState>({
    isSettingUp: false,
    isSetup: false,
  });

  // Check if already set up
  useEffect(() => {
    async function checkSetup() {
      const configured = await isBiometricConfigured();
      setSetupState((prev) => ({
        ...prev,
        isSetup: configured,
      }));
    }

    checkSetup();
  }, []);

  /**
   * Set up biometric authentication
   */
  const setup = useCallback(async (userId: string, userName: string): Promise<boolean> => {
    try {
      setSetupState((prev) => ({
        ...prev,
        isSettingUp: true,
        setupError: undefined,
      }));

      // CRITICAL FIX: Check if biometric is already configured
      // If configured, we should NOT create a new credential as it will generate a different address
      const { getStoredBiometricCredentialSecure, getStoredPublicKeySecure } = await import('@/lib/biometric/storage-adapter');
      const existingCredentialId = await getStoredBiometricCredentialSecure();
      const existingPublicKey = await getStoredPublicKeySecure();

      if (existingCredentialId && existingPublicKey && existingPublicKey.x && existingPublicKey.y) {
        console.log('⚠️  Biometric already configured - reusing existing credential');
        console.log('   Credential ID:', existingCredentialId.substring(0, 20) + '...');
        console.log('   Public Key X:', existingPublicKey.x.substring(0, 20) + '...');
        console.log('   Public Key Y:', existingPublicKey.y.substring(0, 20) + '...');
        console.log('   ℹ️  Not creating a new credential to preserve wallet address');

        // Return the existing key pair without creating a new one
        const existingKeyPair: Secp256r1KeyPair = {
          publicKey: new Uint8Array(0),
          publicKeyX: existingPublicKey.x as `0x${string}`,
          publicKeyY: existingPublicKey.y as `0x${string}`,
          credentialId: existingCredentialId,
          keyHandle: '',
        };

        setSetupState({
          isSettingUp: false,
          isSetup: true,
          keyPair: existingKeyPair,
        });

        // Still fire the event to notify other components
        if (typeof window !== 'undefined') {
          console.log('🎉 Firing biometric-setup-complete event (existing credential)');
          window.dispatchEvent(new CustomEvent('biometric-setup-complete', {
            detail: { credentialId: existingCredentialId, publicKey: existingPublicKey },
          }));
        }

        return true;
      }

      // Only create new credential if none exists
      console.log('🔐 Creating new biometric credential...');
      const keyPair = await generateSecp256r1Key(userId, userName);

      // Store credential ID (this is done in generateSecp256r1Key via storePublicKey)
      // But we also need to explicitly store the credential ID
      storeBiometricCredential(keyPair.credentialId);

      // Verify storage was successful (now using secure async storage)
      const storedCredentialId = await getStoredBiometricCredentialSecure();
      const storedPublicKey = await getStoredPublicKeySecure();

      if (!storedCredentialId || !storedPublicKey) {
        console.error('❌ Failed to store biometric credentials');
        console.error('   Credential ID stored:', !!storedCredentialId);
        console.error('   Public key stored:', !!storedPublicKey);
        throw new Error('Failed to store biometric credentials');
      }

      console.log('✅ Biometric credentials stored successfully');
      console.log('   Credential ID:', storedCredentialId.substring(0, 20) + '...');
      console.log('   Public Key X:', storedPublicKey.x.substring(0, 20) + '...');
      console.log('   Public Key Y:', storedPublicKey.y.substring(0, 20) + '...');

      setSetupState({
        isSettingUp: false,
        isSetup: true,
        keyPair,
      });

      // Trigger a refresh of biometric auth state
      // Fire custom event for same-tab changes (storage event doesn't work same-tab)
      if (typeof window !== 'undefined') {
        console.log('🎉 Firing biometric-setup-complete event');
        window.dispatchEvent(new CustomEvent('biometric-setup-complete', {
          detail: { credentialId: storedCredentialId, publicKey: storedPublicKey },
        }));
      }

      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Setup failed';
      setSetupState({
        isSettingUp: false,
        isSetup: false,
        setupError: errorMessage,
      });
      return false;
    }
  }, []);

  /**
   * Clear biometric setup
   */
  const clearSetup = useCallback(() => {
    clearBiometricCredential();
    setSetupState({
      isSettingUp: false,
      isSetup: false,
    });
  }, []);

  return {
    ...setupState,
    setup,
    clearSetup,
  };
}

/**
 * Hook to check Base L2 compatibility
 */
export function useBaseCompatibility(chainId: number) {
  const [compatibility, setCompatibility] = useState<{
    supportsEIP7951: boolean;
    signingMethod: string;
    isLoading: boolean;
    error?: string;
  }>({
    supportsEIP7951: false,
    signingMethod: 'fallback',
    isLoading: true,
  });

  useEffect(() => {
    // Skip if chainId is invalid
    if (!chainId || chainId === 0) {
      setCompatibility({
        supportsEIP7951: false,
        signingMethod: 'fallback',
        isLoading: false,
      });
      return;
    }

    async function checkCompatibility() {
      try {
        const result = await checkBaseSupport(chainId);
        setCompatibility({
          supportsEIP7951: result.supportsEIP7951,
          signingMethod: result.signingMethod,
          isLoading: false,
          error: result.error,
        });
      } catch (error) {
        setCompatibility({
          supportsEIP7951: false,
          signingMethod: 'fallback',
          isLoading: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    checkCompatibility();
  }, [chainId]);

  return compatibility;
}

/**
 * Hook to register public key on-chain for a contract
 */
export function useRegisterBiometricKey(contractAddress: `0x${string}`) {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const registerKey = useCallback(async () => {
    // Prevent duplicate calls
    if (isPending || isConfirming) {
      throw new Error('Registration already in progress');
    }

    const { getStoredPublicKeySecure } = await import('@/lib/biometric/storage-adapter');
    const publicKey = await getStoredPublicKeySecure();
    if (!publicKey) {
      throw new Error('Public key not found. Please set up biometric authentication first.');
    }

    // Use a generic ABI for registerSecp256r1Key function
    // All contracts have the same signature
    const abi = [
      {
        inputs: [
          { internalType: 'bytes32', name: 'publicKeyX', type: 'bytes32' },
          { internalType: 'bytes32', name: 'publicKeyY', type: 'bytes32' },
        ],
        name: 'registerSecp256r1Key',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
      },
    ] as const;

    await writeContract({
      address: contractAddress,
      abi,
      functionName: 'registerSecp256r1Key',
      args: [publicKey.x as `0x${string}`, publicKey.y as `0x${string}`],
    });
  }, [contractAddress, writeContract, isPending, isConfirming]);

  return {
    registerKey,
    isPending,
    isConfirming,
    isSuccess,
    error,
    txHash: hash,
  };
}

/**
 * Hook to register public key on all biometric-enabled contracts
 */
export function useRegisterAllBiometricKeys() {
  const config = useConfig();
  const { chainId } = useAccount();
  const [isRegistering, setIsRegistering] = useState(false);
  const [registrationStatuses, setRegistrationStatuses] = useState<RegistrationStatus[]>([]);
  const [registrationResult, setRegistrationResult] = useState<BatchRegistrationResult | null>(null);
  const [registrationStatus, setRegistrationStatus] = useState<{
    isFullyRegistered: boolean;
    registeredContracts: string[];
    unregisteredContracts: string[];
  } | null>(null);

  /**
   * Check if public key is already registered on all contracts
   */
  const checkStatus = useCallback(async () => {
    const publicKey = await getStoredPublicKey();
    if (!publicKey || !publicKey.x || !publicKey.y || !chainId) {
      return;
    }

    try {
      const status = await checkRegistrationStatus(config, publicKey, chainId);
      setRegistrationStatus(status);
      return status;
    } catch (error) {
      console.error('Error checking registration status:', error);
      return null;
    }
  }, [config, chainId]);

  /**
   * Register public key on all contracts
   */
  const registerAll = useCallback(async (): Promise<BatchRegistrationResult> => {
    // Prevent duplicate calls
    if (isRegistering) {
      throw new Error('Registration already in progress');
    }

    const { getStoredPublicKeySecure } = await import('@/lib/biometric/storage-adapter');
    const storedKey = await getStoredPublicKeySecure();
    if (!storedKey || !storedKey.x || !storedKey.y) {
      throw new Error('Public key not found. Please set up biometric authentication first.');
    }

    // Convert to PublicKeyCoordinates format
    const publicKey: { x: `0x${string}`; y: `0x${string}` } = {
      x: storedKey.x.startsWith('0x') ? storedKey.x as `0x${string}` : `0x${storedKey.x}` as `0x${string}`,
      y: storedKey.y.startsWith('0x') ? storedKey.y as `0x${string}` : `0x${storedKey.y}` as `0x${string}`,
    };

    if (!chainId) {
      throw new Error('Chain ID not found. Please connect your wallet.');
    }

    setIsRegistering(true);
    setRegistrationStatuses([]);
    setRegistrationResult(null);

    try {
      const result = await registerKeyOnAllContracts(
        config,
        publicKey,
        chainId,
        (status) => {
          // Update statuses as registration progresses
          setRegistrationStatuses((prev) => {
            const existing = prev.find(s => s.address === status.address);
            if (existing) {
              return prev.map(s => s.address === status.address ? status : s);
            }
            return [...prev, status];
          });
        }
      );

      setRegistrationResult(result);

      // Update registration status after completion
      await checkStatus();

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      const failedResult: BatchRegistrationResult = {
        success: false,
        statuses: registrationStatuses,
        totalRegistered: 0,
        totalFailed: registrationStatuses.length,
        errors: [errorMessage],
      };
      setRegistrationResult(failedResult);
      throw error;
    } finally {
      setIsRegistering(false);
    }
  }, [config, chainId, checkStatus, isRegistering]);

  /**
   * Check registration status on mount
   */
  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  return {
    registerAll,
    checkStatus,
    isRegistering,
    registrationStatuses,
    registrationResult,
    registrationStatus,
    isFullyRegistered: registrationStatus?.isFullyRegistered ?? false,
    registeredContracts: registrationStatus?.registeredContracts ?? [],
    unregisteredContracts: registrationStatus?.unregisteredContracts ?? [],
  };
}

