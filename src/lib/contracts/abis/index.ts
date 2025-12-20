/**
 * Contract ABIs
 * Auto-generated from Foundry compilation
 */

import PortfolioTokenABI from './PortfolioToken.json';
import ProjectNFTABI from './ProjectNFT.json';
import ProjectVotingABI from './ProjectVoting.json';
import VisitNFTABI from './VisitNFT.json';
import VisitorBookABI from './VisitorBook.json';
import BiometricWalletABI from './BiometricWallet.json';
import BiometricWalletFactoryABI from './BiometricWalletFactory.json';
import DeploymentPaymasterABI from './DeploymentPaymaster.json';
import type { Abi } from 'viem';

// Extract ABI from JSON structure (JSON files may have { abi: [...] } or be direct arrays)
const extractAbi = (json: any): Abi => {
  if (Array.isArray(json)) {
    return json as Abi;
  }
  if (json && json.abi && Array.isArray(json.abi)) {
    return json.abi as Abi;
  }
  return json as Abi;
};

// Export ABIs with proper typing
export const PORTFOLIO_TOKEN_ABI = extractAbi(PortfolioTokenABI);
export const PROJECT_NFT_ABI = extractAbi(ProjectNFTABI);
export const PROJECT_VOTING_ABI = extractAbi(ProjectVotingABI);
export const VISIT_NFT_ABI = extractAbi(VisitNFTABI);
export const VISITOR_BOOK_ABI = extractAbi(VisitorBookABI);
export const BIOMETRIC_WALLET_ABI = extractAbi(BiometricWalletABI);
export const BIOMETRIC_WALLET_FACTORY_ABI = extractAbi(BiometricWalletFactoryABI);
export const DEPLOYMENT_PAYMASTER_ABI = extractAbi(DeploymentPaymasterABI);

// Re-export for convenience
export {
  PortfolioTokenABI,
  ProjectNFTABI,
  ProjectVotingABI,
  VisitNFTABI,
  VisitorBookABI,
  BiometricWalletABI,
  BiometricWalletFactoryABI,
  DeploymentPaymasterABI,
};
