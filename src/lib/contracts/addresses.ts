import { base, baseSepolia } from 'wagmi/chains';

/**
 * Contract addresses by chain ID
 * Update these after deploying contracts
 */
export const CONTRACT_ADDRESSES = {
  [base.id]: {
    // Deployed December 2024 - Updated with new SmartAccountFactory deployment
    PortfolioToken: '0x501670D894F073D9dee1504c5e9A4eda3bb0554E' as `0x${string}`,
    ProjectNFT: '0xB115F18219e3D4541389eaA4FD3f6f64EcC3617e' as `0x${string}`,
    ProjectVoting: '0xAdB06B28462201798Cd2B7d4b654127248494747' as `0x${string}`,
    VisitNFT: '0xBC556cA3F11Bc55A14e3E7Cd4890808C28C16b9f' as `0x${string}`,
    VisitorBook: '0x01b2B821f954683D1065c5B5534b7F997365001D' as `0x${string}`,
    PasskeyAccountFactory: '0x1941D12269B7288f5a90E7195c2AA3b37de94Ef2' as `0x${string}`,
    DeploymentPaymaster: '0x0000000000000000000000000000000000000000' as `0x${string}`,
  },
  [baseSepolia.id]: {
    PortfolioToken: '0x0000000000000000000000000000000000000000' as `0x${string}`,
    ProjectNFT: '0x0000000000000000000000000000000000000000' as `0x${string}`,
    ProjectVoting: '0x0000000000000000000000000000000000000000' as `0x${string}`,
    VisitNFT: '0x0000000000000000000000000000000000000000' as `0x${string}`,
    VisitorBook: '0x0000000000000000000000000000000000000000' as `0x${string}`,
    PasskeyAccountFactory: '0x0000000000000000000000000000000000000000' as `0x${string}`,
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
