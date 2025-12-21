/**
 * useSmartContract Hook
 * Generic hook for interacting with smart contracts via smart account
 */

import { useCallback } from 'react';
import type { 
  Address, 
  Abi,
  ContractFunctionName,
  ContractFunctionArgs,
  ReadContractReturnType,
  EncodeFunctionDataParameters,
} from 'viem';
import { encodeFunctionData } from 'viem';
import { useSmartWallet } from '@/contexts/SmartWalletContext';

/**
 * Generic hook for smart contract interactions
 */
export function useSmartContract<TAbi extends Abi>(
  address: Address,
  abi: TAbi
) {
  const { sendTransaction } = useSmartWallet();

  /**
   * Write to a contract function
   */
  const write = useCallback(
    async <
      TFunctionName extends ContractFunctionName<TAbi, 'nonpayable' | 'payable'>
    >(
      functionName: TFunctionName,
      ...args: ContractFunctionArgs<TAbi, 'nonpayable' | 'payable', TFunctionName> extends readonly unknown[]
        ? ContractFunctionArgs<TAbi, 'nonpayable' | 'payable', TFunctionName>
        : []
    ) => {
      // Use viem's encodeFunctionData with proper typing
      // We use a type-safe approach that works with viem's complex type system
      const data = encodeFunctionData({
        abi,
        functionName,
        args,
      } as Parameters<typeof encodeFunctionData>[0]);

      return await sendTransaction({
        to: address,
        data,
        value: 0n,
      });
    },
    [address, abi, sendTransaction]
  );

  /**
   * Read from a contract function
   * Note: This uses the public client, not the executor
   */
  const read = useCallback(
    async <
      TFunctionName extends ContractFunctionName<TAbi, 'view' | 'pure'>
    >(
      functionName: TFunctionName,
      ...args: ContractFunctionArgs<TAbi, 'view' | 'pure', TFunctionName> extends readonly unknown[]
        ? ContractFunctionArgs<TAbi, 'view' | 'pure', TFunctionName>
        : []
    ): Promise<ReadContractReturnType<TAbi, TFunctionName>> => {
      // For reading, we need a public client
      // This is a simplified version - in production, you'd inject the public client
      const { createPublicClient, http } = await import('viem');
      const { base } = await import('viem/chains');
      
      const publicClient = createPublicClient({
        chain: base,
        transport: http(),
      });

      return await publicClient.readContract({
        address,
        abi,
        functionName,
        args: args as ContractFunctionArgs<TAbi, 'view' | 'pure', TFunctionName>,
      });
    },
    [address, abi]
  );

  return { write, read };
}
