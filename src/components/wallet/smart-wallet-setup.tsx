'use client';

/**
 * Smart Wallet Setup Flow
 * Shows wallet creation status
 */

import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { useSmartWallet } from '@/contexts/SmartWalletContext';
import { Alert, AlertDescription } from '@/components/ui/alert';

type SetupStep = 'connect' | 'creating' | 'ready';

export function SmartWalletSetup() {
  const { isConnected } = useAccount();
  const {
    isSmartWalletReady,
    isCreatingSmartWallet,
    smartWalletAddress,
    error,
  } = useSmartWallet();

  const [currentStep, setCurrentStep] = useState<SetupStep>('connect');

  // Determine current step
  useEffect(() => {
    if (isSmartWalletReady) {
      setCurrentStep('ready');
    } else if (isCreatingSmartWallet) {
      setCurrentStep('creating');
    } else if (isConnected) {
      setCurrentStep('creating');
    } else {
      setCurrentStep('connect');
    }
  }, [isConnected, isCreatingSmartWallet, isSmartWalletReady]);

  if (currentStep === 'connect') {
    return (
      <Alert>
        <AlertDescription>
          Connect your wallet to create a smart wallet
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      {/* Step Content */}
      <div className="p-6 bg-secondary/50 rounded-lg border border-border">
        {currentStep === 'creating' && (
          <div className="space-y-4 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Creating Your Smart Wallet</h3>
              <p className="text-sm text-muted-foreground">
                Please wait while we set up your smart wallet...
              </p>
            </div>
          </div>
        )}

        {currentStep === 'ready' && smartWalletAddress && (
          <div className="space-y-4 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500/10 rounded-full mb-4">
              <span className="text-3xl">✓</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2 text-green-500">Smart Wallet Ready!</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Your smart wallet is ready to use.
              </p>
              <div className="p-3 bg-background rounded-lg border border-border">
                <p className="text-xs text-muted-foreground mb-1">Your Smart Wallet Address</p>
                <code className="text-xs font-mono break-all">{smartWalletAddress}</code>
              </div>
            </div>
          </div>
        )}

        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertDescription className="text-sm">
              {error.message}
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}
