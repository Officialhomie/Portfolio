'use client';

/**
 * Wallet Status Card
 * Always visible card showing wallet connection status, addresses, and balances
 */

import { usePrivyWallet } from '@/hooks/usePrivyWallet';
import { useBalance, useAccount } from 'wagmi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatAddress } from '@/lib/utils';
import { CheckCircle2, AlertCircle, Loader2, Copy, ExternalLink } from 'lucide-react';
import { useState } from 'react';
import { type Address } from 'viem';
import { getBaseScanUrl } from '@/lib/utils/verify-deployment';

export function WalletStatusCard() {
  const {
    smartWalletAddress,
    eoaAddress,
    isSmartWalletDeployed,
    isSmartWalletReady,
    isConnected,
    isReady,
  } = usePrivyWallet();
  
  const { chainId } = useAccount();
  
  // Fetch balances
  const { data: eoaBalance, isLoading: eoaBalanceLoading } = useBalance({
    address: eoaAddress || undefined,
    chainId: chainId || 8453,
  });
  
  const { data: smartWalletBalance, isLoading: smartWalletBalanceLoading } = useBalance({
    address: smartWalletAddress || undefined,
    chainId: chainId || 8453,
  });
  
  const [copied, setCopied] = useState<string | null>(null);

  if (!isConnected) return null;

  const handleCopy = (address: Address, label: string) => {
    navigator.clipboard.writeText(address);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const formatEth = (wei: bigint | undefined | null) => {
    if (!wei) return '0 ETH';
    const eth = Number(wei) / 1e18;
    if (eth < 0.000001) return '< 0.000001 ETH';
    return `${eth.toFixed(6)} ETH`;
  };

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            Wallet Status
            {isReady ? (
              <Badge variant="default" className="bg-green-500">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Connected
              </Badge>
            ) : (
              <Badge variant="secondary">
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                Connecting...
              </Badge>
            )}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Connection Status */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-secondary/50 rounded-lg">
            <div className="text-xs text-muted-foreground mb-1">Smart Wallet</div>
            <div className="flex items-center gap-2">
              {smartWalletAddress ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span className="text-sm font-medium text-green-500">Active</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm font-medium text-yellow-500">Not Created</span>
                </>
              )}
            </div>
            {smartWalletAddress && (
              <div className="mt-2">
                <div className="text-xs font-mono break-all">{formatAddress(smartWalletAddress)}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Balance: {smartWalletBalanceLoading ? 'Loading...' : formatEth(smartWalletBalance?.value)}
                </div>
              </div>
            )}
          </div>
          
          <div className="p-3 bg-secondary/50 rounded-lg">
            <div className="text-xs text-muted-foreground mb-1">EOA Wallet</div>
            <div className="flex items-center gap-2">
              {eoaAddress ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span className="text-sm font-medium text-green-500">Connected</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  <span className="text-sm font-medium text-red-500">Not Found</span>
                </>
              )}
            </div>
            {eoaAddress && (
              <div className="mt-2">
                <div className="text-xs font-mono break-all">{formatAddress(eoaAddress)}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Balance: {eoaBalanceLoading ? 'Loading...' : formatEth(eoaBalance?.value)}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Addresses with Copy/View buttons */}
        {eoaAddress && (
          <div className="space-y-2">
            <div className="text-xs font-medium text-muted-foreground">EOA Address</div>
            <div className="flex items-center gap-2">
              <code className="flex-1 p-2 bg-secondary rounded font-mono text-xs break-all">
                {eoaAddress}
              </code>
              <button
                onClick={() => handleCopy(eoaAddress, 'EOA')}
                className="p-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
                title="Copy EOA address"
              >
                {copied === 'EOA' ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
              <a
                href={getBaseScanUrl(eoaAddress, chainId || 8453)}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-secondary text-foreground rounded hover:bg-secondary/80 transition-colors"
                title="View on BaseScan"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        )}

        {smartWalletAddress && (
          <div className="space-y-2">
            <div className="text-xs font-medium text-muted-foreground flex items-center gap-2">
              <span>Smart Wallet Address</span>
              <Badge variant="default" className="bg-purple-500 text-xs">ERC-4337</Badge>
            </div>
            <div className="flex items-center gap-2">
              <code className="flex-1 p-2 bg-secondary rounded font-mono text-xs break-all">
                {smartWalletAddress}
              </code>
              <button
                onClick={() => handleCopy(smartWalletAddress, 'Smart')}
                className="p-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
                title="Copy smart wallet address"
              >
                {copied === 'Smart' ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
              <a
                href={getBaseScanUrl(smartWalletAddress, chainId || 8453)}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-secondary text-foreground rounded hover:bg-secondary/80 transition-colors"
                title="View on BaseScan"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground">Deployment:</span>
              {isSmartWalletDeployed ? (
                <Badge variant="default" className="bg-green-500 text-xs">Deployed</Badge>
              ) : (
                <Badge variant="secondary" className="text-xs">Counterfactual</Badge>
              )}
            </div>
          </div>
        )}

        {/* Status Messages */}
        {!smartWalletAddress && eoaAddress && (
          <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
              <div className="text-xs">
                <p className="font-medium text-yellow-500 mb-1">Smart Wallet Not Created</p>
                <p className="text-muted-foreground">
                  Privy will automatically create a smart wallet on your first transaction. 
                  Currently using EOA wallet for transactions.
                </p>
              </div>
            </div>
          </div>
        )}

        {smartWalletAddress && eoaAddress && (
          <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <div className="text-xs text-muted-foreground">
              <p className="font-medium text-blue-500 mb-1">How It Works:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Your EOA wallet controls your smart wallet</li>
                <li>When registered, tokens are minted to your EOA address</li>
                <li>Transactions are sent from your smart wallet address</li>
                <li>Both addresses work together seamlessly</li>
              </ul>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}


