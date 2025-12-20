/**
 * Biometric Public Key Registration
 * Handles batch registration of secp256r1 public keys across all contracts
 */

import { writeContract, waitForTransactionReceipt } from '@wagmi/core';
import type { PublicKeyCoordinates } from './types';
import { CONTRACT_ADDRESSES } from '@/lib/contracts/addresses';
import type { Config } from 'wagmi';

/**
 * Contract that supports biometric key registration
 */
export interface BiometricContract {
  name: string;
  address: `0x${string}`;
  abi: readonly unknown[];
}

/**
 * Registration status for a single contract
 */
export interface RegistrationStatus {
  contractName: string;
  address: `0x${string}`;
  status: 'pending' | 'registering' | 'success' | 'error' | 'already-registered';
  txHash?: `0x${string}`;
  error?: string;
}

/**
 * Batch registration result
 */
export interface BatchRegistrationResult {
  success: boolean;
  statuses: RegistrationStatus[];
  totalRegistered: number;
  totalFailed: number;
  errors: string[];
}

/**
 * Generic ABI for registerSecp256r1Key function
 * All contracts have the same signature
 */
const REGISTER_KEY_ABI = [
  {
    inputs: [
      { internalType: 'bytes32', name: 'publicKeyX', type: 'bytes32' },
      { internalType: 'bytes32', name: 'publicKeyY', type: 'bytes32' },
    ],
    name: 'registerSecp256r1Key',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'bytes32', name: '', type: 'bytes32' },
    ],
    name: 'secp256r1ToAddress',
    outputs: [
      { internalType: 'address', name: '', type: 'address' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

/**
 * Check if public key is already registered on a contract
 */
export async function isKeyRegisteredOnContract(
  config: Config,
  contractAddress: `0x${string}`,
  publicKey: PublicKeyCoordinates,
  chainId: number
): Promise<boolean> {
  try {
    const { keccak256, encodePacked } = await import('viem');
    const { readContract } = await import('@wagmi/core');

    const publicKeyHash = keccak256(
      encodePacked(
        ['bytes32', 'bytes32'],
        [publicKey.x, publicKey.y]
      )
    );

    const registeredAddress = await readContract(config, {
      address: contractAddress,
      abi: REGISTER_KEY_ABI,
      functionName: 'secp256r1ToAddress',
      args: [publicKeyHash],
      chainId,
    });

    // If registered address is not zero address, key is already registered
    return registeredAddress !== '0x0000000000000000000000000000000000000000';
  } catch (error) {
    console.error(`Error checking registration on ${contractAddress}:`, error);
    return false;
  }
}

/**
 * Register public key on a single contract
 */
export async function registerKeyOnContract(
  config: Config,
  contractAddress: `0x${string}`,
  publicKey: PublicKeyCoordinates,
  chainId: number
): Promise<{ success: boolean; txHash?: `0x${string}`; error?: string }> {
  try {
    const hash = await writeContract(config, {
      address: contractAddress,
      abi: REGISTER_KEY_ABI,
      functionName: 'registerSecp256r1Key',
      args: [publicKey.x, publicKey.y],
      chainId,
    });

    // Wait for transaction confirmation
    const receipt = await waitForTransactionReceipt(config, {
      hash,
      chainId,
    });

    if (receipt.status === 'success') {
      return { success: true, txHash: hash };
    } else {
      return { success: false, error: 'Transaction reverted' };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: errorMessage };
  }
}

/**
 * Get list of contracts that support biometric registration
 */
export function getBiometricContracts(chainId: number): BiometricContract[] {
  const addresses = CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES];

  if (!addresses) {
    console.warn(`No contract addresses found for chain ${chainId}`);
    return [];
  }

  return [
    {
      name: 'Homie Token',
      address: addresses.PortfolioToken,
      abi: REGISTER_KEY_ABI,
    },
    {
      name: 'Project Voting',
      address: addresses.ProjectVoting,
      abi: REGISTER_KEY_ABI,
    },
    {
      name: 'Visit NFT',
      address: addresses.VisitNFT,
      abi: REGISTER_KEY_ABI,
    },
    {
      name: 'Project NFT',
      address: addresses.ProjectNFT,
      abi: REGISTER_KEY_ABI,
    },
    {
      name: 'Visitor Book',
      address: addresses.VisitorBook,
      abi: REGISTER_KEY_ABI,
    },
  ].filter(contract => contract.address && contract.address !== '0x0000000000000000000000000000000000000000');
}

/**
 * Register public key on all contracts
 * Returns detailed status for each contract
 */
export async function registerKeyOnAllContracts(
  config: Config,
  publicKey: PublicKeyCoordinates,
  chainId: number,
  onProgress?: (status: RegistrationStatus) => void
): Promise<BatchRegistrationResult> {
  const contracts = getBiometricContracts(chainId);
  const statuses: RegistrationStatus[] = [];
  const errors: string[] = [];
  let totalRegistered = 0;
  let totalFailed = 0;

  for (const contract of contracts) {
    const status: RegistrationStatus = {
      contractName: contract.name,
      address: contract.address,
      status: 'pending',
    };

    // Update progress: checking
    onProgress?.({ ...status, status: 'pending' });

    // Check if already registered
    const isRegistered = await isKeyRegisteredOnContract(
      config,
      contract.address,
      publicKey,
      chainId
    );

    if (isRegistered) {
      status.status = 'already-registered';
      statuses.push(status);
      onProgress?.(status);
      totalRegistered++;
      continue;
    }

    // Update progress: registering
    status.status = 'registering';
    onProgress?.(status);

    // Register key
    const result = await registerKeyOnContract(
      config,
      contract.address,
      publicKey,
      chainId
    );

    if (result.success) {
      status.status = 'success';
      status.txHash = result.txHash;
      totalRegistered++;
    } else {
      status.status = 'error';
      status.error = result.error;
      errors.push(`${contract.name}: ${result.error}`);
      totalFailed++;
    }

    statuses.push(status);
    onProgress?.(status);
  }

  return {
    success: totalFailed === 0,
    statuses,
    totalRegistered,
    totalFailed,
    errors,
  };
}

/**
 * Check registration status across all contracts
 */
export async function checkRegistrationStatus(
  config: Config,
  publicKey: PublicKeyCoordinates,
  chainId: number
): Promise<{
  isFullyRegistered: boolean;
  registeredContracts: string[];
  unregisteredContracts: string[];
}> {
  const contracts = getBiometricContracts(chainId);
  const registeredContracts: string[] = [];
  const unregisteredContracts: string[] = [];

  for (const contract of contracts) {
    const isRegistered = await isKeyRegisteredOnContract(
      config,
      contract.address,
      publicKey,
      chainId
    );

    if (isRegistered) {
      registeredContracts.push(contract.name);
    } else {
      unregisteredContracts.push(contract.name);
    }
  }

  return {
    isFullyRegistered: unregisteredContracts.length === 0,
    registeredContracts,
    unregisteredContracts,
  };
}
