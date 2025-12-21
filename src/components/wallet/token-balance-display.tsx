'use client';

/**
 * HOMIE Token Balance Display Component
 * Shows user's current HOMIE token balance with real-time updates
 */

import { usePortfolioToken, useTokenInfo } from '@/hooks/contracts/usePortfolioToken';
import { useAccount } from 'wagmi';
import { Card, CardContent } from '@/components/ui/card';
import { Coins, Loader2 } from 'lucide-react';

interface TokenBalanceDisplayProps {
  showCard?: boolean;
  className?: string;
}

export function TokenBalanceDisplay({ showCard = true, className = '' }: TokenBalanceDisplayProps) {
  const { isConnected } = useAccount();
  const { balance, isLoading } = usePortfolioToken();
  const { symbol } = useTokenInfo();

  if (!isConnected) {
    return null;
  }

  const content = (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500">
        <Coins className="h-5 w-5 text-white" />
      </div>
      <div className="flex-1">
        <p className="text-xs text-muted-foreground font-medium">Your Balance</p>
        {isLoading ? (
          <div className="flex items-center gap-2 mt-1">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Loading...</span>
          </div>
        ) : (
          <p className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            {parseFloat(balance).toLocaleString(undefined, {
              minimumFractionDigits: 0,
              maximumFractionDigits: 2,
            })}{' '}
            <span className="text-base font-semibold">{symbol}</span>
          </p>
        )}
      </div>
    </div>
  );

  if (showCard) {
    return (
      <Card className="border-2 border-purple-200 dark:border-purple-800">
        <CardContent className="pt-6">
          {content}
        </CardContent>
      </Card>
    );
  }

  return content;
}

/**
 * Compact inline token balance display
 */
export function TokenBalanceInline() {
  const { balance, isLoading } = usePortfolioToken();
  const { symbol } = useTokenInfo();
  const { isConnected } = useAccount();

  if (!isConnected) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" />
        <span>Loading balance...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-full border border-purple-200 dark:border-purple-800">
      <Coins className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
      <span className="text-sm font-semibold text-purple-900 dark:text-purple-100">
        {parseFloat(balance).toLocaleString(undefined, {
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
        })}{' '}
        {symbol}
      </span>
    </div>
  );
}
