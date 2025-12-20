/**
 * Transaction Signing with Biometric Authentication (EIP-7951)
 * Signs transaction hashes with secp256r1 keys stored in secure enclave
 */

import type { WriteContractParameters } from 'wagmi/actions';
import { getStoredBiometricCredential, signWithBiometric, getStoredPublicKey } from './auth';
import { parseWebAuthnSignature, createBiometricTransactionSignature } from './signature-parser';
import { generateMessageHash, MessageHashBuilder } from './message-hash';
import type { BiometricTransactionSignature } from './types';

/**
 * Biometric transaction signing options
 */
export interface BiometricSignOptions {
  /** Chain ID for message hash generation */
  chainId: number;
  /** Contract address */
  contractAddress: `0x${string}`;
  /** User address */
  userAddress: `0x${string}`;
  /** Function name being called */
  functionName: string;
  /** Function-specific parameters for message hash */
  functionParams?: unknown[];
}

/**
 * Sign transaction hash with secp256r1 biometric signature
 * This is the core function that signs transaction data with biometric authentication
 */
export async function signTransactionHashWithBiometric(
  options: BiometricSignOptions
): Promise<BiometricTransactionSignature> {
  const credentialId = getStoredBiometricCredential();
  if (!credentialId) {
    throw new Error('Biometric authentication not configured. Please set up biometric authentication first.');
  }

  const publicKey = getStoredPublicKey();
  if (!publicKey) {
    throw new Error('Public key not found. Please set up biometric authentication first.');
  }

  // Generate deterministic message hash
  // Format: keccak256(functionName, chainId, contractAddress, userAddress, ...functionParams)
  const messageHash = generateMessageHashLegacy(options);

  // Sign with secp256r1 (biometric prompt happens here)
  const derSignature = await signWithBiometric(
    new Uint8Array(Buffer.from(messageHash.slice(2), 'hex')),
    credentialId
  );

  // Parse DER signature to (r, s) format
  const { r, s } = parseWebAuthnSignature(derSignature);

  // Return complete signature with public key
  return createBiometricTransactionSignature(
    r,
    s,
    publicKey.x,
    publicKey.y
  );
}

/**
 * Generate deterministic message hash for contract function
 * DEPRECATED: Use message-hash.ts functions instead
 * Kept for backward compatibility
 */
export function generateMessageHashLegacy(options: BiometricSignOptions): `0x${string}` {
  const { functionName, chainId, contractAddress, userAddress, functionParams = [] } = options;

  // Convert params to typed format for new message hash library
  const typedParams = functionParams.map((param) => {
    if (typeof param === 'string') {
      return { type: 'string' as const, value: param };
    } else if (typeof param === 'bigint' || typeof param === 'number') {
      return { type: 'uint256' as const, value: BigInt(param) };
    } else if (typeof param === 'boolean') {
      return { type: 'bool' as const, value: param };
    } else {
      return { type: 'bytes32' as const, value: param };
    }
  });

  return generateMessageHash(functionName, chainId, contractAddress, userAddress, typedParams);
}

// Re-export hash generation functions from message-hash library
export {
  generateClaimFaucetHash,
  generateVoteHash,
  generateEndorseProjectHash,
  generateMintVisitNFTHash,
  generateSignVisitorBookHash,
  MessageHashBuilder,
} from './message-hash';

