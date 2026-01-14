'use client';

/**
 * Smart Wallet Info Dropdown
 * Displays detailed information about the user's smart wallet
 * Shows: address, balance, deployment status, gas savings, biometric info
 */

import { useState, useEffect } from 'react';
import { type Address } from 'viem';
import { usePrivyWallet } from '@/hooks/usePrivyWallet';
import { useBalance } from 'wagmi';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { formatAddress } from '@/lib/utils';
import { verifyAccountDeployment, getBaseScanUrl } from '@/lib/utils/verify-deployment';
import { LoginMethodBadge } from './login-method-badge';

export function SmartWalletInfo() {
  const {
    smartWalletAddress,
    eoaAddress,
    activeWallet,
    isSmartWalletDeployed,
    isSmartWalletReady,
    isCheckingDeployment,
  } = usePrivyWallet();

  // Use smart wallet if available, otherwise use EOA
  const displayAddress = smartWalletAddress || eoaAddress;
  const isSmartWallet = !!smartWalletAddress;

  // Get balance for the display wallet
  const { data: balanceData } = useBalance({
    address: displayAddress as `0x${string}`,
  });

  const [copied, setCopied] = useState(false);

  // Show wallet info if we have any wallet address
  if (!displayAddress) return null;

  const handleCopy = (address: Address) => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatBalance = (bal: bigint | undefined) => {
    if (!bal) return '0';
    const eth = Number(bal) / 1e18;
    return eth.toFixed(6);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="flex items-center gap-2 px-4 py-2 bg-secondary rounded-lg hover:bg-secondary/80 transition-colors">
          <div className="flex flex-col items-start">
            <span className="text-xs text-muted-foreground">
              {isSmartWallet ? 'Smart Wallet' : 'Wallet'}
            </span>
            <span className="font-mono text-sm font-medium">
              {formatAddress(displayAddress)}
            </span>
          </div>
          {isSmartWallet && isSmartWalletReady && (
            <Badge variant="default" className="bg-green-500 text-white">
              Active
            </Badge>
          )}
          {!isSmartWallet && (
            <Badge variant="secondary" className="text-xs">
              EOA
            </Badge>
          )}
        </button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl bg-black">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>{isSmartWallet ? 'Smart Wallet' : 'Wallet'} Information</span>
            {isSmartWallet && isSmartWalletReady && (
              <Badge variant="default" className="bg-green-500">Ready</Badge>
            )}
            {!isSmartWallet && (
              <Badge variant="secondary">EOA</Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Login Method */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Authenticated With
            </label>
            <LoginMethodBadge />
          </div>

          {/* Wallet Address */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              {isSmartWallet ? 'Smart Wallet Address' : 'Wallet Address'}
            </label>
            <div className="flex items-center gap-2">
              <code className="flex-1 p-3 bg-secondary rounded-lg font-mono text-sm break-all">
                {displayAddress}
              </code>
              <button
                onClick={() => handleCopy(displayAddress)}
                className="px-3 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm"
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              {isSmartWallet
                ? 'This is your smart contract wallet. Transactions can be sponsored with gasless features.'
                : 'This is your externally owned account (EOA). You control the private keys for this wallet.'}
            </p>
          </div>

          {/* Balance */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Balance</label>
            <div className="p-4 bg-secondary rounded-lg">
              <div className="text-2xl font-bold">
                {formatBalance(balanceData?.value)} ETH
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Available for transactions
              </p>
            </div>
          </div>

          {/* Deployment Status - Only show for smart wallets */}
          {isSmartWallet && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-muted-foreground">
                Deployment Status
              </label>
                {isCheckingDeployment && (
                  <span className="text-xs text-muted-foreground">
                    Checking on-chain...
                  </span>
                )}
              </div>
              <div className="space-y-2">
              <div className="flex items-center gap-2">
                  <Badge
                    variant={isSmartWalletDeployed ? 'default' : 'secondary'}
                    className={isSmartWalletDeployed ? 'bg-green-500 text-white' : 'bg-amber-500 text-white'}
                  >
                    {isCheckingDeployment
                      ? '🔍 Checking...'
                      : isSmartWalletDeployed
                      ? '✅ Deployed'
                      : '⏳ Not Deployed (Counterfactual)'}
                </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {isCheckingDeployment
                    ? 'Verifying deployment on Base blockchain...'
                    : isSmartWalletDeployed
                    ? 'Smart account contract is deployed on-chain and ready for transactions.'
                    : 'Smart account address is reserved but contract is not yet deployed.'}
                </p>
                {!isSmartWalletDeployed && !isCheckingDeployment && (
                  <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <p className="text-xs text-blue-500 mb-1">
                      💡 Account will be deployed automatically on first transaction
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Your smart account uses counterfactual deployment - the address is known before deployment.
                      The first transaction (e.g., claiming from faucet) will deploy your smart account
                      and execute the action in one UserOperation. This is normal and gas-efficient!
                    </p>
                  </div>
                )}
                <a
                  href={getBaseScanUrl(displayAddress, 8453)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                >
                  View on BaseScan →
                </a>
              </div>
            </div>
          )}

          {/* Gas Efficiency - Only for smart wallets */}
          {isSmartWallet && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                Gas Efficiency
              </label>
              <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                <div className="text-lg font-bold text-green-500">
                  Gasless Transactions
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Smart wallet transactions can be sponsored - no ETH needed for gas!
                </p>
              </div>
            </div>
          )}


          {/* EOA Info (for debugging) - Only show when there's both smart wallet and EOA */}
          {isSmartWallet && eoaAddress && smartWalletAddress !== eoaAddress && (
            <details className="space-y-2">
              <summary className="text-sm font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
                Advanced: Embedded Wallet (EOA)
              </summary>
              <div className="p-3 bg-secondary/50 rounded-lg mt-2">
                <code className="text-xs break-all">{eoaAddress}</code>
                <p className="text-xs text-muted-foreground mt-2">
                  This is your embedded wallet (EOA). It's used internally to create your smart wallet,
                  but all transactions are sent from the smart wallet above.
                </p>
              </div>
            </details>
          )}

          {/* Features - Show different features based on wallet type */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              {isSmartWallet ? 'Smart Wallet Features' : 'Wallet Features'}
            </label>
            {isSmartWallet ? (
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>Gasless transactions via paymaster sponsorship</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>Batch transactions - sign multiple actions at once</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>ERC-4337 account abstraction standard</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>Counterfactual deployment - address known before deployment</span>
                </li>
              </ul>
            ) : (
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">•</span>
                  <span>Full control of private keys</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">•</span>
                  <span>Compatible with all EVM chains</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">•</span>
                  <span>Standard Ethereum transactions</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-500 mt-0.5">⚠</span>
                  <span>Requires ETH for gas fees</span>
                </li>
              </ul>
            )}
          </div>

          {/* Security Notice */}
          <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
            <p className="text-sm font-medium text-amber-500 mb-1">Security Notice</p>
            <p className="text-xs text-muted-foreground">
              {isSmartWallet
                ? 'Your smart wallet is secured by Privy. Keep your login credentials safe and enable 2FA for maximum security.'
                : 'You control the private keys for this wallet. Never share your seed phrase or private keys with anyone.'}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Compact wallet display (for navbar)
 */
export function SmartWalletBadge() {
  const { smartWalletAddress, isSmartWalletReady } = usePrivyWallet();

  // Get balance for smart wallet
  const { data: balanceData } = useBalance({
    address: smartWalletAddress as `0x${string}`,
  });

  if (!smartWalletAddress) return null;

  const formatBalance = (bal: bigint | undefined) => {
    if (!bal) return '0';
    const eth = Number(bal) / 1e18;
    return eth < 0.0001 ? '< 0.0001' : eth.toFixed(4);
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex flex-col items-end">
        <span className="text-xs text-muted-foreground">
          {formatBalance(balanceData?.value)} ETH
        </span>
        <span className="font-mono text-xs font-medium">
          {formatAddress(smartWalletAddress)}
        </span>
      </div>
      {isSmartWalletReady && (
        <div className="w-2 h-2 bg-green-500 rounded-full" title="Smart Wallet Active" />
      )}
    </div>
  );
}
