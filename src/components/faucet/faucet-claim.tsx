'use client';

/**
 * Faucet Claim Component
 * Allows users to claim HOMIE tokens
 */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { usePortfolioToken, useClaimFaucet } from '@/hooks/contracts/usePortfolioToken';
import { useAccount } from 'wagmi';
import { Loader2 } from 'lucide-react';

export function FaucetClaim() {
  const { isConnected } = useAccount();
  const { balance, canClaimFaucet, faucetAmount, isLoading: balanceLoading } = usePortfolioToken();
  const { claimFaucet, isPending, isConfirming, isSuccess } = useClaimFaucet();

  const handleClaim = async () => {
    try {
      await claimFaucet();
    } catch (error) {
      console.error('Faucet claim failed:', error);
    }
  };

  const isLoading = isPending || isConfirming || balanceLoading;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Claim Tokens</CardTitle>
        <CardDescription>
          Get {faucetAmount} HOMIE tokens to participate in voting (one-time claim with 24h cooldown)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Balance */}
        <div className="text-center py-6 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground mb-2">Your Balance</p>
          <p className="text-4xl font-bold">{balance} HOMIE</p>
        </div>

        {/* Claim Section */}
        {!isConnected ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              Connect your wallet to claim tokens
            </p>
          </div>
        ) : isSuccess ? (
          <div className="text-center py-8 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <p className="text-green-800 dark:text-green-200 font-medium mb-2">
              ✓ Successfully claimed {faucetAmount} HOMIE!
            </p>
            <p className="text-sm text-green-700 dark:text-green-300">
              New balance: {balance} HOMIE
            </p>
          </div>
        ) : canClaimFaucet ? (
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-4">
                You can claim {faucetAmount} HOMIE tokens
              </p>
            </div>
            <Button
              onClick={handleClaim}
              disabled={isLoading}
              className="w-full"
              size="lg"
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              {isPending && 'Claiming...'}
              {isConfirming && 'Confirming...'}
              {!isLoading && `Claim ${faucetAmount} HOMIE`}
            </Button>
          </div>
        ) : (
          <div className="text-center py-8 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <p className="text-yellow-800 dark:text-yellow-200 font-medium mb-2">
              Already Claimed
            </p>
            <p className="text-sm text-yellow-700 dark:text-yellow-300">
              You've already claimed from the faucet. Come back in 24 hours.
            </p>
          </div>
        )}

        {/* Token Usage Info */}
        <div className="pt-6 border-t border-border space-y-2">
          <h4 className="font-semibold mb-3">How to use HOMIE tokens:</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Vote for projects (costs 10 HOMIE per vote)</li>
            <li>• Tokens are burned when you vote (deflationary)</li>
            <li>• Support your favorite projects on-chain</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
