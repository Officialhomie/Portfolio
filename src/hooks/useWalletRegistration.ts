'use client';

/**
 * Wallet Registration Hook
 * Centralized wallet registration management across all contracts
 * Works with Privy wallets
 */

import { useCallback } from 'react';
import { useAccount, useReadContract, usePublicClient } from 'wagmi';
import { encodeFunctionData, type Address } from 'viem';
import { base } from 'wagmi/chains';
import { usePrivyWallet } from './usePrivyWallet';
import { PORTFOLIO_TOKEN_ABI, PROJECT_VOTING_ABI, VISIT_NFT_ABI, PROJECT_NFT_ABI, VISITOR_BOOK_ABI } from '@/lib/contracts/abis';
import { CONTRACT_ADDRESSES } from '@/lib/contracts/addresses';
import { checkWalletRegistration } from '@/lib/utils/balance-verification';

export type ContractName = 'PortfolioToken' | 'ProjectVoting' | 'VisitNFT' | 'ProjectNFT' | 'VisitorBook';

interface RegistrationStatus {
  portfolioToken: boolean;
  projectVoting: boolean;
  visitNFT: boolean;
  projectNFT: boolean;
  visitorBook: boolean;
  allRegistered: boolean;
}

/**
 * Hook to manage wallet registration across all contracts
 */
export function useWalletRegistration() {
  const { address, chainId } = useAccount();
  const { smartWalletAddress, eoaAddress, sendTransaction } = usePrivyWallet();
  const publicClient = usePublicClient();

  // Get contract addresses
  const getContractAddress = useCallback((contractName: ContractName): Address | null => {
    if (!chainId) return null;
    const addresses = CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES];
    if (!addresses) return null;
    return addresses[contractName] || null;
  }, [chainId]);

  // Check registration status for a specific contract
  const checkRegistration = useCallback(async (
    contractName: ContractName
  ): Promise<boolean> => {
    if (!smartWalletAddress || !address || !chainId) return false;

    const contractAddress = getContractAddress(contractName);
    if (!contractAddress || !publicClient) return false;

    let abi;
    switch (contractName) {
      case 'PortfolioToken':
        abi = PORTFOLIO_TOKEN_ABI;
        break;
      case 'ProjectVoting':
        abi = PROJECT_VOTING_ABI;
        break;
      case 'VisitNFT':
        abi = VISIT_NFT_ABI;
        break;
      case 'ProjectNFT':
        abi = PROJECT_NFT_ABI;
        break;
      case 'VisitorBook':
        abi = VISITOR_BOOK_ABI;
        break;
      default:
        return false;
    }

    try {
      const registeredUser = await publicClient.readContract({
        address: contractAddress,
        abi,
        functionName: 'walletToUser',
        args: [smartWalletAddress],
      });

      return registeredUser !== '0x0000000000000000000000000000000000000000' &&
        (registeredUser as Address).toLowerCase() === address.toLowerCase();
    } catch {
      return false;
    }
  }, [smartWalletAddress, address, chainId, getContractAddress, publicClient]);

  // Register wallet in a specific contract
  const registerWallet = useCallback(async (
    contractName: ContractName
  ): Promise<void> => {
    if (!smartWalletAddress || !address || !chainId) {
      throw new Error('Wallet not connected');
    }

    const contractAddress = getContractAddress(contractName);
    if (!contractAddress) {
      throw new Error(`${contractName} not deployed on this chain`);
    }

    let abi;
    switch (contractName) {
      case 'PortfolioToken':
        abi = PORTFOLIO_TOKEN_ABI;
        break;
      case 'ProjectVoting':
        abi = PROJECT_VOTING_ABI;
        break;
      case 'VisitNFT':
        abi = VISIT_NFT_ABI;
        break;
      case 'ProjectNFT':
        abi = PROJECT_NFT_ABI;
        break;
      case 'VisitorBook':
        abi = VISITOR_BOOK_ABI;
        break;
      default:
        throw new Error(`Unknown contract: ${contractName}`);
    }

    const data = encodeFunctionData({
      abi,
      functionName: 'registerWallet',
      args: [smartWalletAddress, address],
    });

    await sendTransaction({
      to: contractAddress,
      data,
      value: 0n,
    });

    // Wait for transaction to be mined
    await new Promise(resolve => setTimeout(resolve, 3000));
  }, [smartWalletAddress, address, chainId, getContractAddress, sendTransaction]);

  // Register wallet in all contracts
  const registerAll = useCallback(async (): Promise<void> => {
    const contracts: ContractName[] = [
      'PortfolioToken',
      'ProjectVoting',
      'VisitNFT',
      'ProjectNFT',
      'VisitorBook',
    ];

    for (const contractName of contracts) {
      const isRegistered = await checkRegistration(contractName);
      if (!isRegistered) {
        try {
          await registerWallet(contractName);
          console.log(`✅ Registered wallet in ${contractName}`);
        } catch (error) {
          console.error(`❌ Failed to register in ${contractName}:`, error);
          throw error;
        }
      }
    }
  }, [checkRegistration, registerWallet]);

  // Get registration status for all contracts
  const getRegistrationStatus = useCallback(async (): Promise<RegistrationStatus> => {
    const portfolioToken = await checkRegistration('PortfolioToken');
    const projectVoting = await checkRegistration('ProjectVoting');
    const visitNFT = await checkRegistration('VisitNFT');
    const projectNFT = await checkRegistration('ProjectNFT');
    const visitorBook = await checkRegistration('VisitorBook');

    return {
      portfolioToken,
      projectVoting,
      visitNFT,
      projectNFT,
      visitorBook,
      allRegistered: portfolioToken && projectVoting && visitNFT && projectNFT && visitorBook,
    };
  }, [checkRegistration]);

  return {
    checkRegistration,
    registerWallet,
    registerAll,
    getRegistrationStatus,
    smartWalletAddress,
    eoaAddress,
  };
}


