import { base, baseSepolia } from 'wagmi/chains';

/**
 * Contract addresses by chain ID
 * Update these after deploying contracts
 */
export const CONTRACT_ADDRESSES = {
  [base.id]: {
    // Deployed December 2024 - Fusaka-enabled chain
    PortfolioToken: '0x99C3714abA7d1C095d1F4f55DBc0CcE94d4513e1' as `0x${string}`,
    ProjectNFT: '0xBE830eB177Cd33e08712FA03043f9F8Adf98DC89' as `0x${string}`,
    ProjectVoting: '0x423aFC1a37315372921f194Da42F02bc8C1B117B' as `0x${string}`,
    VisitNFT: '0x3031Cd6Ff22B595AfB6C93BeBAB1587e8d566eF3' as `0x${string}`,
    VisitorBook: '0xA3a085364776a5DbB8ed34ef0B5e47BDf68F4285' as `0x${string}`,
    BiometricWalletFactory: '0x005F6A92EEe566fb8B09a2B9024DEF8D170B2300' as `0x${string}`,
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
