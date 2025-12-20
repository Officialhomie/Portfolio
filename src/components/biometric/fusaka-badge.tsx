/**
 * Fusaka Gas Savings Badge
 * Displays EIP-7951 status and gas savings
 */

'use client';

import { Badge } from '@/components/ui/badge';
import { useFusakaDetection } from '@/hooks/useFusakaDetection';
import { Loader2, Zap, Info, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FusakaBadgeProps {
  variant?: 'default' | 'compact' | 'detailed';
  showIcon?: boolean;
  className?: string;
}

/**
 * Badge showing Fusaka status and gas savings
 */
export function FusakaBadge({
  variant = 'default',
  showIcon = true,
  className,
}: FusakaBadgeProps) {
  const fusaka = useFusakaDetection();

  // Loading state
  if (!fusaka || fusaka.isLoading) {
    return (
      <Badge variant="outline" className={cn('gap-2', className)}>
        <Loader2 className="h-3 w-3 animate-spin" />
        <span className="text-xs">Detecting...</span>
      </Badge>
    );
  }

  // Error state
  if (fusaka.isError) {
    return (
      <Badge variant="destructive" className={cn('gap-2', className)}>
        {showIcon && <AlertCircle className="h-3 w-3" />}
        <span className="text-xs">Detection Failed</span>
      </Badge>
    );
  }

  // Not supported
  if (!fusaka.isSupported) {
    return (
      <Badge variant="secondary" className={cn('gap-2', className)}>
        {showIcon && <Info className="h-3 w-3" />}
        <span className="text-xs">Unsupported Chain</span>
      </Badge>
    );
  }

  // Fusaka not enabled
  if (!fusaka.isFusakaEnabled) {
    return (
      <Badge variant="secondary" className={cn('gap-2', className)}>
        {showIcon && <Info className="h-3 w-3" />}
        <span className="text-xs">Fusaka Not Available</span>
      </Badge>
    );
  }

  // No precompile
  if (!fusaka.hasPrecompile) {
    return (
      <Badge variant="outline" className={cn('gap-2', className)}>
        {showIcon && <Info className="h-3 w-3" />}
        <span className="text-xs">Standard Verification</span>
      </Badge>
    );
  }

  // Fusaka enabled! Show savings
  const savingsText = `${fusaka.gasSavingsPercentage}% Gas Savings`;

  if (variant === 'compact') {
    return (
      <Badge
        variant="default"
        className={cn(
          'gap-1.5 bg-emerald-500 hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-700',
          className
        )}
      >
        {showIcon && <Zap className="h-3 w-3" />}
        <span className="text-xs font-medium">{fusaka.gasSavingsPercentage}%</span>
      </Badge>
    );
  }

  if (variant === 'detailed') {
    return (
      <Badge
        variant="default"
        className={cn(
          'gap-2 bg-emerald-500 hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-700 px-3 py-1',
          className
        )}
      >
        {showIcon && <Zap className="h-4 w-4" />}
        <div className="flex flex-col items-start">
          <span className="text-xs font-bold">{savingsText}</span>
          <span className="text-[10px] opacity-90">EIP-7951 Active</span>
        </div>
      </Badge>
    );
  }

  // Default variant
  return (
    <Badge
      variant="default"
      className={cn(
        'gap-2 bg-emerald-500 hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-700',
        className
      )}
    >
      {showIcon && <Zap className="h-3 w-3" />}
      <span className="text-xs font-medium">{savingsText}</span>
    </Badge>
  );
}

/**
 * Inline text showing Fusaka status (no badge styling)
 */
export function FusakaStatusText({ className }: { className?: string }) {
  const fusaka = useFusakaDetection();

  if (!fusaka || fusaka.isLoading) {
    return <span className={cn('text-xs text-muted-foreground', className)}>Detecting Fusaka...</span>;
  }

  if (!fusaka.hasPrecompile) {
    return <span className={cn('text-xs text-muted-foreground', className)}>Standard verification</span>;
  }

  return (
    <span className={cn('text-xs text-emerald-600 dark:text-emerald-400 font-medium', className)}>
      ⚡ {fusaka.gasSavingsPercentage}% gas savings active
    </span>
  );
}

/**
 * Full Fusaka info card
 */
export function FusakaInfoCard({ className }: { className?: string }) {
  const fusaka = useFusakaDetection();

  if (!fusaka || !fusaka.hasPrecompile) {
    return null;
  }

  return (
    <div
      className={cn(
        'rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 p-4',
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div className="rounded-full bg-emerald-500 p-2">
          <Zap className="h-4 w-4 text-white" />
        </div>
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">
              Fusaka Upgrade Active
            </h4>
            <FusakaBadge variant="compact" showIcon={false} />
          </div>
          <p className="text-xs text-emerald-700 dark:text-emerald-300">
            EIP-7951 precompile detected on {fusaka.chainName}
          </p>
          <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
            <div>
              <p className="text-emerald-600 dark:text-emerald-400 font-medium">Gas Cost</p>
              <p className="text-emerald-900 dark:text-emerald-100">
                ~{fusaka.estimatedGas.toString()} gas
              </p>
            </div>
            <div>
              <p className="text-emerald-600 dark:text-emerald-400 font-medium">Est. Cost</p>
              <p className="text-emerald-900 dark:text-emerald-100">
                ${fusaka.estimatedCostUSD?.toFixed(4) ?? '0.004'}
              </p>
            </div>
          </div>
          {fusaka.fusakaActivationDate && (
            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-2">
              Activated: {fusaka.fusakaActivationDate}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
