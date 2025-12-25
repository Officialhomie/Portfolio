/**
 * Balance Verification Utility
 * Verifies balance consistency between EOA and smart wallet addresses
 * Works with Privy wallets
 */

import { type Address, type PublicClient } from 'viem';
import { PORTFOLIO_TOKEN_ABI, PROJECT_VOTING_ABI } from '@/lib/contracts/abis';

export interface BalanceVerificationResult {
  eoaBalance: bigint;
  smartWalletBalance: bigint;
  isConsistent: boolean;
  warning?: string;
}

export interface RegistrationStatus {
  portfolioToken: {
    registered: boolean;
    registeredTo?: Address;
  };
  projectVoting: {
    registered: boolean;
    registeredTo?: Address;
  };
  allRegistered: boolean;
}

export interface BalanceBreakdown {
  eoaAddress: Address;
  smartWalletAddress: Address | null;
  eoaBalance: bigint;
  smartWalletBalance: bigint;
  totalBalance: bigint;
  isConsistent: boolean;
  warnings: string[];
}

/**
 * Verify balance consistency between EOA and smart wallet
 */
export async function verifyBalanceConsistency(
  eoaAddress: Address,
  smartWalletAddress: Address | undefined,
  tokenContract: Address,
  publicClient: PublicClient
): Promise<BalanceVerificationResult> {
  const eoaBalance = await publicClient.readContract({
    address: tokenContract,
    abi: PORTFOLIO_TOKEN_ABI,
    functionName: 'balanceOf',
    args: [eoaAddress],
  }) as bigint;

  const smartWalletBalance = smartWalletAddress
    ? (await publicClient.readContract({
        address: tokenContract,
        abi: PORTFOLIO_TOKEN_ABI,
        functionName: 'balanceOf',
        args: [smartWalletAddress],
      }) as bigint)
    : 0n;

  // Balance is consistent if:
  // 1. Smart wallet has no balance (all tokens in EOA), OR
  // 2. Smart wallet is not set (no smart wallet)
  const isConsistent = smartWalletBalance === 0n || !smartWalletAddress;

  let warning: string | undefined;
  if (!isConsistent && smartWalletBalance > 0n) {
    warning = 'Tokens detected in smart wallet. Ensure wallet is registered to mint tokens to EOA.';
  }

  return {
    eoaBalance,
    smartWalletBalance,
    isConsistent,
    warning,
  };
}

/**
 * Check wallet registration status across all contracts
 */
export async function checkWalletRegistration(
  smartWalletAddress: Address,
  eoaAddress: Address,
  contracts: {
    portfolioToken: Address;
    projectVoting: Address;
  },
  publicClient: PublicClient
): Promise<RegistrationStatus> {
  // Check PortfolioToken registration
  const portfolioTokenRegistered = await publicClient.readContract({
    address: contracts.portfolioToken,
    abi: PORTFOLIO_TOKEN_ABI,
    functionName: 'walletToUser',
    args: [smartWalletAddress],
  }) as Address;

  // Check ProjectVoting registration
  const projectVotingRegistered = await publicClient.readContract({
    address: contracts.projectVoting,
    abi: PROJECT_VOTING_ABI,
    functionName: 'walletToUser',
    args: [smartWalletAddress],
  }) as Address;

  const portfolioTokenStatus = {
    registered: portfolioTokenRegistered !== '0x0000000000000000000000000000000000000000' && portfolioTokenRegistered === eoaAddress,
    registeredTo: portfolioTokenRegistered !== '0x0000000000000000000000000000000000000000' ? (portfolioTokenRegistered as Address) : undefined,
  };

  const projectVotingStatus = {
    registered: projectVotingRegistered !== '0x0000000000000000000000000000000000000000' && projectVotingRegistered === eoaAddress,
    registeredTo: projectVotingRegistered !== '0x0000000000000000000000000000000000000000' ? (projectVotingRegistered as Address) : undefined,
  };

  return {
    portfolioToken: portfolioTokenStatus,
    projectVoting: projectVotingStatus,
    allRegistered: portfolioTokenStatus.registered && projectVotingStatus.registered,
  };
}

/**
 * Get detailed balance breakdown
 */
export async function getBalanceBreakdown(
  eoaAddress: Address,
  smartWalletAddress: Address | undefined,
  tokenContract: Address,
  publicClient: PublicClient
): Promise<BalanceBreakdown> {
  const eoaBalance = await publicClient.readContract({
    address: tokenContract,
    abi: PORTFOLIO_TOKEN_ABI,
    functionName: 'balanceOf',
    args: [eoaAddress],
  }) as bigint;

  const smartWalletBalance = smartWalletAddress
    ? (await publicClient.readContract({
        address: tokenContract,
        abi: PORTFOLIO_TOKEN_ABI,
        functionName: 'balanceOf',
        args: [smartWalletAddress],
      }) as bigint)
    : 0n;

  const totalBalance = eoaBalance + smartWalletBalance;
  const isConsistent = smartWalletBalance === 0n || !smartWalletAddress;

  const warnings: string[] = [];
  if (!isConsistent && smartWalletBalance > 0n) {
    warnings.push('Tokens detected in smart wallet. Ensure wallet is registered to mint tokens to EOA.');
  }
  if (smartWalletAddress && smartWalletBalance > 0n && eoaBalance === 0n) {
    warnings.push('All tokens are in smart wallet. Balance reading from EOA will show 0.');
  }

  return {
    eoaAddress,
    smartWalletAddress: smartWalletAddress || null,
    eoaBalance,
    smartWalletBalance,
    totalBalance,
    isConsistent,
    warnings,
  };
}


