/**
 * Biometric Gas Estimate Display
 * Shows gas estimates for biometric transactions with Fusaka comparison
 */

'use client';

import { useMemo } from 'react';
import { useFusakaDetection, useGasSavingsCalculator } from '@/hooks/useFusakaDetection';
import { FusakaBadge } from './fusaka-badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingDown, Zap, DollarSign, Fuel } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface GasEstimateDisplayProps {
  transactionType?: string;
  className?: string;
}

/**
 * Inline gas estimate for transaction buttons
 */
export function InlineGasEstimate({ className }: { className?: string }) {
  const fusaka = useFusakaDetection();

  if (!fusaka || fusaka.isLoading) {
    return (
      <span className={cn('text-xs text-muted-foreground', className)}>
        Estimating gas...
      </span>
    );
  }

  return (
    <span className={cn('text-xs text-muted-foreground flex items-center gap-1', className)}>
      <Fuel className="h-3 w-3" />
      ~{fusaka.estimatedGas.toString()} gas
      {fusaka.estimatedCostUSD && (
        <span className="text-muted-foreground">
          (${fusaka.estimatedCostUSD.toFixed(4)})
        </span>
      )}
    </span>
  );
}

/**
 * Gas estimate card with comparison
 */
export function GasEstimateCard({
  transactionType = 'Biometric Transaction',
  className,
}: GasEstimateDisplayProps) {
  const fusaka = useFusakaDetection();

  if (!fusaka || fusaka.isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-sm">Gas Estimate</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">{transactionType}</CardTitle>
          {fusaka.hasPrecompile && <FusakaBadge variant="compact" />}
        </div>
        <CardDescription className="text-xs">
          {fusaka.hasPrecompile ? 'Using EIP-7951 precompile' : 'Using P256.sol library'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Current method */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Estimated Gas</span>
            <span className="font-mono font-medium">
              {fusaka.estimatedGas.toString()}
            </span>
          </div>
          {fusaka.estimatedCostUSD && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Estimated Cost</span>
              <span className="font-mono font-medium">
                ${fusaka.estimatedCostUSD.toFixed(4)}
              </span>
            </div>
          )}
        </div>

        {/* Savings comparison if precompile is active */}
        {fusaka.hasPrecompile && fusaka.savedCostUSD && (
          <>
            <div className="border-t pt-3">
              <p className="text-xs text-muted-foreground mb-2">Compared to standard method:</p>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Gas Saved</span>
                  <span className="font-mono font-medium text-emerald-600 dark:text-emerald-400">
                    {fusaka.gasSavings.toString()}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Cost Saved</span>
                  <span className="font-mono font-medium text-emerald-600 dark:text-emerald-400">
                    ${fusaka.savedCostUSD.toFixed(4)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm pt-1">
                  <span className="text-muted-foreground font-medium">Savings</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {fusaka.gasSavingsPercentage}%
                  </span>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Gas savings calculator for multiple transactions
 */
export function GasSavingsCalculator({
  transactionCount = 100,
  className,
}: {
  transactionCount?: number;
  className?: string;
}) {
  const savings = useGasSavingsCalculator(transactionCount);
  const fusaka = useFusakaDetection();

  if (!fusaka?.hasPrecompile) {
    return null;
  }

  return (
    <Card className={cn('border-emerald-200 dark:border-emerald-800', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <TrendingDown className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <CardTitle className="text-sm">Projected Savings</CardTitle>
        </div>
        <CardDescription className="text-xs">
          For {transactionCount.toLocaleString()} transactions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          {/* With Precompile */}
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">With Fusaka</p>
            <div className="space-y-0.5">
              <p className="text-sm font-mono font-medium">
                {savings.totalGasWithPrecompile.toLocaleString()}
              </p>
              <p className="text-xs text-emerald-600 dark:text-emerald-400">
                ${savings.totalCostWithPrecompile.toFixed(2)}
              </p>
            </div>
          </div>

          {/* Without Precompile */}
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Without Fusaka</p>
            <div className="space-y-0.5">
              <p className="text-sm font-mono font-medium line-through opacity-60">
                {savings.totalGasWithoutPrecompile.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground line-through">
                ${savings.totalCostWithoutPrecompile.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        {/* Total Savings */}
        <div className="border-t pt-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <DollarSign className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-sm font-medium">Total Saved</span>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                ${savings.totalCostSaved.toFixed(2)}
              </p>
              <p className="text-xs text-muted-foreground">
                {savings.savingsPercentage}% reduction
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Compact gas badge for transaction buttons
 */
export function GasBadge({ className }: { className?: string }) {
  const fusaka = useFusakaDetection();

  if (!fusaka) return null;

  return (
    <div className={cn('inline-flex items-center gap-1.5 text-xs', className)}>
      {fusaka.hasPrecompile && <Zap className="h-3 w-3 text-emerald-500" />}
      <span className="text-muted-foreground">
        {fusaka.estimatedGas.toString()} gas
      </span>
      {fusaka.estimatedCostUSD && (
        <span className="text-muted-foreground">
          • ${fusaka.estimatedCostUSD.toFixed(4)}
        </span>
      )}
    </div>
  );
}
