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

// Export ABIs with proper typing
export const PORTFOLIO_TOKEN_ABI = PortfolioTokenABI as Abi;
export const PROJECT_NFT_ABI = ProjectNFTABI as Abi;
export const PROJECT_VOTING_ABI = ProjectVotingABI as Abi;
export const VISIT_NFT_ABI = VisitNFTABI as Abi;
export const VISITOR_BOOK_ABI = VisitorBookABI as Abi;

// Re-export for convenience
export {
  PortfolioTokenABI,
  ProjectNFTABI,
  ProjectVotingABI,
  VisitNFTABI,
  VisitorBookABI,
};
