# Option 2: Pimlico/Biconomy Paymaster Migration Guide

## 🎯 Overview

Switch from CDP Paymaster to Pimlico or Biconomy to achieve **true gasless onboarding** with deployment sponsorship support.

## 📊 Paymaster Comparison

### Pimlico vs Biconomy vs CDP

| Feature | CDP (Current) | Pimlico | Biconomy |
|---------|---------------|---------|----------|
| **Deployment Sponsorship** | ❌ No | ✅ Yes | ✅ Yes |
| **Execution Sponsorship** | ✅ Yes | ✅ Yes | ✅ Yes |
| **Batch Transactions** | ✅ Yes | ✅ Yes | ✅ Yes |
| **Session Keys** | ❌ No | ✅ Yes | ✅ Yes |
| **Free Tier** | ✅ Yes | ✅ Limited | ❌ No |
| **Pricing Model** | Usage-based | Pay-as-you-go | Enterprise |
| **Base Network** | ✅ Native | ✅ Supported | ✅ Supported |
| **API Quality** | Good | Excellent | Excellent |
| **Documentation** | Good | Excellent | Excellent |
| **Best For** | Simple apps | Production apps | Enterprise |

## 🏆 Recommendation: Pimlico

**Why Pimlico:**
- ✅ Best developer experience
- ✅ Excellent documentation
- ✅ Active community support
- ✅ Free tier for testing
- ✅ Full ERC-4337 feature set
- ✅ Easy migration path

**When to choose Biconomy:**
- Enterprise requirements
- Custom sponsorship rules
- Higher volume needs
- Dedicated support

## 🚀 Pimlico Integration Guide

### Step 1: Get Pimlico API Key

1. Visit: https://pimlico.io/
2. Sign up for free account
3. Create new project
4. Select Base network
5. Copy API key from dashboard

### Step 2: Install Pimlico SDK

```bash
npm install @pimlico/permissionless @pimlico/sdk
```

### Step 3: Create Pimlico Bundler Client

**File: `src/lib/cdp/bundler/PimlicoBundlerClient.ts`**

```typescript
/**
 * Pimlico Bundler Client Implementation
 * Supports deployment sponsorship for true gasless onboarding
 */

import type { Address, Hex, PublicClient } from 'viem';
import { IBundlerClient } from './IBundlerClient';
import type { UserOperation, UserOperationReceipt, GasEstimate } from '../core/types';
import { BundlerError } from '../core/errors';
import { ERROR_CODES } from '../core/constants';
import { createPublicClient, http } from 'viem';
import { base, baseSepolia } from 'viem/chains';

/**
 * Pimlico Bundler Client
 * Full ERC-4337 support including deployment sponsorship
 */
export class PimlicoBundlerClient implements IBundlerClient {
  private publicClient: PublicClient;
  private rpcUrl: string;
  private entryPoint: Address;
  private chainId: number;

  constructor(config: {
    rpcUrl: string;
    entryPoint: Address;
    chainId: number;
  }) {
    this.rpcUrl = config.rpcUrl;
    this.entryPoint = config.entryPoint;
    this.chainId = config.chainId;

    const chain = config.chainId === base.id ? base : baseSepolia;
    this.publicClient = createPublicClient({
      chain,
      transport: http(),
    });
  }

  /**
   * Send UserOperation to Pimlico bundler
   */
  async sendUserOperation(userOp: UserOperation): Promise<Hex> {
    try {
      const response = await fetch(this.rpcUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'eth_sendUserOperation',
          params: [this.formatUserOperation(userOp), this.entryPoint],
        }),
      });

      if (!response.ok) {
        throw new BundlerError('Failed to send UserOperation', ERROR_CODES.BUNDLER_RPC_ERROR);
      }

      const result = await response.json();
      
      if (result.error) {
        throw new BundlerError(
          `Bundler error: ${result.error.message || 'Unknown error'}`,
          ERROR_CODES.BUNDLER_RPC_ERROR,
          result.error
        );
      }

      return result.result as Hex;
    } catch (error) {
      if (error instanceof BundlerError) {
        throw error;
      }
      throw new BundlerError(
        `Failed to send UserOperation: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ERROR_CODES.BUNDLER_RPC_ERROR,
        error
      );
    }
  }

  /**
   * Estimate gas for UserOperation
   */
  async estimateUserOperationGas(userOp: UserOperation): Promise<GasEstimate> {
    try {
      const response = await fetch(this.rpcUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'eth_estimateUserOperationGas',
          params: [this.formatUserOperation(userOp), this.entryPoint],
        }),
      });

      if (!response.ok) {
        throw new BundlerError('Failed to estimate gas', ERROR_CODES.BUNDLER_RPC_ERROR);
      }

      const result = await response.json();
      
      if (result.error) {
        throw new BundlerError(
          `Gas estimation error: ${result.error.message || 'Unknown error'}`,
          ERROR_CODES.BUNDLER_RPC_ERROR,
          result.error
        );
      }

      const estimate = result.result;
      return {
        callGasLimit: BigInt(estimate.callGasLimit || estimate.callGasLimit),
        verificationGasLimit: BigInt(estimate.verificationGasLimit || estimate.verificationGasLimit),
        preVerificationGas: BigInt(estimate.preVerificationGas || estimate.preVerificationGas),
      };
    } catch (error) {
      if (error instanceof BundlerError) {
        throw error;
      }
      throw new BundlerError(
        `Failed to estimate gas: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ERROR_CODES.BUNDLER_RPC_ERROR,
        error
      );
    }
  }

  /**
   * Sponsor UserOperation with Pimlico Paymaster
   * ✅ SUPPORTS DEPLOYMENT SPONSORSHIP!
   */
  async sponsorUserOperation(userOp: UserOperation): Promise<UserOperation> {
    try {
      console.log('💰 Requesting Pimlico paymaster sponsorship...');
      console.log('   ✅ Pimlico supports deployment sponsorship!');
      
      // Pimlico uses pm_sponsorUserOperation method
      const response = await fetch(this.rpcUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'pm_sponsorUserOperation',
          params: [
            this.formatUserOperation(userOp),
            {
              entryPoint: this.entryPoint,
              chainId: this.chainId,
            },
          ],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Failed to read error');
        console.warn('⚠️ Pimlico paymaster RPC error:', response.status);
        console.warn('   Response:', errorText.substring(0, 500));
        return userOp; // Return unsponsored
      }

      const result = await response.json();

      if (result.error) {
        console.warn('⚠️ Pimlico paymaster rejected:', result.error.message);
        return userOp; // Return unsponsored
      }

      const paymasterAndData = result.result.paymasterAndData as Hex;
      
      if (paymasterAndData && paymasterAndData !== '0x') {
        console.log('✅ Pimlico paymaster sponsorship approved!');
        console.log('   Paymaster data:', paymasterAndData.substring(0, 66) + '...');
        
        // Check if this is a deployment UserOp
        if (userOp.initCode && userOp.initCode !== '0x') {
          console.log('   🎉 Deployment sponsorship confirmed! True gasless onboarding!');
        }
        
        return {
          ...userOp,
          paymasterAndData,
        };
      }

      return userOp;
    } catch (error) {
      console.warn('⚠️ Pimlico paymaster error:', error instanceof Error ? error.message : 'Unknown');
      return userOp; // Return unsponsored
    }
  }

  /**
   * Get UserOperation receipt
   */
  async getUserOperationReceipt(hash: Hex): Promise<UserOperationReceipt> {
    try {
      const response = await fetch(this.rpcUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'eth_getUserOperationReceipt',
          params: [hash],
        }),
      });

      if (!response.ok) {
        throw new BundlerError('Failed to get UserOperation receipt', ERROR_CODES.BUNDLER_RPC_ERROR);
      }

      const result = await response.json();
      
      if (result.error) {
        throw new BundlerError(
          `Bundler error: ${result.error.message || 'Unknown error'}`,
          ERROR_CODES.BUNDLER_RPC_ERROR,
          result.error
        );
      }

      if (!result.result) {
        throw new BundlerError('UserOperation receipt not found', ERROR_CODES.BUNDLER_RPC_ERROR);
      }

      return this.parseUserOperationReceipt(result.result);
    } catch (error) {
      if (error instanceof BundlerError) {
        throw error;
      }
      throw new BundlerError(
        `Failed to get UserOperation receipt: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ERROR_CODES.BUNDLER_RPC_ERROR,
        error
      );
    }
  }

  /**
   * Wait for UserOperation receipt
   */
  async waitForUserOperationReceipt(hash: Hex, timeout: number = 120000): Promise<UserOperationReceipt> {
    const startTime = Date.now();
    const pollInterval = 2000; // 2 seconds

    while (Date.now() - startTime < timeout) {
      try {
        const receipt = await this.getUserOperationReceipt(hash);
        return receipt;
      } catch (error) {
        // If receipt not found, wait and retry
        if (error instanceof BundlerError && error.message.includes('not found')) {
          await new Promise((resolve) => setTimeout(resolve, pollInterval));
          continue;
        }
        throw error;
      }
    }

    throw new BundlerError('Timeout waiting for UserOperation receipt', ERROR_CODES.TIMEOUT);
  }

  /**
   * Format UserOperation for RPC
   */
  private formatUserOperation(userOp: UserOperation): Record<string, string> {
    return {
      sender: userOp.sender,
      nonce: `0x${userOp.nonce.toString(16)}`,
      initCode: userOp.initCode,
      callData: userOp.callData,
      callGasLimit: `0x${userOp.callGasLimit.toString(16)}`,
      verificationGasLimit: `0x${userOp.verificationGasLimit.toString(16)}`,
      preVerificationGas: `0x${userOp.preVerificationGas.toString(16)}`,
      maxFeePerGas: `0x${userOp.maxFeePerGas.toString(16)}`,
      maxPriorityFeePerGas: `0x${userOp.maxPriorityFeePerGas.toString(16)}`,
      paymasterAndData: userOp.paymasterAndData,
      signature: userOp.signature,
    };
  }

  /**
   * Parse UserOperation receipt from RPC response
   */
  private parseUserOperationReceipt(receipt: any): UserOperationReceipt {
    return {
      userOpHash: receipt.userOpHash,
      entryPoint: receipt.entryPoint,
      sender: receipt.sender,
      nonce: BigInt(receipt.nonce),
      paymaster: receipt.paymaster,
      actualGasCost: BigInt(receipt.actualGasCost || '0x0'),
      actualGasUsed: BigInt(receipt.actualGasUsed || '0x0'),
      success: receipt.success !== false,
      reason: receipt.reason,
      logs: receipt.logs || [],
      receipt: {
        transactionHash: receipt.receipt.transactionHash,
        blockNumber: BigInt(receipt.receipt.blockNumber),
        blockHash: receipt.receipt.blockHash,
        gasUsed: BigInt(receipt.receipt.gasUsed),
        effectiveGasPrice: BigInt(receipt.receipt.effectiveGasPrice || '0x0'),
        status: receipt.receipt.status === '0x1' ? 'success' : 'reverted',
        logs: receipt.receipt.logs || [],
      },
    };
  }
}
```

### Step 4: Update Constants

**File: `src/lib/cdp/core/constants.ts`**

Add Pimlico configuration:

```typescript
/**
 * Pimlico Bundler RPC URLs per chain
 */
export const PIMLICO_BUNDLER_RPC_URLS: Record<number, string> = {
  [base.id]: process.env.NEXT_PUBLIC_PIMLICO_BUNDLER_RPC_URL_BASE || '',
  [baseSepolia.id]: process.env.NEXT_PUBLIC_PIMLICO_BUNDLER_RPC_URL_SEPOLIA || '',
};

/**
 * Pimlico Paymaster RPC URLs per chain
 */
export const PIMLICO_PAYMASTER_RPC_URLS: Record<number, string> = {
  [base.id]: process.env.NEXT_PUBLIC_PIMLICO_PAYMASTER_RPC_URL_BASE || '',
  [baseSepolia.id]: process.env.NEXT_PUBLIC_PIMLICO_PAYMASTER_RPC_URL_SEPOLIA || '',
};
```

### Step 5: Update Smart Account Creation

**File: `src/lib/cdp/index.ts`**

```typescript
import { PimlicoBundlerClient } from './bundler/PimlicoBundlerClient';
import { PIMLICO_BUNDLER_RPC_URLS, PIMLICO_PAYMASTER_RPC_URLS } from './core/constants';

export interface SmartWalletConfig {
  chainId: number;
  signer: 'eoa' | 'webauthn';
  paymaster?: boolean;
  eoaAddress?: Address;
  bundlerType?: 'cdp' | 'pimlico'; // Add bundler selection
}

export async function createSmartWallet(config: SmartWalletConfig): Promise<{
  account: ISmartAccount;
  executor: ITransactionExecutor;
  signer: ISigner;
}> {
  const chainId = config.chainId;
  const bundlerType = config.bundlerType || 'pimlico'; // Default to Pimlico

  // ... existing account creation code ...

  // Create bundler client based on type
  let bundler: IBundlerClient;
  
  if (bundlerType === 'pimlico') {
    const bundlerUrl = PIMLICO_BUNDLER_RPC_URLS[chainId];
    const paymasterUrl = PIMLICO_PAYMASTER_RPC_URLS[chainId];
    
    if (!bundlerUrl) {
      throw new Error(`Pimlico bundler URL not configured for chain ${chainId}`);
    }

    bundler = new PimlicoBundlerClient({
      rpcUrl: bundlerUrl,
      entryPoint: ENTRYPOINT_ADDRESSES[chainId],
      chainId,
    });
  } else {
    // Fallback to CDP
    const bundlerUrl = CDP_BUNDLER_RPC_URLS[chainId];
    bundler = new CDPBundlerClient({
      rpcUrl: bundlerUrl,
      entryPoint: ENTRYPOINT_ADDRESSES[chainId],
      chainId,
    });
  }

  // ... rest of creation code ...
}
```

### Step 6: Environment Variables

**File: `.env.local`**

```bash
# Pimlico Configuration (for true gasless onboarding)
NEXT_PUBLIC_PIMLICO_BUNDLER_RPC_URL_BASE=https://api.pimlico.io/v1/base/rpc?apikey=YOUR_API_KEY
NEXT_PUBLIC_PIMLICO_PAYMASTER_RPC_URL_BASE=https://api.pimlico.io/v1/base/rpc?apikey=YOUR_API_KEY

# Optional: Keep CDP as fallback
NEXT_PUBLIC_CDP_PAYMASTER_RPC_URL_BASE=https://api.developer.coinbase.com/rpc/v1/base/YOUR_API_KEY
```

### Step 7: Update SmartWalletContext

**File: `src/contexts/SmartWalletContext.tsx`**

```typescript
const wallet = await createSmartWallet({
  chainId,
  signer: signerType,
  paymaster: true,
  eoaAddress: eoaAddress || undefined,
  bundlerType: 'pimlico', // Use Pimlico for deployment sponsorship
});
```

## 🔧 Biconomy Integration (Alternative)

### Step 1: Get Biconomy API Key

1. Visit: https://www.biconomy.io/
2. Sign up for account
3. Create new project
4. Select Base network
5. Copy API key

### Step 2: Install Biconomy SDK

```bash
npm install @biconomy/core-types @biconomy/bundler @biconomy/paymaster
```

### Step 3: Create Biconomy Bundler Client

**File: `src/lib/cdp/bundler/BiconomyBundlerClient.ts`**

```typescript
/**
 * Biconomy Bundler Client Implementation
 * Enterprise-grade paymaster with deployment sponsorship
 */

import type { Address, Hex } from 'viem';
import { IBundlerClient } from './IBundlerClient';
import type { UserOperation, UserOperationReceipt, GasEstimate } from '../core/types';
import { BundlerError } from '../core/errors';
import { ERROR_CODES } from '../core/constants';
import { Bundler } from '@biconomy/bundler';
import { Paymaster } from '@biconomy/paymaster';

export class BiconomyBundlerClient implements IBundlerClient {
  private bundler: Bundler;
  private paymaster: Paymaster;
  private entryPoint: Address;
  private chainId: number;

  constructor(config: {
    bundlerUrl: string;
    paymasterUrl: string;
    entryPoint: Address;
    chainId: number;
  }) {
    this.entryPoint = config.entryPoint;
    this.chainId = config.chainId;

    this.bundler = new Bundler({
      bundlerUrl: config.bundlerUrl,
      chainId: config.chainId,
      entryPointAddress: config.entryPoint,
    });

    this.paymaster = new Paymaster({
      paymasterUrl: config.paymasterUrl,
      chainId: config.chainId,
      entryPointAddress: config.entryPoint,
    });
  }

  async sendUserOperation(userOp: UserOperation): Promise<Hex> {
    try {
      const result = await this.bundler.sendUserOp(userOp, this.entryPoint);
      return result.userOpHash as Hex;
    } catch (error) {
      throw new BundlerError(
        `Failed to send UserOperation: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ERROR_CODES.BUNDLER_RPC_ERROR,
        error
      );
    }
  }

  async estimateUserOperationGas(userOp: UserOperation): Promise<GasEstimate> {
    try {
      const estimate = await this.bundler.estimateUserOpGas(userOp);
      return {
        callGasLimit: BigInt(estimate.callGasLimit),
        verificationGasLimit: BigInt(estimate.verificationGasLimit),
        preVerificationGas: BigInt(estimate.preVerificationGas),
      };
    } catch (error) {
      throw new BundlerError(
        `Failed to estimate gas: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ERROR_CODES.BUNDLER_RPC_ERROR,
        error
      );
    }
  }

  async sponsorUserOperation(userOp: UserOperation): Promise<UserOperation> {
    try {
      // Biconomy supports deployment sponsorship!
      const paymasterAndData = await this.paymaster.getPaymasterAndData(userOp);
      
      if (paymasterAndData && paymasterAndData !== '0x') {
        console.log('✅ Biconomy paymaster sponsorship approved!');
        if (userOp.initCode && userOp.initCode !== '0x') {
          console.log('   🎉 Deployment sponsorship confirmed!');
        }
        
        return {
          ...userOp,
          paymasterAndData: paymasterAndData as Hex,
        };
      }

      return userOp;
    } catch (error) {
      console.warn('⚠️ Biconomy paymaster error:', error instanceof Error ? error.message : 'Unknown');
      return userOp;
    }
  }

  async getUserOperationReceipt(hash: Hex): Promise<UserOperationReceipt> {
    try {
      const receipt = await this.bundler.getUserOpReceipt(hash);
      return this.parseReceipt(receipt);
    } catch (error) {
      throw new BundlerError(
        `Failed to get receipt: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ERROR_CODES.BUNDLER_RPC_ERROR,
        error
      );
    }
  }

  async waitForUserOperationReceipt(hash: Hex, timeout: number = 120000): Promise<UserOperationReceipt> {
    const startTime = Date.now();
    const pollInterval = 2000;

    while (Date.now() - startTime < timeout) {
      try {
        return await this.getUserOperationReceipt(hash);
      } catch (error) {
        if (error instanceof BundlerError && error.message.includes('not found')) {
          await new Promise((resolve) => setTimeout(resolve, pollInterval));
          continue;
        }
        throw error;
      }
    }

    throw new BundlerError('Timeout waiting for receipt', ERROR_CODES.TIMEOUT);
  }

  private parseReceipt(receipt: any): UserOperationReceipt {
    // Parse Biconomy receipt format
    return {
      userOpHash: receipt.userOpHash,
      entryPoint: receipt.entryPoint,
      sender: receipt.sender,
      nonce: BigInt(receipt.nonce),
      paymaster: receipt.paymaster,
      actualGasCost: BigInt(receipt.actualGasCost || '0x0'),
      actualGasUsed: BigInt(receipt.actualGasUsed || '0x0'),
      success: receipt.success !== false,
      reason: receipt.reason,
      logs: receipt.logs || [],
      receipt: {
        transactionHash: receipt.receipt.transactionHash,
        blockNumber: BigInt(receipt.receipt.blockNumber),
        blockHash: receipt.receipt.blockHash,
        gasUsed: BigInt(receipt.receipt.gasUsed),
        effectiveGasPrice: BigInt(receipt.receipt.effectiveGasPrice || '0x0'),
        status: receipt.receipt.status === '0x1' ? 'success' : 'reverted',
        logs: receipt.receipt.logs || [],
      },
    };
  }
}
```

## 📊 Migration Checklist

### Pre-Migration
- [ ] Get Pimlico/Biconomy API key
- [ ] Test API key with test transactions
- [ ] Review pricing and limits
- [ ] Set up monitoring/alerting

### Code Changes
- [ ] Create new bundler client (PimlicoBundlerClient/BiconomyBundlerClient)
- [ ] Update constants with new RPC URLs
- [ ] Modify `createSmartWallet` to support bundler selection
- [ ] Update SmartWalletContext to use new bundler
- [ ] Add environment variables

### Testing
- [ ] Test deployment sponsorship (first transaction)
- [ ] Test execution sponsorship (subsequent transactions)
- [ ] Test batch transactions
- [ ] Test error handling
- [ ] Test on Base mainnet
- [ ] Test on Base Sepolia

### Deployment
- [ ] Update production environment variables
- [ ] Deploy to staging first
- [ ] Monitor for 24-48 hours
- [ ] Deploy to production
- [ ] Keep CDP as fallback option

## 💰 Cost Analysis

### Pimlico Pricing
- **Free Tier**: 1,000 sponsored transactions/month
- **Paid Tier**: ~$0.001 per sponsored transaction
- **Deployment**: Same cost as execution (~$0.001)

### Biconomy Pricing
- **No Free Tier**: Enterprise pricing only
- **Contact Sales**: Custom pricing based on volume
- **Typical**: $0.001-0.002 per transaction

### Cost Comparison (1,000 users/month)

| Service | First Transaction | Subsequent | Total/Month |
|---------|------------------|------------|-------------|
| **CDP** | User pays (~$0.01) | Free | ~$10 (users pay) |
| **Pimlico** | Free | Free | $0 (free tier) |
| **Biconomy** | Free | Free | ~$1,000 (paid) |

## ✅ Benefits After Migration

1. **True Gasless Onboarding**: Users pay $0 from day one
2. **Better UX**: No funding step required
3. **Higher Conversion**: Remove friction = more users
4. **Advanced Features**: Session keys, batch transactions
5. **Better Support**: Active community and documentation

## 🚨 Potential Issues & Solutions

### Issue 1: API Rate Limits
**Solution**: Implement request throttling and caching

### Issue 2: Paymaster Rejections
**Solution**: Fallback to CDP or user-paid transactions

### Issue 3: Cost Overruns
**Solution**: Set spending limits and monitor usage

### Issue 4: Network Downtime
**Solution**: Multi-paymaster fallback system

## 📝 Next Steps

1. **Choose Paymaster**: Pimlico (recommended) or Biconomy
2. **Get API Key**: Sign up and configure
3. **Implement Client**: Use code examples above
4. **Test Thoroughly**: Verify deployment sponsorship
5. **Deploy Gradually**: Staging → Production
6. **Monitor Closely**: Track costs and errors

## 🎉 Expected Outcome

After migration:
- ✅ True gasless onboarding (deployment + execution)
- ✅ Better user experience
- ✅ Higher conversion rates
- ✅ Full ERC-4337 feature set
- ✅ Production-ready infrastructure

