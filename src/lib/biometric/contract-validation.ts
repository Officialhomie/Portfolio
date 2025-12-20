/**
 * Contract Address Validation for Biometric Transactions
 * Ensures users only sign transactions for trusted contracts
 */

import { CONTRACT_ADDRESSES } from '@/lib/contracts/addresses';
import { base, baseSepolia } from 'wagmi/chains';

/**
 * Trusted contract whitelist per chain
 * Only these contracts are allowed for biometric signing
 */
export const TRUSTED_CONTRACTS = {
  [base.id]: {
    PortfolioToken: CONTRACT_ADDRESSES[base.id]?.PortfolioToken,
    ProjectVoting: CONTRACT_ADDRESSES[base.id]?.ProjectVoting,
    VisitNFT: CONTRACT_ADDRESSES[base.id]?.VisitNFT,
    ProjectNFT: CONTRACT_ADDRESSES[base.id]?.ProjectNFT,
    VisitorBook: CONTRACT_ADDRESSES[base.id]?.VisitorBook,
  },
  [baseSepolia.id]: {
    PortfolioToken: CONTRACT_ADDRESSES[baseSepolia.id]?.PortfolioToken,
    ProjectVoting: CONTRACT_ADDRESSES[baseSepolia.id]?.ProjectVoting,
    VisitNFT: CONTRACT_ADDRESSES[baseSepolia.id]?.VisitNFT,
    ProjectNFT: CONTRACT_ADDRESSES[baseSepolia.id]?.ProjectNFT,
    VisitorBook: CONTRACT_ADDRESSES[baseSepolia.id]?.VisitorBook,
  },
} as const;

/**
 * Contract validation result
 */
export interface ContractValidationResult {
  isValid: boolean;
  isTrusted: boolean;
  contractName?: string;
  warning?: string;
  error?: string;
}

/**
 * Validate that a contract address is trusted for biometric signing
 */
export function validateContractAddress(
  chainId: number,
  address: `0x${string}`,
  expectedContractName?: string
): ContractValidationResult {
  // Normalize address to lowercase for comparison
  const normalizedAddress = address.toLowerCase() as `0x${string}`;

  // Check if chain is supported
  const chainContracts = TRUSTED_CONTRACTS[chainId as keyof typeof TRUSTED_CONTRACTS];
  if (!chainContracts) {
    return {
      isValid: false,
      isTrusted: false,
      error: `Unsupported chain ID: ${chainId}. Biometric signing only available on Base networks.`,
    };
  }

  // Find contract name by address
  let foundContractName: string | undefined;
  for (const [name, contractAddress] of Object.entries(chainContracts)) {
    if (contractAddress && contractAddress.toLowerCase() === normalizedAddress) {
      foundContractName = name;
      break;
    }
  }

  // Contract not in whitelist
  if (!foundContractName) {
    return {
      isValid: false,
      isTrusted: false,
      error: `Contract address ${address} is not in the trusted whitelist. Refusing to sign.`,
    };
  }

  // If expected contract name provided, verify it matches
  if (expectedContractName && foundContractName !== expectedContractName) {
    return {
      isValid: false,
      isTrusted: true,
      contractName: foundContractName,
      warning: `Expected contract "${expectedContractName}" but found "${foundContractName}". Possible phishing attempt.`,
      error: `Contract mismatch: expected ${expectedContractName}, got ${foundContractName}`,
    };
  }

  // All checks passed
  return {
    isValid: true,
    isTrusted: true,
    contractName: foundContractName,
  };
}

/**
 * Get trusted contract address by name and chain
 */
export function getTrustedContractAddress(
  chainId: number,
  contractName: string
): `0x${string}` | null {
  const chainContracts = TRUSTED_CONTRACTS[chainId as keyof typeof TRUSTED_CONTRACTS];
  if (!chainContracts) {
    return null;
  }

  const address = chainContracts[contractName as keyof typeof chainContracts];
  return address || null;
}

/**
 * Check if an address is a trusted contract
 */
export function isTrustedContract(chainId: number, address: `0x${string}`): boolean {
  const result = validateContractAddress(chainId, address);
  return result.isTrusted;
}

/**
 * Get list of all trusted contracts for a chain
 */
export function getTrustedContracts(chainId: number): Array<{
  name: string;
  address: `0x${string}`;
}> {
  const chainContracts = TRUSTED_CONTRACTS[chainId as keyof typeof TRUSTED_CONTRACTS];
  if (!chainContracts) {
    return [];
  }

  return Object.entries(chainContracts)
    .filter(([_, address]) => address !== undefined)
    .map(([name, address]) => ({
      name,
      address: address!,
    }));
}

/**
 * Validate contract before biometric signing
 * Throws error if validation fails
 */
export function assertTrustedContract(
  chainId: number,
  address: `0x${string}`,
  expectedContractName?: string
): void {
  const result = validateContractAddress(chainId, address, expectedContractName);

  if (!result.isValid) {
    throw new Error(result.error || 'Contract validation failed');
  }

  if (result.warning) {
    console.warn('[Contract Validation Warning]', result.warning);
  }
}

/**
 * Validate multiple contracts (for batch operations)
 */
export function validateMultipleContracts(
  chainId: number,
  addresses: `0x${string}`[]
): {
  allValid: boolean;
  results: ContractValidationResult[];
  validCount: number;
  invalidCount: number;
} {
  const results = addresses.map((address) => validateContractAddress(chainId, address));

  const validCount = results.filter((r) => r.isValid).length;
  const invalidCount = results.filter((r) => !r.isValid).length;

  return {
    allValid: invalidCount === 0,
    results,
    validCount,
    invalidCount,
  };
}

/**
 * Get contract name from address (returns null if not trusted)
 */
export function getContractName(chainId: number, address: `0x${string}`): string | null {
  const result = validateContractAddress(chainId, address);
  return result.contractName || null;
}
