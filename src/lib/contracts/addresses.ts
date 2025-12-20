import { base, baseSepolia } from 'wagmi/chains';

/**
 * Contract addresses by chain ID
 * Update these after deploying contracts
 */
export const CONTRACT_ADDRESSES = {
  [base.id]: {
    // Deployed December 2024 - Fusaka-enabled chain
    PortfolioToken: '0x19573561A147fdb6105762C965a66db6Cb2510F6' as `0x${string}`,
    ProjectNFT: '0xc0c257a95BbF359c8230b5A24Db96c422F24424C' as `0x${string}`,
    ProjectVoting: '0x2304C17AD225bE17F968dE529CFd96A80D38f467' as `0x${string}`,
    VisitNFT: '0xa9f173D7260788701C71427C9Ecc76d553d8ffA3' as `0x${string}`,
    VisitorBook: '0xF61a59B7B383D46DEcD0Cc4ca7c239871A53686C' as `0x${string}`,
    BiometricWalletFactory: '0x0000000000000000000000000000000000000000' as `0x${string}`,
    DeploymentPaymaster: '0x0000000000000000000000000000000000000000' as `0x${string}`,
  },
  [baseSepolia.id]: {
    PortfolioToken: '0x0000000000000000000000000000000000000000' as `0x${string}`,
    ProjectNFT: '0x0000000000000000000000000000000000000000' as `0x${string}`,
    ProjectVoting: '0x0000000000000000000000000000000000000000' as `0x${string}`,
    VisitNFT: '0x0000000000000000000000000000000000000000' as `0x${string}`,
    VisitorBook: '0x0000000000000000000000000000000000000000' as `0x${string}`,
    BiometricWalletFactory: '0x0000000000000000000000000000000000000000' as `0x${string}`,
    DeploymentPaymaster: '0x0000000000000000000000000000000000000000' as `0x${string}`,
  },
} as const;

export type ContractName = keyof typeof CONTRACT_ADDRESSES[typeof base.id];

/**
 * Get contract address for a given chain ID and contract name
 */
export function getContractAddress(
  chainId: number,
  contractName: ContractName
): `0x${string}` {
  const addresses = CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES];
  if (!addresses) {
    throw new Error(`Unsupported chain ID: ${chainId}`);
  }
  return addresses[contractName];
}

/**
 * Check if a chain is supported
 */
export function isSupportedChain(chainId: number): boolean {
  return chainId in CONTRACT_ADDRESSES;
}

/**
 * Get all supported chain IDs
 */
export function getSupportedChainIds(): number[] {
  return Object.keys(CONTRACT_ADDRESSES).map(Number);
}

/**
 * Chain feature flags
 */
export const CHAIN_FEATURES = {
  [base.id]: {
    name: 'Base',
    fusakaEnabled: true,
    fusakaActivationDate: 'December 3, 2024',
    eip7951Support: true,
    biometricGasCost: 6900,
    biometricGasSavings: 93,
  },
  [baseSepolia.id]: {
    name: 'Base Sepolia',
    fusakaEnabled: true,
    fusakaActivationDate: 'October 16, 2024',
    eip7951Support: true,
    biometricGasCost: 6900,
    biometricGasSavings: 93,
  },
} as const;

/**
 * Check if chain has Fusaka upgrade (EIP-7951 support)
 */
export function isFusakaEnabled(chainId: number): boolean {
  return CHAIN_FEATURES[chainId as keyof typeof CHAIN_FEATURES]?.fusakaEnabled ?? false;
}

/**
 * Get expected biometric gas cost for chain
 */
export function getBiometricGasCost(chainId: number): number {
  return CHAIN_FEATURES[chainId as keyof typeof CHAIN_FEATURES]?.biometricGasCost ?? 100000;
}

/**
 * Get Visitor Book contract address for a given chain ID
 */
export function getVisitorBookAddress(chainId: number | undefined): `0x${string}` {
  if (!chainId) return CONTRACT_ADDRESSES[base.id].VisitorBook;
  return CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES]?.VisitorBook || CONTRACT_ADDRESSES[base.id].VisitorBook;
}
