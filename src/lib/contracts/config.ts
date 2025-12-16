/**
 * Contract configuration
 * Centralized contract ABIs and addresses
 */

import { base, baseSepolia } from 'wagmi/chains';
import {
  PORTFOLIO_TOKEN_ABI,
  PROJECT_NFT_ABI,
  PROJECT_VOTING_ABI,
  VISIT_NFT_ABI,
  VISITOR_BOOK_ABI,
} from './abis';
import { CONTRACT_ADDRESSES, getContractAddress, type ContractName } from './addresses';

/**
 * Contract configurations with ABIs and addresses
 */
export const CONTRACTS = {
  PortfolioToken: {
    abi: PORTFOLIO_TOKEN_ABI,
    addresses: {
      [base.id]: CONTRACT_ADDRESSES[base.id].PortfolioToken,
      [baseSepolia.id]: CONTRACT_ADDRESSES[baseSepolia.id].PortfolioToken,
    },
  },
  ProjectNFT: {
    abi: PROJECT_NFT_ABI,
    addresses: {
      [base.id]: CONTRACT_ADDRESSES[base.id].ProjectNFT,
      [baseSepolia.id]: CONTRACT_ADDRESSES[baseSepolia.id].ProjectNFT,
    },
  },
  ProjectVoting: {
    abi: PROJECT_VOTING_ABI,
    addresses: {
      [base.id]: CONTRACT_ADDRESSES[base.id].ProjectVoting,
      [baseSepolia.id]: CONTRACT_ADDRESSES[baseSepolia.id].ProjectVoting,
    },
  },
  VisitNFT: {
    abi: VISIT_NFT_ABI,
    addresses: {
      [base.id]: CONTRACT_ADDRESSES[base.id].VisitNFT,
      [baseSepolia.id]: CONTRACT_ADDRESSES[baseSepolia.id].VisitNFT,
    },
  },
  VisitorBook: {
    abi: VISITOR_BOOK_ABI,
    addresses: {
      [base.id]: CONTRACT_ADDRESSES[base.id].VisitorBook,
      [baseSepolia.id]: CONTRACT_ADDRESSES[baseSepolia.id].VisitorBook,
    },
  },
} as const;

/**
 * Get contract configuration for a specific chain
 */
export function getContract(contractName: ContractName, chainId: number) {
  const contract = CONTRACTS[contractName];
  return {
    abi: contract.abi,
    address: getContractAddress(chainId, contractName),
  };
}

/**
 * Export individual contract configs
 */
export { CONTRACT_ADDRESSES, getContractAddress, type ContractName };
export { PORTFOLIO_TOKEN_ABI, PROJECT_NFT_ABI, PROJECT_VOTING_ABI, VISIT_NFT_ABI, VISITOR_BOOK_ABI };
