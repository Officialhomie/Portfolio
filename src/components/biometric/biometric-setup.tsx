/**
 * Biometric Setup Component
 * First-time setup flow for biometric authentication
 */

'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Fingerprint, User, CheckCircle, XCircle, Loader2, Shield } from 'lucide-react';
import { useBiometricSetup, useBiometricCapability } from '@/hooks/useBiometric';
import { useAccount } from 'wagmi';

export function BiometricSetup() {
  const { address } = useAccount();
  const { capability, isLoading: capabilityLoading } = useBiometricCapability();
  const { setup, clearSetup, isSetup, isSettingUp, setupError, keyPair } = useBiometricSetup();
  const [setupStep, setSetupStep] = useState<'intro' | 'setting-up' | 'success' | 'error'>('intro');

  const handleSetup = async () => {
    if (!address) {
      return;
    }

    setSetupStep('setting-up');
    const success = await setup(address, 'User');
    
    if (success) {
      setSetupStep('success');
    } else {
      setSetupStep('error');
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
        {setupStep === 'setting-up' && (
          <div className="flex flex-col items-center justify-center py-4 space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              Setting up biometric authentication...
            </p>
            <p className="text-xs text-muted-foreground text-center">
              You may be prompted to authenticate with your {capability.methods.includes('face') ? 'face recognition' : 'fingerprint'}
            </p>
          </div>
        )}

        {setupStep === 'success' && (
          <Alert className="border-green-500">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <AlertDescription className="text-green-700 dark:text-green-300">
              Biometric authentication has been successfully set up!
            </AlertDescription>
          </Alert>
        )}

        {setupStep === 'error' && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              {setupError || 'Failed to set up biometric authentication. Please try again.'}
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
              disabled={!address || isSettingUp}
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

