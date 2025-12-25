'use client';

/**
 * Faucet Claim Component
 * Allows users to claim HOMIE tokens
 */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { usePortfolioToken, useClaimFaucet } from '@/hooks/contracts/usePortfolioToken';
import { usePrivyWallet } from '@/hooks/usePrivyWallet';
import { useAccount } from 'wagmi';
import { Loader2, AlertCircle, CheckCircle, ExternalLink } from 'lucide-react';
import { TokenBalanceDisplay } from '@/components/wallet/token-balance-display';

export function FaucetClaim() {
  const { isConnected } = useAccount();
  const { balance, canClaimFaucet, timeUntilClaim, faucetAmount, isLoading: balanceLoading } = usePortfolioToken();
  const { claimFaucet, isPending, isConfirming, isSuccess, error: claimError, txHash } = useClaimFaucet();
  const { smartWalletAddress, isSmartWalletReady } = usePrivyWallet();

  const handleClaim = async () => {
    try {
      await claimFaucet();
    } catch (error) {
      console.error('Faucet claim failed:', error);
    }
  };

  const isLoading = isPending || isConfirming || balanceLoading;
  
  // Format time until claim
  const formatTimeUntilClaim = (seconds: number): string => {
    if (seconds <= 0) return '';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };
  
  const timeUntilClaimFormatted = formatTimeUntilClaim(timeUntilClaim);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Claim Tokens</CardTitle>
        <CardDescription>
          Get {faucetAmount} $HOMIE tokens to participate in voting (one-time claim with 24h cooldown)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Balance */}
        <div className="text-center py-6 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground mb-2">Your Balance</p>
          <p className="text-4xl font-bold">{balance} $HOMIE</p>
        </div>

        {/* Claim Section */}
        {!isConnected ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              Connect your wallet to claim tokens
            </p>
          </div>
        ) : claimError ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Claim Failed</AlertTitle>
            <AlertDescription>
              {claimError.message || 'Failed to claim tokens. Please try again.'}
            </AlertDescription>
          </Alert>
        ) : isSuccess ? (
          <div className="space-y-4">
            <div className="text-center py-8 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center justify-center gap-2 mb-3">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                <p className="text-green-800 dark:text-green-200 font-medium">
                  Successfully claimed {faucetAmount} $HOMIE!
                </p>
              </div>
              <p className="text-sm text-green-700 dark:text-green-300 mb-4">
                Tokens have been added to your balance
              </p>

              {/* Transaction Hash */}
              {txHash && (
                <div className="mt-4 p-3 bg-white dark:bg-gray-800 rounded-lg border border-green-300 dark:border-green-700">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 font-medium">
                    Transaction Hash:
                  </p>
                  <a
                    href={`https://basescan.org/tx/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline break-all font-mono"
                  >
                    <span>{txHash.slice(0, 16)}...{txHash.slice(-14)}</span>
                    <ExternalLink className="h-3 w-3 flex-shrink-0" />
                  </a>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Click to verify on BaseScan
                  </p>
                </div>
              )}
            </div>

            {/* Updated Token Balance */}
            <TokenBalanceDisplay />
          </div>
        ) : canClaimFaucet ? (
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-4">
                You can claim {faucetAmount} $HOMIE tokens
              </p>
            </div>
            <Button
              onClick={handleClaim}
              disabled={isLoading || !canClaimFaucet}
              className="w-full"
              size="lg"
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              {isPending && 'Claiming...'}
              {isConfirming && 'Confirming...'}
              {!isLoading && `Claim ${faucetAmount} $HOMIE`}
            </Button>
          </div>
        ) : (
          <div className="text-center py-8 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <p className="text-yellow-800 dark:text-yellow-200 font-medium mb-2">
              Already Claimed
            </p>
            {timeUntilClaim > 0 ? (
              <div className="space-y-2">
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  You've already claimed from the faucet.
                </p>
                <p className="text-base font-semibold text-yellow-800 dark:text-yellow-200">
                  Next claim available in: {timeUntilClaimFormatted}
                </p>
                <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-2">
                  (Cooldown: 24 hours)
                </p>
              </div>
            ) : (
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                You've already claimed from the faucet. Come back in 24 hours.
              </p>
            )}
          </div>
        )}

        {/* Token Usage Info */}
        <div className="pt-6 border-t border-border space-y-2">
          <h4 className="font-semibold mb-3">How to use $HOMIE tokens:</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Vote for projects (costs 10 $HOMIE per vote)</li>
            <li>• Tokens are burned when you vote (deflationary)</li>
            <li>• Support your favorite projects on-chain</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
