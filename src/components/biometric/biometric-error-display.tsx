/**
 * User-Friendly Error Display for Biometric Errors
 */

'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, AlertTriangle, Info, ExternalLink } from 'lucide-react';
import { getBiometricErrorMessage, type BiometricError } from '@/lib/biometric/error-messages';

interface BiometricErrorDisplayProps {
  error: Error | string | null;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
}

export function BiometricErrorDisplay({
  error,
  onRetry,
  onDismiss,
  className,
}: BiometricErrorDisplayProps) {
  if (!error) return null;

  const errorInfo = getBiometricErrorMessage(error);

  const Icon = {
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info,
  }[errorInfo.severity];

  const variantClass = {
    error: 'border-red-500 bg-red-50 dark:bg-red-950',
    warning: 'border-amber-500 bg-amber-50 dark:bg-amber-950',
    info: 'border-blue-500 bg-blue-50 dark:bg-blue-950',
  }[errorInfo.severity];

  return (
    <Alert className={`${variantClass} ${className}`}>
      <Icon className="h-4 w-4" />
      <AlertTitle className="font-semibold">{errorInfo.title}</AlertTitle>
      <AlertDescription className="space-y-3">
        <p className="text-sm">{errorInfo.message}</p>
        <p className="text-sm font-medium">{errorInfo.suggestion}</p>

        {errorInfo.learnMoreUrl && (
          <a
            href={errorInfo.learnMoreUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400"
          >
            Learn more
            <ExternalLink className="h-3 w-3" />
          </a>
        )}

        <div className="flex gap-2 mt-2">
          {errorInfo.canRetry && onRetry && (
            <Button size="sm" variant="outline" onClick={onRetry}>
              Try Again
            </Button>
          )}
          {onDismiss && (
            <Button size="sm" variant="ghost" onClick={onDismiss}>
              Dismiss
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}
