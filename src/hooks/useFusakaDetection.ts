/**
 * Fusaka Upgrade Detection Hook
 * Detects EIP-7951 precompile availability and provides gas savings info
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAccount, useReadContract, useBlockNumber } from 'wagmi';
import { CONTRACT_ADDRESSES, CHAIN_FEATURES, isFusakaEnabled } from '@/lib/contracts/addresses';
import { base } from 'wagmi/chains';

/**
 * Fusaka detection result
 */
export interface FusakaDetectionResult {
  // Chain info
  chainId: number;
  chainName: string;
  isSupported: boolean;

  // Fusaka status
  isFusakaEnabled: boolean;
  fusakaActivationDate: string | null;

  // EIP-7951 precompile
  hasPrecompile: boolean;
  precompileAddress: string;
  isPrecompileVerified: boolean;

  // Gas info
  verificationMethod: string;
  estimatedGas: bigint;
  gasSavings: bigint;
  gasSavingsPercentage: number;

  // Cost estimates (in USD, assuming gas price)
  estimatedCostUSD: number | null;
  savedCostUSD: number | null;

  // Loading states
  isLoading: boolean;
  isError: boolean;
  error: string | null;
}

/**
 * Hook to detect Fusaka upgrade and EIP-7951 support
 */
export function useFusakaDetection() {
  const { chainId } = useAccount();
  const [result, setResult] = useState<FusakaDetectionResult | null>(null);

  // Get contract addresses for current chain
  const portfolioTokenAddress = useMemo(() => {
    if (!chainId) return CONTRACT_ADDRESSES[base.id].PortfolioToken;
    return CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES]?.PortfolioToken;
  }, [chainId]);

  // Check if EIP-7951 is available on-chain
  const {
    data: isEIP7951Available,
    isLoading: isLoadingPrecompile,
    isError: isPrecompileError,
  } = useReadContract({
    address: portfolioTokenAddress,
    abi: [
      {
        name: 'isEIP7951Available',
        type: 'function',
        stateMutability: 'view',
        inputs: [],
        outputs: [{ type: 'bool' }],
      },
    ],
    functionName: 'isEIP7951Available',
  });

  // Get biometric verification info
  const {
    data: verificationInfo,
    isLoading: isLoadingInfo,
    isError: isInfoError,
  } = useReadContract({
    address: portfolioTokenAddress,
    abi: [
      {
        name: 'getBiometricVerificationInfo',
        type: 'function',
        stateMutability: 'view',
        inputs: [],
        outputs: [
          { name: 'method', type: 'string' },
          { name: 'estimatedGas', type: 'uint256' },
          { name: 'gasSavings', type: 'uint256' },
        ],
      },
    ],
    functionName: 'getBiometricVerificationInfo',
  });

  // Get current block for gas price estimation
  const { data: blockNumber } = useBlockNumber({ watch: true });

  // Compute result
  useEffect(() => {
    if (!chainId) {
      setResult(null);
      return;
    }

    const chainFeatures = CHAIN_FEATURES[chainId as keyof typeof CHAIN_FEATURES];
    const isFusaka = isFusakaEnabled(chainId);

    // Parse verification info
    const method = verificationInfo?.[0] ?? 'unknown';
    const estimatedGas = verificationInfo?.[1] ?? BigInt(100000);
    const gasSavingsPercentage = Number(verificationInfo?.[2] ?? BigInt(0));

    // Calculate savings
    const fallbackGas = BigInt(100000);
    const gasSavings = fallbackGas - estimatedGas;

    // Estimate costs (assuming 2 gwei gas price for Base)
    // Cost = gas * gasPrice * ethPrice
    // At 2 gwei and $3000 ETH:
    // estimatedGas * 2 * 10^-9 * 3000
    const gasPrice = 2; // gwei
    const ethPrice = 3000; // USD
    const estimatedCostUSD =
      (Number(estimatedGas) * gasPrice * ethPrice) / 1e9;
    const savedCostUSD =
      (Number(gasSavings) * gasPrice * ethPrice) / 1e9;

    setResult({
      // Chain info
      chainId,
      chainName: chainFeatures?.name ?? 'Unknown',
      isSupported: !!chainFeatures,

      // Fusaka status
      isFusakaEnabled: isFusaka,
      fusakaActivationDate: chainFeatures?.fusakaActivationDate ?? null,

      // EIP-7951 precompile
      hasPrecompile: isEIP7951Available ?? false,
      precompileAddress: '0x0000000000000000000000000000000000000100',
      isPrecompileVerified: isEIP7951Available ?? false,

      // Gas info
      verificationMethod: method,
      estimatedGas,
      gasSavings,
      gasSavingsPercentage,

      // Cost estimates
      estimatedCostUSD,
      savedCostUSD,

      // Loading states
      isLoading: isLoadingPrecompile || isLoadingInfo,
      isError: isPrecompileError || isInfoError,
      error: isPrecompileError || isInfoError ? 'Failed to detect Fusaka support' : null,
    });
  }, [
    chainId,
    isEIP7951Available,
    verificationInfo,
    isLoadingPrecompile,
    isLoadingInfo,
    isPrecompileError,
    isInfoError,
    blockNumber,
  ]);

  return result;
}

/**
 * Hook to get gas savings for a specific number of transactions
 */
export function useGasSavingsCalculator(transactionCount: number = 1) {
  const fusaka = useFusakaDetection();

  return useMemo(() => {
    if (!fusaka) {
      return {
        totalGasWithPrecompile: BigInt(0),
        totalGasWithoutPrecompile: BigInt(0),
        totalGasSaved: BigInt(0),
        totalCostWithPrecompile: 0,
        totalCostWithoutPrecompile: 0,
        totalCostSaved: 0,
        savingsPercentage: 0,
      };
    }

    const withPrecompile = fusaka.estimatedGas * BigInt(transactionCount);
    const withoutPrecompile = BigInt(100000) * BigInt(transactionCount);
    const saved = withoutPrecompile - withPrecompile;

    const costWithPrecompile = (fusaka.estimatedCostUSD ?? 0) * transactionCount;
    const costWithoutPrecompile = 0.06 * transactionCount; // ~$0.06 per tx without precompile
    const costSaved = costWithoutPrecompile - costWithPrecompile;

    return {
      totalGasWithPrecompile: withPrecompile,
      totalGasWithoutPrecompile: withoutPrecompile,
      totalGasSaved: saved,
      totalCostWithPrecompile: costWithPrecompile,
      totalCostWithoutPrecompile: costWithoutPrecompile,
      totalCostSaved: costSaved,
      savingsPercentage: fusaka.gasSavingsPercentage,
    };
  }, [fusaka, transactionCount]);
}

/**
 * Hook to check if user should be shown Fusaka upgrade info
 */
export function useShouldShowFusakaInfo(): boolean {
  const fusaka = useFusakaDetection();

  // Show if:
  // 1. Chain is supported
  // 2. Fusaka is enabled
  // 3. Precompile is available
  return (
    fusaka?.isSupported === true &&
    fusaka?.isFusakaEnabled === true &&
    fusaka?.hasPrecompile === true
  );
}

/**
 * Hook to get Fusaka status message for UI
 */
export function useFusakaStatusMessage(): string {
  const fusaka = useFusakaDetection();

  if (!fusaka) return 'Connecting...';

  if (!fusaka.isSupported) {
    return 'Chain not supported';
  }

  if (fusaka.isLoading) {
    return 'Detecting Fusaka upgrade...';
  }

  if (fusaka.isError) {
    return 'Unable to detect Fusaka support';
  }

  if (!fusaka.isFusakaEnabled) {
    return 'Fusaka upgrade not available on this chain';
  }

  if (fusaka.hasPrecompile) {
    return `Fusaka enabled - ${fusaka.gasSavingsPercentage}% gas savings active!`;
  }

  return 'Fusaka upgrade pending';
}
