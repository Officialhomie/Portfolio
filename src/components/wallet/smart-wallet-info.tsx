'use client';

/**
 * Smart Wallet Info Dropdown
 * Displays detailed information about the user's smart wallet
 * Shows: address, balance, deployment status, gas savings, biometric info
 */

import { useState, useEffect } from 'react';
import { type Address } from 'viem';
import { useSmartWallet } from '@/contexts/SmartWalletContext';
import { useFusakaDetection } from '@/hooks/useFusakaDetection';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { formatAddress } from '@/lib/utils';
import { verifyAccountDeployment, getBaseScanUrl } from '@/lib/utils/verify-deployment';

export function SmartWalletInfo() {
  const {
    smartWalletAddress,
    eoaAddress,
    balance,
    isSmartWalletDeployed,
    isSmartWalletReady,
    estimatedGasSavings,
  } = useSmartWallet();

  const fusaka = useFusakaDetection();
  const [copied, setCopied] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [deploymentStatus, setDeploymentStatus] = useState<{
    deployed: boolean;
    codeLength: number;
    details: string;
  } | null>(null);

  // Verify deployment status on mount and when address changes
  useEffect(() => {
    if (smartWalletAddress) {
      verifyDeployment();
    }
  }, [smartWalletAddress]);

  const verifyDeployment = async () => {
    if (!smartWalletAddress) return;
    setVerifying(true);
    try {
      const status = await verifyAccountDeployment(smartWalletAddress, 8453);
      setDeploymentStatus(status);
    } catch (error) {
      console.error('Error verifying deployment:', error);
    } finally {
      setVerifying(false);
    }
  };

  if (!smartWalletAddress) return null;

  const handleCopy = (address: Address) => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatBalance = (bal: bigint | null) => {
    if (bal === null) return '0';
    const eth = Number(bal) / 1e18;
    return eth.toFixed(6);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="flex items-center gap-2 px-4 py-2 bg-secondary rounded-lg hover:bg-secondary/80 transition-colors">
          <div className="flex flex-col items-start">
            <span className="text-xs text-muted-foreground">Smart Wallet</span>
            <span className="font-mono text-sm font-medium">
              {formatAddress(smartWalletAddress)}
            </span>
          </div>
          {isSmartWalletReady && (
            <Badge variant="default" className="bg-green-500 text-white">
              Active
            </Badge>
          )}
        </button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>Smart Wallet Information</span>
            {isSmartWalletReady && (
              <Badge variant="default" className="bg-green-500">Ready</Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Smart Wallet Address */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Smart Wallet Address
            </label>
            <div className="flex items-center gap-2">
              <code className="flex-1 p-3 bg-secondary rounded-lg font-mono text-sm break-all">
                {smartWalletAddress}
              </code>
              <button
                onClick={() => handleCopy(smartWalletAddress)}
                className="px-3 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm"
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              This is your smart contract wallet. All transactions are signed with Face ID/Touch ID.
            </p>
          </div>

          {/* Balance */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Balance</label>
            <div className="p-4 bg-secondary rounded-lg">
              <div className="text-2xl font-bold">
                {formatBalance(balance)} ETH
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Available for transactions
              </p>
            </div>
          </div>

          {/* Deployment Status */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-muted-foreground">
                Deployment Status
              </label>
              <button
                onClick={verifyDeployment}
                disabled={verifying}
                className="text-xs text-primary hover:underline disabled:opacity-50"
              >
                {verifying ? 'Checking...' : 'Refresh'}
              </button>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge 
                  variant={
                    (deploymentStatus?.deployed || isSmartWalletDeployed) 
                      ? 'default' 
                      : 'secondary'
                  }
                  className={
                    (deploymentStatus?.deployed || isSmartWalletDeployed)
                      ? 'bg-green-500 text-white'
                      : ''
                  }
                >
                  {(deploymentStatus?.deployed || isSmartWalletDeployed) 
                    ? '✅ Deployed' 
                    : '⏳ Not Deployed'}
                </Badge>
                {deploymentStatus && (
                  <span className="text-xs text-muted-foreground">
                    Code: {deploymentStatus.codeLength} bytes
                  </span>
                )}
              </div>
              {deploymentStatus && (
                <p className="text-xs text-muted-foreground">
                  {deploymentStatus.details}
                </p>
              )}
              {!isSmartWalletDeployed && !deploymentStatus?.deployed && (
                <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <p className="text-xs text-blue-500 mb-1">
                    💡 Account will be deployed automatically on first transaction
                  </p>
                  <p className="text-xs text-muted-foreground">
                    The first transaction (e.g., claiming from faucet) will deploy your smart account
                    and execute the action in one step. Pimlico will sponsor the gas costs!
                  </p>
                </div>
              )}
              <a
                href={getBaseScanUrl(smartWalletAddress, 8453)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline inline-flex items-center gap-1"
              >
                View on BaseScan →
              </a>
            </div>
          </div>

          {/* Gas Savings */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Gas Efficiency
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                <div className="text-2xl font-bold text-green-500">
                  {estimatedGasSavings}%
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Gas Savings vs EOA
                </p>
              </div>
              {fusaka?.hasPrecompile && (
                <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <div className="text-2xl font-bold text-blue-500">
                    ~{fusaka.estimatedGas} gas
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Per Signature
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Biometric Info */}
          {fusaka?.hasPrecompile && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                Biometric Authentication
              </label>
              <div className="p-4 bg-secondary rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">EIP-7951 Precompile</span>
                  <Badge variant="default" className="bg-green-500">Enabled</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Signature Type</span>
                  <code className="text-xs bg-background px-2 py-1 rounded">secp256r1</code>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Authentication</span>
                  <span className="text-xs">Face ID / Touch ID</span>
                </div>
              </div>
            </div>
          )}

          {/* EOA Info (for debugging) */}
          {eoaAddress && (
            <details className="space-y-2">
              <summary className="text-sm font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
                Advanced: Connected EOA (Hidden from user)
              </summary>
              <div className="p-3 bg-secondary/50 rounded-lg mt-2">
                <code className="text-xs break-all">{eoaAddress}</code>
                <p className="text-xs text-muted-foreground mt-2">
                  This is your original wallet (EOA). It's used internally to create your smart wallet,
                  but all transactions are sent from the smart wallet above.
                </p>
              </div>
            </details>
          )}

          {/* Features */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Smart Wallet Features
            </label>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✓</span>
                <span>Biometric signatures (Face ID/Touch ID) - no seed phrase needed</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✓</span>
                <span>75.6% lower gas costs vs traditional wallets</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✓</span>
                <span>Batch transactions - sign multiple actions at once</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✓</span>
                <span>EIP-7951 precompile support for ultra-low gas</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✓</span>
                <span>ERC-4337 account abstraction standard</span>
              </li>
            </ul>
          </div>

          {/* Security Notice */}
          <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
            <p className="text-sm font-medium text-amber-500 mb-1">Security Notice</p>
            <p className="text-xs text-muted-foreground">
              Your biometric credentials are stored securely in your device's secure enclave.
              They never leave your device. This wallet is tied to your current device - if you
              switch devices, you'll need to register biometric authentication again.
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
  const { smartWalletAddress, isSmartWalletReady, balance } = useSmartWallet();

  if (!smartWalletAddress) return null;

  const formatBalance = (bal: bigint | null) => {
    if (bal === null) return '0';
    const eth = Number(bal) / 1e18;
    return eth < 0.0001 ? '< 0.0001' : eth.toFixed(4);
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex flex-col items-end">
        <span className="text-xs text-muted-foreground">
          {formatBalance(balance)} ETH
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
