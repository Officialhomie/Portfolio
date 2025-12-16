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
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
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

  // Check if biometric is configured on mount
  useEffect(() => {
    async function checkConfiguration() {
      const configured = await isBiometricConfigured();
      setAuthState((prev) => ({
        ...prev,
        isEnabled: configured,
      }));
    }

    checkConfiguration();
  }, []);

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

      const keyPair = await generateSecp256r1Key(userId, userName);
      storeBiometricCredential(keyPair.credentialId);

      setSetupState({
        isSettingUp: false,
        isSetup: true,
        keyPair,
      });

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
    const publicKey = getStoredPublicKey();
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
  }, [contractAddress, writeContract]);

  return {
    registerKey,
    isPending,
    isConfirming,
    isSuccess,
    error,
    txHash: hash,
  };
}

