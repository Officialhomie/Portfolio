/**
 * Message Hash Generation for Biometric Transactions
 * Ensures consistency between frontend and smart contract hash generation
 *
 * CRITICAL: These functions MUST match exactly with Solidity abi.encodePacked
 */

import { keccak256, encodePacked } from 'viem';

/**
 * Base message hash generator
 * Matches Solidity: keccak256(abi.encodePacked(functionName, chainId, contractAddress, userAddress, ...params))
 */
export function generateMessageHash(
  functionName: string,
  chainId: number,
  contractAddress: `0x${string}`,
  userAddress: `0x${string}`,
  additionalParams?: Array<{ type: string; value: unknown }>
): `0x${string}` {
  // Build types and values arrays for encodePacked
  const types: string[] = ['string', 'uint256', 'address', 'address'];
  const values: unknown[] = [functionName, BigInt(chainId), contractAddress, userAddress];

  // Add additional parameters if provided
  if (additionalParams) {
    for (const param of additionalParams) {
      types.push(param.type);
      values.push(param.value);
    }
  }

  // Encode and hash
  // Cast to satisfy TypeScript while maintaining type safety
  return keccak256(encodePacked(types as readonly string[], values as readonly unknown[]));
}

/**
 * Generate message hash for claimFaucet function
 * Solidity: keccak256(abi.encodePacked("claimFaucet", block.chainid, address(this), user, nonce))
 */
export function generateClaimFaucetHash(
  chainId: number,
  contractAddress: `0x${string}`,
  userAddress: `0x${string}`,
  nonce: bigint | number
): `0x${string}` {
  return generateMessageHash('claimFaucet', chainId, contractAddress, userAddress, [
    { type: 'uint256', value: BigInt(nonce) },
  ]);
}

/**
 * Generate message hash for vote function
 * Solidity: keccak256(abi.encodePacked("vote", block.chainid, address(this), user, projectId, nonce))
 */
export function generateVoteHash(
  chainId: number,
  contractAddress: `0x${string}`,
  userAddress: `0x${string}`,
  projectId: string,
  nonce: bigint | number
): `0x${string}` {
  return generateMessageHash('vote', chainId, contractAddress, userAddress, [
    { type: 'string', value: projectId },
    { type: 'uint256', value: BigInt(nonce) },
  ]);
}

/**
 * Generate message hash for endorseProject function
 * Solidity: keccak256(abi.encodePacked("endorseProject", block.chainid, address(this), user, tokenId))
 */
export function generateEndorseProjectHash(
  chainId: number,
  contractAddress: `0x${string}`,
  userAddress: `0x${string}`,
  tokenId: bigint
): `0x${string}` {
  return generateMessageHash('endorseProject', chainId, contractAddress, userAddress, [
    { type: 'uint256', value: tokenId },
  ]);
}

/**
 * Generate message hash for mintVisitNFT function
 * Solidity: keccak256(abi.encodePacked("mintVisitNFT", block.chainid, address(this), user))
 */
export function generateMintVisitNFTHash(
  chainId: number,
  contractAddress: `0x${string}`,
  userAddress: `0x${string}`
): `0x${string}` {
  return generateMessageHash('mintVisitNFT', chainId, contractAddress, userAddress);
}

/**
 * Generate message hash for signVisitorBook function
 * Solidity: keccak256(abi.encodePacked("signVisitorBook", block.chainid, address(this), user, message, timestamp))
 */
export function generateSignVisitorBookHash(
  chainId: number,
  contractAddress: `0x${string}`,
  userAddress: `0x${string}`,
  message: string,
  timestamp: bigint
): `0x${string}` {
  return generateMessageHash('signVisitorBook', chainId, contractAddress, userAddress, [
    { type: 'string', value: message },
    { type: 'uint256', value: timestamp },
  ]);
}

/**
 * Type-safe parameter builder for custom functions
 */
export class MessageHashBuilder {
  private functionName: string;
  private chainId: number;
  private contractAddress: `0x${string}`;
  private userAddress: `0x${string}`;
  private params: Array<{ type: string; value: unknown }> = [];

  constructor(
    functionName: string,
    chainId: number,
    contractAddress: `0x${string}`,
    userAddress: `0x${string}`
  ) {
    this.functionName = functionName;
    this.chainId = chainId;
    this.contractAddress = contractAddress;
    this.userAddress = userAddress;
  }

  addString(value: string): this {
    this.params.push({ type: 'string', value });
    return this;
  }

  addUint256(value: bigint | number): this {
    this.params.push({ type: 'uint256', value: BigInt(value) });
    return this;
  }

  addAddress(value: `0x${string}`): this {
    this.params.push({ type: 'address', value });
    return this;
  }

  addBool(value: boolean): this {
    this.params.push({ type: 'bool', value });
    return this;
  }

  addBytes32(value: `0x${string}`): this {
    this.params.push({ type: 'bytes32', value });
    return this;
  }

  build(): `0x${string}` {
    return generateMessageHash(
      this.functionName,
      this.chainId,
      this.contractAddress,
      this.userAddress,
      this.params
    );
  }
}

/**
 * Validate that a message hash matches expected format
 */
export function validateMessageHash(hash: string): hash is `0x${string}` {
  // Check it's a hex string with 0x prefix and exactly 64 hex chars (32 bytes)
  return /^0x[0-9a-fA-F]{64}$/.test(hash);
}

/**
 * Export for testing - allows comparing with Solidity output
 */
export function debugMessageHash(
  functionName: string,
  chainId: number,
  contractAddress: `0x${string}`,
  userAddress: `0x${string}`,
  additionalParams?: Array<{ type: string; value: unknown }>
): {
  hash: `0x${string}`;
  inputs: {
    functionName: string;
    chainId: number;
    contractAddress: string;
    userAddress: string;
    params: Array<{ type: string; value: string }>;
  };
} {
  const hash = generateMessageHash(
    functionName,
    chainId,
    contractAddress,
    userAddress,
    additionalParams
  );

  return {
    hash,
    inputs: {
      functionName,
      chainId,
      contractAddress,
      userAddress,
      params: (additionalParams || []).map((p) => ({
        type: p.type,
        value: String(p.value),
      })),
    },
  };
}
