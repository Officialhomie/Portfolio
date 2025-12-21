'use client';

/**
 * Smart Wallet Setup Flow
 * Guides users through: EOA connection → Biometric setup → Smart wallet creation
 */

import { useEffect, useState } from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { useBiometricAuth, useBiometricCapability, useBiometricSetup } from '@/hooks/useBiometric';
import { useSmartWallet } from '@/contexts/SmartWalletContext';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

type SetupStep = 'connect' | 'biometric' | 'creating' | 'ready';

export function SmartWalletSetup() {
  const { isConnected, address } = useAccount();
  const { connectors, connect } = useConnect();
  const { disconnect } = useDisconnect();

  const { capability } = useBiometricCapability();
  const isBiometricAvailable = capability !== null;
  
  const {
    isEnabled: isBiometricEnabled,
    requestAuth: enableBiometric,
    refresh: refreshBiometricAuth,
  } = useBiometricAuth();
  
  const { setup: registerKey } = useBiometricSetup();
  
  // Check if biometric is actually configured (not just enabled state)
  const [isBiometricActuallyConfigured, setIsBiometricActuallyConfigured] = useState(false);
  
  useEffect(() => {
    async function checkActualConfig() {
      const { isBiometricConfigured } = await import('@/lib/biometric/auth');
      const configured = await isBiometricConfigured();
      setIsBiometricActuallyConfigured(configured);
    }
    checkActualConfig();
    const interval = setInterval(checkActualConfig, 2000);
    return () => clearInterval(interval);
  }, []);
  
  const isBiometricRegistered = isBiometricEnabled && isBiometricActuallyConfigured;

  const {
    isSmartWalletReady,
    isCreatingSmartWallet,
    smartWalletAddress,
    error,
  } = useSmartWallet();

  const [currentStep, setCurrentStep] = useState<SetupStep>('connect');
  const [isEnablingBiometric, setIsEnablingBiometric] = useState(false);

  // Determine current step
  useEffect(() => {
    if (isSmartWalletReady) {
      setCurrentStep('ready');
    } else if (isCreatingSmartWallet) {
      setCurrentStep('creating');
    } else if (isConnected && isBiometricEnabled && isBiometricRegistered) {
      setCurrentStep('creating'); // Will auto-create
    } else if (isConnected && (isBiometricEnabled || isBiometricRegistered)) {
      setCurrentStep('biometric');
    } else if (isConnected) {
      setCurrentStep('biometric');
    } else {
      setCurrentStep('connect');
    }
  }, [isConnected, isBiometricEnabled, isBiometricRegistered, isCreatingSmartWallet, isSmartWalletReady]);

  const handleConnectWallet = (connectorId: string) => {
    const connector = connectors.find(c => c.id === connectorId);
    if (connector) {
      connect({ connector });
    }
  };

  const handleEnableBiometric = async () => {
    if (!address) {
      console.error('Wallet not connected');
      return;
    }
    
    try {
      setIsEnablingBiometric(true);
      console.log('🔐 Starting biometric setup...');
      
      // Setup biometric (creates key pair and stores credentials)
      const success = await registerKey(address, 'User');
      if (!success) {
        throw new Error('Failed to set up biometric authentication');
      }

      console.log('✅ Biometric setup completed, verifying storage...');
      
      // Verify credentials were stored (now using secure async storage)
      const { getStoredBiometricCredentialSecure, getStoredPublicKeySecure } = await import('@/lib/biometric/storage-adapter');
      const credentialId = await getStoredBiometricCredentialSecure();
      const publicKey = await getStoredPublicKeySecure();

      if (!credentialId || !publicKey) {
        console.error('❌ Credentials not found after setup!');
        console.error('   Credential ID:', credentialId ? 'Found' : 'Missing');
        console.error('   Public Key:', publicKey ? 'Found' : 'Missing');
        throw new Error('Credentials were not stored properly. Please try again.');
      }

      console.log('✅ Credentials verified in storage');
      console.log('   Credential ID:', credentialId.substring(0, 20) + '...');
      console.log('   Public Key X:', publicKey.x.substring(0, 20) + '...');
      
      // Refresh biometric auth state to pick up new credentials
      await refreshBiometricAuth();
      
      // Also trigger a manual check
      setIsBiometricActuallyConfigured(true);
      
      console.log('✅ Biometric setup complete and verified!');
    } catch (err) {
      console.error('Failed to enable biometric:', err);
      alert(`Failed to set up biometric: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsEnablingBiometric(false);
    }
  };

  if (!isBiometricAvailable) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Biometric authentication is not available on this device. Please use a device with Face ID or Touch ID.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      {/* Progress Indicator */}
      <div className="flex items-center justify-between">
        <StepIndicator label="Connect" active={currentStep === 'connect'} completed={isConnected} />
        <div className="flex-1 h-0.5 bg-secondary mx-2" />
        <StepIndicator
          label="Biometric"
          active={currentStep === 'biometric'}
          completed={isBiometricEnabled && isBiometricRegistered}
        />
        <div className="flex-1 h-0.5 bg-secondary mx-2" />
        <StepIndicator
          label="Smart Wallet"
          active={currentStep === 'creating' || currentStep === 'ready'}
          completed={isSmartWalletReady}
        />
      </div>

      {/* Step Content */}
      <div className="p-6 bg-secondary/50 rounded-lg border border-border">
        {currentStep === 'connect' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Connect Your Wallet</h3>
              <p className="text-sm text-muted-foreground">
                Connect your EOA wallet. We'll create a smart wallet for you with biometric authentication.
              </p>
            </div>

            <div className="space-y-2">
              {connectors.map((connector) => (
                <button
                  key={connector.id}
                  onClick={() => handleConnectWallet(connector.id)}
                  className="w-full p-4 bg-background hover:bg-secondary transition-colors rounded-lg border border-border flex items-center justify-between group"
                >
                  <span className="font-medium">{connector.name}</span>
                  <span className="text-muted-foreground group-hover:text-foreground transition-colors">
                    →
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {currentStep === 'biometric' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Enable Biometric Authentication</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Set up Face ID or Touch ID to sign transactions securely. No seed phrase needed!
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-background rounded-lg border border-border">
                <span className="text-sm">Biometric Available</span>
                <Badge variant="default" className="bg-green-500">Yes</Badge>
              </div>

              {!isBiometricEnabled || !isBiometricActuallyConfigured ? (
                <button
                  onClick={handleEnableBiometric}
                  disabled={isEnablingBiometric}
                  className="w-full p-4 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors rounded-lg font-medium disabled:opacity-50"
                >
                  {isEnablingBiometric ? 'Enabling...' : 'Enable Face ID / Touch ID'}
                </button>
              ) : (
                <div className="space-y-2">
                  <div className="text-center text-sm text-green-500 py-2">
                    ✓ Biometric authentication ready
                  </div>
                  <Alert>
                    <AlertDescription className="text-xs text-muted-foreground">
                      Biometric credentials are already configured. Your smart wallet will be created automatically.
                    </AlertDescription>
                  </Alert>
                </div>
              )}
            </div>

            <Alert>
              <AlertDescription className="text-xs">
                Your biometric data never leaves your device. It's stored securely in your device's secure enclave.
              </AlertDescription>
            </Alert>
          </div>
        )}

        {currentStep === 'creating' && (
          <div className="space-y-4 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Creating Your Smart Wallet</h3>
              <p className="text-sm text-muted-foreground">
                Please wait while we set up your biometric smart wallet...
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
                Your smart wallet is ready to use. All transactions will be signed with biometric authentication.
              </p>
              <div className="p-3 bg-background rounded-lg border border-border">
                <p className="text-xs text-muted-foreground mb-1">Your Smart Wallet Address</p>
                <code className="text-xs font-mono break-all">{smartWalletAddress}</code>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-left">
              <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Gas Savings</p>
                <p className="text-lg font-bold text-green-500">75.6%</p>
              </div>
              <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Signature Type</p>
                <p className="text-sm font-mono text-blue-500">secp256r1</p>
              </div>
            </div>

            <button
              onClick={() => disconnect()}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Disconnect
            </button>
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

function StepIndicator({
  label,
  active,
  completed,
}: {
  label: string;
  active: boolean;
  completed: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
          completed
            ? 'bg-green-500 text-white'
            : active
            ? 'bg-primary text-primary-foreground'
            : 'bg-secondary text-muted-foreground'
        }`}
      >
        {completed ? '✓' : active ? '•' : ''}
      </div>
      <span
        className={`text-xs font-medium ${
          active || completed ? 'text-foreground' : 'text-muted-foreground'
        }`}
      >
        {label}
      </span>
    </div>
  );
}
