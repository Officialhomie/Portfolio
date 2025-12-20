/**
 * Smart Wallet Service
 * Manages BiometricWallet interactions for Fusaka-native biometric authentication
 */

import { Address, Hash, keccak256, encodePacked } from 'viem';
import { getPublicClient, getWalletClient } from '@wagmi/core';
import { wagmiConfig } from '@/lib/wagmi/config';
import { getContractAddress } from '@/lib/contracts/addresses';
import { BIOMETRIC_WALLET_FACTORY_ABI, BIOMETRIC_WALLET_ABI } from '@/lib/contracts/abis';

export interface PublicKey {
  x: `0x${string}`;
  y: `0x${string}`;
}

export interface Transaction {
  to: Address;
  value?: bigint;
  data: `0x${string}`;
}

/**
 * Compute smart wallet address from public key
 */
export async function getSmartWalletAddress(
  publicKey: PublicKey,
  chainId: number,
  salt: `0x${string}` = `0x${'0'.repeat(64)}`
): Promise<Address> {
  const factoryAddress = getContractAddress(chainId, 'BiometricWalletFactory' as any);
  
  // Check if factory is deployed (not zero address)
  if (!factoryAddress || factoryAddress === '0x0000000000000000000000000000000000000000') {
    throw new Error(
      'BiometricWalletFactory is not deployed on this chain. ' +
      'Please deploy the factory contract first, or use Biconomy smart accounts instead.'
    );
  }

  const client = getPublicClient(wagmiConfig, { chainId });
  if (!client) {
    throw new Error('Public client not available');
  }
  
  try {
    const walletAddress = await client.readContract({
      address: factoryAddress,
      abi: BIOMETRIC_WALLET_FACTORY_ABI,
      functionName: 'getWalletAddress',
      args: [publicKey.x as `0x${string}`, publicKey.y as `0x${string}`, salt],
    });

    // Validate the returned address
    if (!walletAddress || walletAddress === '0x0000000000000000000000000000000000000000') {
      throw new Error('Factory returned invalid wallet address. The contract may not be properly deployed.');
    }

    return walletAddress as Address;
  } catch (error) {
    if (error instanceof Error && error.message.includes('returned no data')) {
      throw new Error(
        `BiometricWalletFactory contract call failed. ` +
        `The factory at ${factoryAddress} may not be deployed or the function may not exist. ` +
        `Consider using Biconomy smart accounts instead.`
      );
    }
    throw error;
  }
}

/**
 * Check if wallet is deployed
 */
export async function isWalletDeployed(
  walletAddress: Address,
  chainId: number
): Promise<boolean> {
  const factoryAddress = getContractAddress(chainId, 'BiometricWalletFactory' as any);
  if (!factoryAddress) {
    return false;
  }

  try {
    const client = getPublicClient(wagmiConfig, { chainId });
    if (!client) {
      return false;
    }
    const deployed = await client.readContract({
      address: factoryAddress,
      abi: BIOMETRIC_WALLET_FACTORY_ABI,
      functionName: 'isWalletDeployed',
      args: [walletAddress],
    });
    return deployed as boolean;
  } catch {
    return false;
  }
}

/**
 * Deploy smart wallet
 */
export async function deploySmartWallet(
  publicKey: PublicKey,
  chainId: number,
  sponsored: boolean = true,
  salt: `0x${string}` = `0x${'0'.repeat(64)}`
): Promise<Address> {
  const factoryAddress = getContractAddress(chainId, 'BiometricWalletFactory' as any);
  if (!factoryAddress) {
    throw new Error('BiometricWalletFactory not deployed on this chain');
  }

  const wallet = await getWalletClient(wagmiConfig, { chainId });
  if (!wallet) {
    throw new Error('Wallet client not available');
  }

  const functionName = sponsored ? 'createWalletSponsored' : 'createWallet';

  const hash = await wallet.writeContract({
    address: factoryAddress,
    abi: BIOMETRIC_WALLET_FACTORY_ABI,
    functionName,
    args: [publicKey.x as `0x${string}`, publicKey.y as `0x${string}`, salt],
  });

  // Wait for transaction
  const publicClient = getPublicClient(wagmiConfig, { chainId });
  if (!publicClient) {
    throw new Error('Public client not available');
  }
  await publicClient.waitForTransactionReceipt({ hash });
  
  // Extract wallet address from events or compute it
  const walletAddress = await getSmartWalletAddress(publicKey, chainId, salt);
  
  return walletAddress;
}

/**
 * Sign and execute transaction via smart wallet
 */
export async function signAndExecute(
  walletAddress: Address,
  tx: Transaction,
  publicKey: PublicKey,
  credentialId: string,
  chainId: number,
  signMessage: (message: Uint8Array) => Promise<Uint8Array>
): Promise<Hash> {
  // Get nonce for the public key
  const publicKeyHash = keccak256(encodePacked(['bytes32', 'bytes32'], [publicKey.x, publicKey.y]));
  const client = getPublicClient(wagmiConfig, { chainId });
  
  if (!client) {
    throw new Error('Public client not available');
  }
  
  const nonce = await client.readContract({
    address: walletAddress,
    abi: BIOMETRIC_WALLET_ABI,
    functionName: 'getNonce',
    args: [publicKeyHash],
  }) as bigint;

  // Build message hash
  const messageHash = keccak256(encodePacked(
    ['string', 'uint256', 'address', 'address', 'uint256', 'bytes32', 'uint256'],
    ['execute', BigInt(chainId), walletAddress, tx.to, tx.value || 0n, keccak256(tx.data), nonce]
  ));

  // Sign with biometric
  const messageHashBytes = new Uint8Array(Buffer.from(messageHash.slice(2), 'hex'));
  const signature = await signMessage(messageHashBytes);

  // Parse signature to r, s (assuming DER format needs parsing)
  // For now, assume signature is already in r, s format (64 bytes)
  const r = `0x${Array.from(signature.slice(0, 32)).map(b => b.toString(16).padStart(2, '0')).join('')}` as `0x${string}`;
  const s = `0x${Array.from(signature.slice(32, 64)).map(b => b.toString(16).padStart(2, '0')).join('')}` as `0x${string}`;

  // Execute transaction
  const wallet = await getWalletClient(wagmiConfig, { chainId });
  if (!wallet) {
    throw new Error('Wallet client not available');
  }

  const hash = await wallet.writeContract({
    address: walletAddress,
    abi: BIOMETRIC_WALLET_ABI,
    functionName: 'execute',
    args: [
      tx.to,
      tx.value || 0n,
      tx.data,
      r,
      s,
      publicKey.x as `0x${string}`,
      publicKey.y as `0x${string}`,
      nonce,
    ],
  });

  return hash;
}

/**
 * Register public key in wallet (for adding additional keys)
 */
export async function registerPublicKeyInWallet(
  walletAddress: Address,
  newPublicKey: PublicKey,
  signerPublicKey: PublicKey,
  credentialId: string,
  chainId: number,
  signMessage: (message: Uint8Array) => Promise<Uint8Array>
): Promise<Hash> {
  // Get nonce
  const signerKeyHash = keccak256(encodePacked(['bytes32', 'bytes32'], [signerPublicKey.x, signerPublicKey.y]));
  const client = getPublicClient(wagmiConfig, { chainId });
  
  if (!client) {
    throw new Error('Public client not available');
  }
  
  const nonce = await client.readContract({
    address: walletAddress,
    abi: BIOMETRIC_WALLET_ABI,
    functionName: 'getNonce',
    args: [signerKeyHash],
  }) as bigint;

  // Build message hash
  const messageHash = keccak256(encodePacked(
    ['string', 'uint256', 'address', 'bytes32', 'bytes32', 'uint256'],
    ['registerPublicKey', BigInt(chainId), walletAddress, newPublicKey.x, newPublicKey.y, nonce]
  ));

  // Sign with biometric
  const messageHashBytes = new Uint8Array(Buffer.from(messageHash.slice(2), 'hex'));
  const signature = await signMessage(messageHashBytes);

  // Parse signature
  const r = `0x${Array.from(signature.slice(0, 32)).map(b => b.toString(16).padStart(2, '0')).join('')}` as `0x${string}`;
  const s = `0x${Array.from(signature.slice(32, 64)).map(b => b.toString(16).padStart(2, '0')).join('')}` as `0x${string}`;

  // Register key
  const wallet = await getWalletClient(wagmiConfig, { chainId });
  if (!wallet) {
    throw new Error('Wallet client not available');
  }

  const hash = await wallet.writeContract({
    address: walletAddress,
    abi: BIOMETRIC_WALLET_ABI,
    functionName: 'registerPublicKey',
    args: [
      newPublicKey.x as `0x${string}`,
      newPublicKey.y as `0x${string}`,
      r,
      s,
      signerPublicKey.x as `0x${string}`,
      signerPublicKey.y as `0x${string}`,
      nonce,
    ],
  });

  return hash;
}

