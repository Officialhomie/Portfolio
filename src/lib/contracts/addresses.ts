import { base, baseSepolia } from 'wagmi/chains';

/**
 * Contract addresses by chain ID
 * Update these after deploying contracts
 */
export const CONTRACT_ADDRESSES = {
  [base.id]: {
    PortfolioToken: '0x784FDE2AA2FB800dAbb7a9e76582d3E3CF4f9C7a' as `0x${string}`,
    ProjectNFT: '0x4C5f6b2658f6Fc25B2D285758ece987B8a7c3505' as `0x${string}`,
    ProjectVoting: '0x9F889b7DB73b2ce722F085B64c9ed7598AdD4A72' as `0x${string}`,
    VisitNFT: '0x4D09D6FC2D41daD91399346bB167256480C9b378' as `0x${string}`,
    VisitorBook: '0x1A04b2cc37bb29Cbe8Ce4172B672e58c5f53223a' as `0x${string}`,
  },
  [baseSepolia.id]: {
    PortfolioToken: '0x0000000000000000000000000000000000000000' as `0x${string}`,
    ProjectNFT: '0x0000000000000000000000000000000000000000' as `0x${string}`,
    ProjectVoting: '0x0000000000000000000000000000000000000000' as `0x${string}`,
    VisitNFT: '0x0000000000000000000000000000000000000000' as `0x${string}`,
    VisitorBook: '0x0000000000000000000000000000000000000000' as `0x${string}`,
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
 * Get Visitor Book contract address for a given chain ID
 */
export function getVisitorBookAddress(chainId: number | undefined): `0x${string}` {
  if (!chainId) return CONTRACT_ADDRESSES[base.id].VisitorBook;
  return CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES]?.VisitorBook || CONTRACT_ADDRESSES[base.id].VisitorBook;
}
