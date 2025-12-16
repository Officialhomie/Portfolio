/**
 * Biometric Status Component
 * Display biometric authentication status and device capabilities
 */

'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Fingerprint, User, Shield, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useBiometricCapability, useBiometricAuth } from '@/hooks/useBiometric';
import { useBaseCompatibility } from '@/hooks/useBiometric';
import { useAccount } from 'wagmi';

export function BiometricStatus() {
  const { chainId } = useAccount();
  const { capability, isLoading } = useBiometricCapability();
  const { isEnabled } = useBiometricAuth();
  const compatibility = chainId ? useBaseCompatibility(chainId) : null;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!capability) {
    return null;
  }

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'face':
        return <User className="h-4 w-4" />;
      case 'fingerprint':
        return <Fingerprint className="h-4 w-4" />;
      default:
        return <Shield className="h-4 w-4" />;
    }
  };

  const getPlatformBadge = () => {
    switch (capability.platform) {
      case 'ios':
        return <Badge variant="secondary">iOS</Badge>;
      case 'android':
        return <Badge variant="secondary">Android</Badge>;
      case 'desktop':
        return <Badge variant="secondary">Desktop</Badge>;
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Biometric Authentication Status
        </CardTitle>
        <CardDescription>
          Device capabilities and configuration status
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Status</span>
          {isEnabled ? (
            <Badge variant="default" className="gap-1">
              <CheckCircle className="h-3 w-3" />
              Enabled
            </Badge>
          ) : (
            <Badge variant="secondary" className="gap-1">
              <XCircle className="h-3 w-3" />
              Not Configured
            </Badge>
          )}
        </div>

        {/* Platform */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Platform</span>
          {getPlatformBadge()}
        </div>

        {/* Availability */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Available</span>
          {capability.isAvailable ? (
            <Badge variant="default">Yes</Badge>
          ) : (
            <Badge variant="destructive">No</Badge>
          )}
        </div>

        {/* Secure Enclave */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Secure Enclave</span>
          {capability.hasSecureEnclave ? (
            <Badge variant="default">Supported</Badge>
          ) : (
            <Badge variant="secondary">Not Available</Badge>
          )}
        </div>

        {/* Supported Methods */}
        {capability.methods.length > 0 && (
          <div className="space-y-2">
            <span className="text-sm font-medium">Supported Methods</span>
            <div className="flex flex-wrap gap-2">
              {capability.methods.map((method) => (
                <Badge key={method} variant="outline" className="gap-1">
                  {getMethodIcon(method)}
                  {method.charAt(0).toUpperCase() + method.slice(1)}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Base L2 Compatibility */}
        {compatibility && (
          <div className="pt-4 border-t border-border space-y-2">
            <span className="text-sm font-medium">Base L2 Compatibility</span>
            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">EIP-7951 Support</span>
                {compatibility.supportsEIP7951 ? (
                  <Badge variant="default">Yes</Badge>
                ) : (
                  <Badge variant="secondary">No</Badge>
                )}
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Signing Method</span>
                <Badge variant="outline">{compatibility.signingMethod}</Badge>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

