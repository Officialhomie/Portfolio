/**
 * Biometric Prompt Component
 * Modal/dialog for biometric authentication
 */

'use client';

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Fingerprint, User, Loader2, XCircle, CheckCircle } from 'lucide-react';
import { useBiometricAuth, useBiometricCapability } from '@/hooks/useBiometric';

interface BiometricPromptProps {
  /** Whether the prompt is open */
  open: boolean;
  /** Callback when authentication succeeds */
  onSuccess: () => void;
  /** Callback when authentication fails or is cancelled */
  onCancel: () => void;
  /** Custom message to display */
  message?: string;
}

export function BiometricPrompt({ open, onSuccess, onCancel, message }: BiometricPromptProps) {
  const { capability } = useBiometricCapability();
  const { requestAuth, isAuthenticating, lastAuthResult } = useBiometricAuth();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleAuthenticate = async () => {
    setIsProcessing(true);
    const success = await requestAuth(message || 'Please authenticate to continue');
    setIsProcessing(false);

    if (success) {
      setTimeout(() => {
        onSuccess();
      }, 500); // Small delay for visual feedback
    }
  };

  useEffect(() => {
    if (open && capability?.isAvailable) {
      // Automatically trigger authentication when dialog opens
      handleAuthenticate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const getBiometricIcon = () => {
    if (!capability) return null;
    
    if (capability.methods.includes('face')) {
      return <User className="h-16 w-16 text-primary animate-pulse" />;
    }
    if (capability.methods.includes('fingerprint')) {
      return <Fingerprint className="h-16 w-16 text-primary animate-pulse" />;
    }
    return <Fingerprint className="h-16 w-16 text-primary animate-pulse" />;
  };

  const getStatusIcon = () => {
    if (isProcessing || isAuthenticating) {
      return <Loader2 className="h-8 w-8 animate-spin text-primary" />;
    }
    if (lastAuthResult?.success) {
      return <CheckCircle className="h-8 w-8 text-green-500" />;
    }
    if (lastAuthResult && !lastAuthResult.success) {
      return <XCircle className="h-8 w-8 text-destructive" />;
    }
    return null;
  };

  const getStatusMessage = () => {
    if (isProcessing || isAuthenticating) {
      return 'Waiting for biometric authentication...';
    }
    if (lastAuthResult?.success) {
      return 'Authentication successful!';
    }
    if (lastAuthResult && !lastAuthResult.success) {
      return lastAuthResult.error || 'Authentication failed';
    }
    return message || 'Please authenticate to continue';
  };

  if (!capability?.isAvailable) {
    return (
      <Dialog open={open} onOpenChange={onCancel}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Biometric Authentication Not Available</DialogTitle>
            <DialogDescription>
              Your device does not support biometric authentication. Please use your wallet to sign transactions.
            </DialogDescription>
          </DialogHeader>
          <Button onClick={onCancel} className="w-full">
            Continue with Wallet
          </Button>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onCancel}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Biometric Authentication</DialogTitle>
          <DialogDescription>
            {getStatusMessage()}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center justify-center py-8 space-y-4">
          {/* Biometric Icon */}
          <div className="relative">
            {getBiometricIcon()}
            {getStatusIcon() && (
              <div className="absolute -bottom-2 -right-2">
                {getStatusIcon()}
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              {capability.methods.includes('face')
                ? 'Use Face ID to authenticate'
                : capability.methods.includes('fingerprint')
                ? 'Use your fingerprint to authenticate'
                : 'Use your device biometric to authenticate'}
            </p>
          </div>

          {/* Retry Button (if failed) */}
          {lastAuthResult && !lastAuthResult.success && !isProcessing && (
            <Button onClick={handleAuthenticate} variant="outline" className="w-full">
              Try Again
            </Button>
          )}

          {/* Cancel Button */}
          <Button onClick={onCancel} variant="ghost" className="w-full" disabled={isProcessing}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

