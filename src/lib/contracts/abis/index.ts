/**
 * Contract ABIs
 * Auto-generated from Foundry compilation
 */

import PortfolioTokenABI from './PortfolioToken.json';
import ProjectNFTABI from './ProjectNFT.json';
import ProjectVotingABI from './ProjectVoting.json';
import VisitNFTABI from './VisitNFT.json';
import VisitorBookABI from './VisitorBook.json';
import type { Abi } from 'viem';

// Export ABIs with proper typing using const assertion
export const PORTFOLIO_TOKEN_ABI = (PortfolioTokenABI as { abi: Abi }).abi;
export const PROJECT_NFT_ABI = (ProjectNFTABI as { abi: Abi }).abi;
export const PROJECT_VOTING_ABI = (ProjectVotingABI as { abi: Abi }).abi;
export const VISIT_NFT_ABI = (VisitNFTABI as { abi: Abi }).abi;
export const VISITOR_BOOK_ABI = VisitorBookABI as Abi;

// Dummy ABIs for biometric wallet functionality (not currently deployed)
export const BIOMETRIC_WALLET_FACTORY_ABI = [] as const;
export const BIOMETRIC_WALLET_ABI = [] as const;

// Re-export for convenience
export {
  PortfolioTokenABI,
  ProjectNFTABI,
  ProjectVotingABI,
  VisitNFTABI,
  VisitorBookABI,
};
