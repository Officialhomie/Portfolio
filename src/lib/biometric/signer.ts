/**
 * Transaction Signing with Biometric Authentication (EIP-7951)
 * Signs transaction hashes with secp256r1 keys stored in secure enclave
 */

import type { WriteContractParameters } from 'wagmi/actions';
import { keccak256, encodePacked } from 'viem';
import { getStoredBiometricCredential, signWithBiometric, getStoredPublicKey } from './auth';
import { parseWebAuthnSignature, createBiometricTransactionSignature } from './signature-parser';
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
  const messageHash = generateMessageHash(options);

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
 */
export function generateMessageHash(options: BiometricSignOptions): `0x${string}` {
  const { functionName, chainId, contractAddress, userAddress, functionParams = [] } = options;

  // Build types and values arrays separately for encodePacked
  const types: string[] = ['string', 'uint256', 'address', 'address'];
  const values: unknown[] = [functionName, BigInt(chainId), contractAddress, userAddress];

  // Add function parameters dynamically
  for (const param of functionParams) {
    // Handle different parameter types
    if (typeof param === 'string') {
      types.push('string');
      values.push(param);
    } else if (typeof param === 'bigint' || typeof param === 'number') {
      types.push('uint256');
      values.push(BigInt(param));
    } else if (typeof param === 'boolean') {
      types.push('bool');
      values.push(param);
    } else {
      // Default to bytes32 for unknown types
      types.push('bytes32');
      values.push(param);
    }
  }

  // Encode and hash - encodePacked takes types and values as separate arguments
  // Cast to satisfy TypeScript's type checking for encodePacked
  return keccak256(encodePacked(types as readonly string[], values as readonly unknown[]));
}

/**
 * Generate message hash for specific function calls
 */
export function generateClaimFaucetHash(
  chainId: number,
  contractAddress: `0x${string}`,
  userAddress: `0x${string}`
): `0x${string}` {
  return generateMessageHash({
    chainId,
    contractAddress,
    userAddress,
    functionName: 'claimFaucet',
  });
}

export function generateVoteHash(
  chainId: number,
  contractAddress: `0x${string}`,
  userAddress: `0x${string}`,
  projectId: string
): `0x${string}` {
  return generateMessageHash({
    chainId,
    contractAddress,
    userAddress,
    functionName: 'vote',
    functionParams: [projectId],
  });
}

export function generateEndorseProjectHash(
  chainId: number,
  contractAddress: `0x${string}`,
  userAddress: `0x${string}`,
  tokenId: bigint
): `0x${string}` {
  return generateMessageHash({
    chainId,
    contractAddress,
    userAddress,
    functionName: 'endorseProject',
    functionParams: [tokenId],
  });
}

export function generateMintVisitNFTHash(
  chainId: number,
  contractAddress: `0x${string}`,
  userAddress: `0x${string}`
): `0x${string}` {
  return generateMessageHash({
    chainId,
    contractAddress,
    userAddress,
    functionName: 'mintVisitNFT',
  });
}

export function generateSignVisitorBookHash(
  chainId: number,
  contractAddress: `0x${string}`,
  userAddress: `0x${string}`,
  message: string,
  timestamp: bigint
): `0x${string}` {
  return generateMessageHash({
    chainId,
    contractAddress,
    userAddress,
    functionName: 'signVisitorBook',
    functionParams: [message, timestamp],
  });
}

