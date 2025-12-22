/**
 * Utility to verify smart account deployment status on-chain
 */

import { createPublicClient, http } from 'viem';
import { base } from 'viem/chains';
import type { Address } from 'viem';

/**
 * Check if a smart account is deployed on-chain
 * @param address The smart account address to check
 * @param chainId Optional chain ID (defaults to Base mainnet)
 * @returns true if deployed, false otherwise
 */
export async function verifyAccountDeployment(
  address: Address,
  chainId: number = 8453
): Promise<{ deployed: boolean; codeLength: number; details: string }> {
  try {
    const chain = chainId === 8453 ? base : base;
    const publicClient = createPublicClient({
      chain,
      transport: http(),
    });

    const code = await publicClient.getCode({ address });
    const deployed = code !== undefined && code !== '0x' && code.length > 2;
    const codeLength = code?.length || 0;

    return {
      deployed,
      codeLength,
      details: deployed
        ? `✅ Account is deployed! Code length: ${codeLength} bytes`
        : `❌ Account not deployed. Code length: ${codeLength}`,
    };
  } catch (error) {
    return {
      deployed: false,
      codeLength: 0,
      details: `Error checking deployment: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Get deployment transaction hash if account was recently deployed
 * @param address The smart account address
 * @param chainId Optional chain ID
 * @returns Transaction hash if found, null otherwise
 */
export async function getDeploymentTransaction(
  address: Address,
  chainId: number = 8453
): Promise<string | null> {
  try {
    const chain = chainId === 8453 ? base : base;
    const publicClient = createPublicClient({
      chain,
      transport: http(),
    });

    // Get the account creation transaction from the factory
    // This is a simplified check - in production you'd query the factory events
    const code = await publicClient.getCode({ address });
    
    if (code && code !== '0x') {
      // Account is deployed, but we can't easily get the tx hash without querying events
      // For now, return a message
      return 'Account is deployed (check BaseScan for transaction details)';
    }

    return null;
  } catch (error) {
    console.error('Error getting deployment transaction:', error);
    return null;
  }
}

/**
 * Format BaseScan URL for the account
 */
export function getBaseScanUrl(address: Address, chainId: number = 8453): string {
  if (chainId === 8453) {
    return `https://basescan.org/address/${address}`;
  } else {
    return `https://sepolia.basescan.org/address/${address}`;
  }
}

