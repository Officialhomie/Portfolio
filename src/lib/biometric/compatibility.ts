/**
 * Base L2 Compatibility Check for EIP-7951
 * Verifies if Base L2 supports secp256r1 precompile
 */

import { createPublicClient, http, type Address } from 'viem';
import { base, baseSepolia } from 'wagmi/chains';

/**
 * EIP-7951 precompile address
 */
export const EIP7951_PRECOMPILE_ADDRESS = '0x0000000000000000000000000000000000000100' as const;

/**
 * Signing method based on chain support
 */
export type SigningMethod = 'eip7951' | 'account-abstraction' | 'hybrid' | 'fallback';

/**
 * Chain compatibility result
 */
export interface ChainCompatibility {
  /** Chain ID */
  chainId: number;
  /** Whether EIP-7951 is supported */
  supportsEIP7951: boolean;
  /** Recommended signing method */
  signingMethod: SigningMethod;
  /** Error message if check failed */
  error?: string;
}

/**
 * Check if Base L2 supports EIP-7951 precompile
 */
export async function checkBaseSupport(chainId: number): Promise<ChainCompatibility> {
  const chain = chainId === base.id ? base : baseSepolia;
  
  const result: ChainCompatibility = {
    chainId,
    supportsEIP7951: false,
    signingMethod: 'fallback',
  };

  try {
    // Create public client for the chain
    const publicClient = createPublicClient({
      chain,
      transport: http(),
    });

    // Try to call the precompile (it should exist if EIP-7951 is supported)
    // The precompile at 0x100 should be callable
    try {
      // Attempt to read from the precompile address
      // If it exists, the call won't revert
      await publicClient.call({
        to: EIP7951_PRECOMPILE_ADDRESS,
        data: '0x' as `0x${string}`, // Empty call to check if address exists
      });

      // If we get here, the precompile exists
      result.supportsEIP7951 = true;
      result.signingMethod = 'eip7951';
    } catch (error) {
      // Precompile doesn't exist or not supported
      result.supportsEIP7951 = false;
      result.signingMethod = 'hybrid'; // Fall back to hybrid approach
      result.error = 'EIP-7951 precompile not available on this chain';
    }
  } catch (error) {
    console.error('Error checking Base support:', error);
    result.error = error instanceof Error ? error.message : 'Unknown error';
    result.signingMethod = 'fallback';
  }

  return result;
}

/**
 * Get appropriate signing method for current chain
 */
export async function getSigningMethod(chainId: number): Promise<SigningMethod> {
  const compatibility = await checkBaseSupport(chainId);
  return compatibility.signingMethod;
}

/**
 * Create compatible signer based on chain support
 */
export async function createCompatibleSigner(chainId: number) {
  const compatibility = await checkBaseSupport(chainId);

  switch (compatibility.signingMethod) {
    case 'eip7951':
      // Use direct EIP-7951 precompile
      return {
        method: 'eip7951' as const,
        precompileAddress: EIP7951_PRECOMPILE_ADDRESS,
        verifyOnChain: true,
      };

    case 'account-abstraction':
      // Use Account Abstraction (ERC-4337) with secp256r1 verification
      return {
        method: 'account-abstraction' as const,
        verifyOnChain: true,
        requiresAccountDeployment: true,
      };

    case 'hybrid':
      // Use biometric for auth, then standard ECDSA signing
      return {
        method: 'hybrid' as const,
        verifyOnChain: false,
        biometricAuth: true,
        standardSigning: true,
      };

    case 'fallback':
    default:
      // Fallback to standard signing with biometric auth layer
      return {
        method: 'fallback' as const,
        verifyOnChain: false,
        biometricAuth: true,
        standardSigning: true,
      };
  }
}

/**
 * Check if we should use on-chain verification
 */
export async function shouldVerifyOnChain(chainId: number): Promise<boolean> {
  const compatibility = await checkBaseSupport(chainId);
  return compatibility.supportsEIP7951 || compatibility.signingMethod === 'account-abstraction';
}

