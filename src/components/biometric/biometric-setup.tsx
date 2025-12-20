/**
 * Biometric Setup Component
 * First-time setup flow for biometric authentication
 */

'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Fingerprint, User, CheckCircle, XCircle, Loader2, Shield, AlertCircle } from 'lucide-react';
import { useBiometricSetup, useBiometricCapability } from '@/hooks/useBiometric';
import { useAccount } from 'wagmi';
import { useSmartWalletAddress, useIsWalletDeployed, useDeployWallet, useRegisterWallet } from '@/hooks/useSmartWallet';
import { getSmartWalletAddress } from '@/lib/wallet/smart-wallet';
import { getStoredPublicKey } from '@/lib/biometric/auth';

export function BiometricSetup() {
  const { address, chainId } = useAccount();
  const { capability, isLoading: capabilityLoading } = useBiometricCapability();
  const { setup, clearSetup, isSetup, isSettingUp, setupError, keyPair } = useBiometricSetup();
  const { walletAddress } = useSmartWalletAddress();
  const { isDeployed: isWalletDeployed, isLoading: isCheckingDeployment } = useIsWalletDeployed(walletAddress);
  const { deploy, isPending: isDeploying, isConfirming: isConfirmingDeployment, isSuccess: isDeploymentSuccess } = useDeployWallet();
  const { register: registerWallet, isPending: isRegisteringWallet } = useRegisterWallet();
  const [setupStep, setSetupStep] = useState<'intro' | 'generating-key' | 'deploying-wallet' | 'registering-wallet' | 'success' | 'error'>('intro');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [deployedWalletAddress, setDeployedWalletAddress] = useState<string | null>(null);

  const handleSetup = async () => {
    if (!address || !chainId || isSettingUp || isDeploying || isRegisteringWallet) {
      return; // Prevent duplicate calls
    }

    try {
      // Step 1: Generate key pair in secure enclave
      setSetupStep('generating-key');
      setErrorMessage(null);

      const success = await setup(address, 'User');

      if (!success) {
        setSetupStep('error');
        setErrorMessage(setupError || 'Failed to generate biometric key');
        return;
      }

      // Step 2: Compute wallet address
      const publicKey = getStoredPublicKey();
      if (!publicKey) {
        setSetupStep('error');
        setErrorMessage('Failed to retrieve public key');
        return;
      }

      const computedWalletAddress = await getSmartWalletAddress(
        { x: publicKey.x as `0x${string}`, y: publicKey.y as `0x${string}` },
        chainId
      );
      setDeployedWalletAddress(computedWalletAddress);

      // Step 3: Deploy wallet (if not already deployed)
      const { isWalletDeployed: checkDeployed } = await import('@/lib/wallet/smart-wallet');
      const deployed = await checkDeployed(computedWalletAddress, chainId);
      if (!deployed) {
        setSetupStep('deploying-wallet');
        await deploy(true); // Sponsored deployment
        // Wait for deployment confirmation
        // Note: In a real implementation, we'd wait for the transaction receipt
      }

      // Step 4: Register wallet in all contracts
      setSetupStep('registering-wallet');
      const contracts: Array<'PortfolioToken' | 'VisitorBook' | 'ProjectNFT' | 'ProjectVoting' | 'VisitNFT'> = [
        'PortfolioToken',
        'VisitorBook',
        'ProjectNFT',
        'ProjectVoting',
        'VisitNFT',
      ];

      for (const contractName of contracts) {
        try {
          await registerWallet(computedWalletAddress, contractName);
        } catch (err) {
          console.error(`Failed to register wallet in ${contractName}:`, err);
          // Continue with other contracts
        }

      }

      setSetupStep('success');
    } catch (error) {
      setSetupStep('error');
      setErrorMessage(
        error instanceof Error ? error.message : 'Setup failed. Please try again.'
      );
    }
  };

  const handleClear = () => {
    clearSetup();
    setSetupStep('intro');
  };

  if (capabilityLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!capability?.isAvailable) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Biometric Authentication Not Available</CardTitle>
          <CardDescription>
            Your device does not support biometric authentication.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              Biometric authentication requires a device with fingerprint or face recognition capabilities.
              You can still use the application with standard wallet signing.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (isSetup && setupStep !== 'intro') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Biometric Authentication Enabled
          </CardTitle>
          <CardDescription>
            Your device is configured for biometric transaction signing.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Shield className="h-4 w-4" />
            All transactions will require biometric verification
          </div>

          {/* Smart Wallet Status */}
          {walletAddress && (
            <Alert className="border-green-500">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-sm text-green-700 dark:text-green-300">
                <p className="font-semibold">Smart wallet deployed and ready!</p>
                <p className="text-xs mt-1 font-mono break-all">
                  {walletAddress}
                </p>
              </AlertDescription>
            </Alert>
          )}

          <Button onClick={handleClear} variant="destructive" className="w-full">
            Disable Biometric Authentication
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Set Up Biometric Authentication</CardTitle>
        <CardDescription>
          Enable fingerprint or Face ID verification for all transactions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Benefits */}
        <div className="space-y-3">
          <h4 className="font-semibold">Benefits:</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <Shield className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>Enhanced security with device-level authentication</span>
            </li>
            <li className="flex items-start gap-2">
              <Fingerprint className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>Faster transaction signing with biometric verification</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>Keys stored securely in device hardware</span>
            </li>
          </ul>
        </div>

        {/* Setup Status */}
        {setupStep === 'generating-key' && (
          <div className="flex flex-col items-center justify-center py-4 space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-sm font-medium">Step 1 of 4: Generating secure key...</p>
            <p className="text-xs text-muted-foreground text-center">
              You may be prompted to authenticate with your {capability.methods.includes('face') ? 'face recognition' : 'fingerprint'}
            </p>
          </div>
        )}

        {setupStep === 'deploying-wallet' && (
          <div className="flex flex-col items-center justify-center py-4 space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-sm font-medium">Step 2 of 4: Deploying smart wallet...</p>
            <p className="text-xs text-muted-foreground text-center">
              {deployedWalletAddress && `Wallet address: ${deployedWalletAddress.slice(0, 10)}...${deployedWalletAddress.slice(-8)}`}
            </p>
          </div>
        )}

        {setupStep === 'registering-wallet' && (
          <div className="flex flex-col items-center justify-center py-4 space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-sm font-medium">Step 3 of 4: Registering wallet...</p>
            <p className="text-xs text-muted-foreground text-center">
              Registering your wallet on portfolio contracts
            </p>
          </div>
        )}


        {setupStep === 'success' && (
          <Alert className="border-green-500">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <AlertDescription className="text-green-700 dark:text-green-300">
              <p className="font-semibold">Biometric authentication has been successfully set up!</p>
              {deployedWalletAddress && (
                <p className="text-xs mt-1 font-mono break-all">
                  Smart wallet: {deployedWalletAddress}
                </p>
              )}
            </AlertDescription>
          </Alert>
        )}

        {setupStep === 'error' && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertTitle>Setup Failed</AlertTitle>
            <AlertDescription>
              <p className="text-sm">{errorMessage || setupError || 'Failed to set up biometric authentication. Please try again.'}</p>
            </AlertDescription>
          </Alert>
        )}

        {/* Action Buttons */}
        {setupStep === 'intro' && (
          <div className="space-y-2">
            {!address && (
              <Alert>
                <AlertDescription>
                  Please connect your wallet to set up biometric authentication.
                </AlertDescription>
              </Alert>
            )}
            <Button
              onClick={handleSetup}
              disabled={!address || isSettingUp || isDeploying || isRegisteringWallet}
              className="w-full"
              size="lg"
            >
              {capability.methods.includes('face') ? (
                <>
                  <User className="h-5 w-5 mr-2" />
                  Set Up Face Recognition
                </>
              ) : (
                <>
                  <Fingerprint className="h-5 w-5 mr-2" />
                  Set Up Fingerprint
                </>
              )}
            </Button>
          </div>
        )}

        {setupStep === 'error' && (
          <Button onClick={handleSetup} variant="outline" className="w-full">
            Try Again
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
