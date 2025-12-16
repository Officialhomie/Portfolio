'use client';

/**
 * Biometric Settings Page
 * Allows users to set up and manage biometric authentication
 */

import { PageLayout } from '@/components/layout/page-layout';
import { BiometricSetup } from '@/components/biometric/biometric-setup';
import { BiometricStatus } from '@/components/biometric/biometric-status';
import { useAccount } from 'wagmi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Fingerprint } from 'lucide-react';

export default function BiometricPage() {
  const { isConnected } = useAccount();

  return (
    <PageLayout>
      {/* Page Header */}
      <section className="container mx-auto px-4 py-12">
        <div className="max-w-3xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h2 className="text-4xl font-bold">Biometric Authentication</h2>
              <p className="text-muted-foreground mt-1">
                Secure your transactions with fingerprint or Face ID
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="container mx-auto px-4 pb-20">
        <div className="grid lg:grid-cols-2 gap-8 max-w-5xl">
          {/* Setup Section */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Fingerprint className="h-5 w-5" />
                  Setup Biometric Authentication
                </CardTitle>
                <CardDescription>
                  Enable fingerprint or Face ID to sign transactions securely
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!isConnected ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">
                      Please connect your wallet to set up biometric authentication
                    </p>
                  </div>
                ) : (
                  <BiometricSetup />
                )}
              </CardContent>
            </Card>
          </div>

          {/* Status Section */}
          <div className="space-y-6">
            <BiometricStatus />

            {/* Info Card */}
            <Card>
              <CardHeader>
                <CardTitle>How It Works</CardTitle>
                <CardDescription>
                  Understanding biometric transaction signing
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-muted-foreground">
                <div>
                  <h4 className="font-semibold text-foreground mb-2">1. Setup</h4>
                  <p>
                    Generate a secure key pair in your device's secure enclave. This key is never exposed and stays on your device.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-2">2. Authentication</h4>
                  <p>
                    When you initiate a transaction, you'll be prompted to authenticate with your fingerprint or Face ID.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-2">3. Signing</h4>
                  <p>
                    Your transaction is signed using the secure enclave key after biometric verification. The signature is verified on-chain using EIP-7951.
                  </p>
                </div>
                <div className="pt-4 border-t border-border">
                  <p className="text-xs">
                    <strong>Note:</strong> Biometric authentication requires a device with secure enclave support (iOS devices with Face ID/Touch ID, Android devices with StrongBox, or compatible desktop browsers).
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </PageLayout>
  );
}

