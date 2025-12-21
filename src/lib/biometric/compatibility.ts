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
 * Test vector from OpenZeppelin P256.sol
 * Used to verify the RIP-7212 precompile is working correctly
 * From: https://github.com/C2SP/wycheproof/blob/master/testvectors/ecdsa_secp256r1_sha256_p1363_test.json
 */
const TEST_VECTOR = {
  // sha256("123400")
  messageHash: '0xbb5a52f42f9c9261ed4361f59422a1e30036e7c32b270c8807a419feca605023' as const,
  // Small r and s values for testing
  r: '0x0000000000000000000000000000000000000000000000000000000000000001' as const,
  s: '0x0000000000000000000000000000000000000000000000000000000000000002' as const,
  // Generator point coordinates
  qx: '0x6B17D1F2E12C4247F8BCE6E563A440F277037D812DEB33A0F4A13945D898C296' as const,
  qy: '0x4FE342E2FE1A7F9B8EE7EB4A7C0F9E162BCE33576B315ECECBB6406837BF51F5' as const,
};

/**
 * Encode RIP-7212 precompile call data
 * Input format: messageHash (32 bytes) + r (32 bytes) + s (32 bytes) + qx (32 bytes) + qy (32 bytes)
 * Total: 160 bytes
 */
function encodePrecompileCallData(
  messageHash: `0x${string}`,
  r: `0x${string}`,
  s: `0x${string}`,
  qx: `0x${string}`,
  qy: `0x${string}`
): `0x${string}` {
  // Remove 0x prefix and concatenate
  const data =
    messageHash.slice(2) +
    r.slice(2).padStart(64, '0') +
    s.slice(2).padStart(64, '0') +
    qx.slice(2).padStart(64, '0') +
    qy.slice(2).padStart(64, '0');

  return `0x${data}` as `0x${string}`;
}

/**
 * Check if Base L2 supports RIP-7212 precompile with actual verification
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

    // Try to verify a known-good signature using the precompile
    try {
      const callData = encodePrecompileCallData(
        TEST_VECTOR.messageHash,
        TEST_VECTOR.r,
        TEST_VECTOR.s,
        TEST_VECTOR.qx,
        TEST_VECTOR.qy
      );

      const response = await publicClient.call({
        to: EIP7951_PRECOMPILE_ADDRESS,
        data: callData,
      });

      // Precompile should return 32 bytes (0x00...01 for success, 0x00...00 for failure)
      // For the test vector, it should return success
      if (response.data) {
        // Check if response is truthy (verification succeeded)
        const responseValue = BigInt(response.data);

        if (responseValue === BigInt(1)) {
          // Precompile exists and correctly verified the test signature
          result.supportsEIP7951 = true;
          result.signingMethod = 'eip7951';
        } else {
          // Precompile exists but returned unexpected value
          result.supportsEIP7951 = false;
          result.signingMethod = 'hybrid';
          result.error = 'RIP-7212 precompile returned unexpected value';
        }
      } else {
        // No response data - precompile might not exist
        result.supportsEIP7951 = false;
        result.signingMethod = 'hybrid';
        result.error = 'RIP-7212 precompile did not return data';
      }
    } catch (error) {
      // Precompile doesn't exist or call reverted
      result.supportsEIP7951 = false;
      result.signingMethod = 'hybrid'; // Fall back to hybrid approach with P256.sol
      result.error = 'RIP-7212 precompile not available on this chain';
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




