'use client';

/**
 * Visitor Book Form Component
 * Form for signing the visitor book with support for biometric and EIP-712 signing
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { 
  useSignVisitorBook, 
  useSignVisitorBookWithBiometric,
  useMessageValidation 
} from '@/hooks/contracts/useVisitorBook';
import { useAccount, useReadContract } from 'wagmi';
import { useBiometricCapability, useBiometricAuth, useRegisterBiometricKey } from '@/hooks/useBiometric';
import { getVisitorBookAddress } from '@/lib/contracts/addresses';
import { getStoredPublicKey } from '@/lib/biometric/auth';
import { Loader2, Fingerprint, Shield, CheckCircle } from 'lucide-react';
import { base } from 'wagmi/chains';
import { keccak256, encodePacked } from 'viem';

interface VisitorBookFormProps {
  onSuccess?: () => void;
}

export function VisitorBookForm({ onSuccess }: VisitorBookFormProps) {
  const { isConnected, address, chainId } = useAccount();
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  const validation = useMessageValidation(message);

  // Biometric capability check
  const { isAvailable: biometricAvailable, capability, isLoading: checkingBiometric } = useBiometricCapability();
  const { isEnabled: biometricEnabled } = useBiometricAuth();
  
  // Get contract address
  const contractAddress = getVisitorBookAddress(chainId || base.id);
  
  // Check if public key is registered on-chain
  const publicKey = getStoredPublicKey();
  const publicKeyHash = publicKey 
    ? keccak256(encodePacked(['bytes32', 'bytes32'], [publicKey.x, publicKey.y]))
    : undefined;
  
  const { data: registeredAddress } = useReadContract({
    address: contractAddress,
    abi: [
      {
        inputs: [{ internalType: 'bytes32', name: '', type: 'bytes32' }],
        name: 'secp256r1ToAddress',
        outputs: [{ internalType: 'address', name: '', type: 'address' }],
        stateMutability: 'view',
        type: 'function',
      },
    ],
    functionName: 'secp256r1ToAddress',
    args: publicKeyHash ? [publicKeyHash] : undefined,
    query: {
      enabled: !!publicKeyHash && !!contractAddress,
    },
  });
  
  const isBiometricRegistered = registeredAddress && registeredAddress.toLowerCase() === address?.toLowerCase();
  
  // Registration hook
  const { registerKey, isPending: isRegistering, isSuccess: registrationSuccess } = useRegisterBiometricKey(contractAddress);
  
  // Signing hooks (biometric only)
  const {
    signVisitorBookWithBiometric,
    isPending: isBiometricPending,
    isConfirming: isBiometricConfirming,
    isSuccess: isBiometricSuccess
  } = useSignVisitorBookWithBiometric();
  
  // Determine if biometric is ready to use
  const canUseBiometric = biometricAvailable && biometricEnabled && isBiometricRegistered && publicKey;
  const needsBiometricSetup = !biometricEnabled;
  const needsRegistration = biometricEnabled && !isBiometricRegistered && publicKey;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validation.isValid) return;

    // ENFORCE BIOMETRIC-ONLY SIGNING
    if (!canUseBiometric) {
      setError('Biometric authentication is required. Please set up biometric authentication first.');
      return;
    }

    try {
      // Always use biometric signing (no fallback to EIP-712)
      await signVisitorBookWithBiometric(message);
      setMessage(''); // Clear form on success
      onSuccess?.();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to sign visitor book with biometric authentication';
      setError(errorMessage);
      console.error('Biometric signing failed:', error);
    }
  };

  const handleRegisterBiometric = async () => {
    if (isRegistering) return; // Prevent duplicate calls
    
    try {
      setError(null);
      await registerKey();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to register biometric key';
      setError(errorMessage);
      console.error('Failed to register biometric key:', err);
    }
  };

  const isLoading = isBiometricPending || isBiometricConfirming || isRegistering;
  const isSuccess = isBiometricSuccess;

  // Success state
  useEffect(() => {
    if (isSuccess) {
      setTimeout(() => {
        // Reset form after showing success message
        setMessage('');
      }, 2000);
    }
  }, [isSuccess]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          ✍️ Sign the Visitor Book
        </CardTitle>
        <CardDescription>
          Leave a permanent message on the blockchain (1-500 characters). 
          Your message will be stored forever and you'll receive a Visit NFT!
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!isConnected ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              Connect your wallet to sign the visitor book
            </p>
          </div>
        ) : isSuccess ? (
          <div className="text-center py-8 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <p className="text-green-800 dark:text-green-200 font-medium">
              ✓ Thank you for signing the visitor book!
            </p>
            <p className="text-sm text-green-700 dark:text-green-300 mt-2">
              Your message has been permanently stored on-chain
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Leave your message here..."
                rows={4}
                maxLength={validation.maxLength}
                disabled={isLoading}
                className={
                  validation.warningLevel === 'danger'
                    ? 'border-red-500'
                    : validation.warningLevel === 'warning'
                    ? 'border-yellow-500'
                    : ''
                }
              />
              <div className="flex justify-between items-center mt-2">
                <span
                  className={`text-sm ${
                    validation.warningLevel === 'danger'
                      ? 'text-red-600 dark:text-red-400'
                      : validation.warningLevel === 'warning'
                      ? 'text-yellow-600 dark:text-yellow-400'
                      : 'text-muted-foreground'
                  }`}
                >
                  {validation.length} / {validation.maxLength} characters
                  {validation.charactersRemaining < 50 && validation.charactersRemaining >= 0 && (
                    <span className="ml-2">({validation.charactersRemaining} remaining)</span>
                  )}
                </span>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
              </div>
            )}

            {/* Biometric setup required */}
            {needsBiometricSetup && (
              <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-amber-900 dark:text-amber-100 mb-1">
                      Biometric Authentication Required
                    </p>
                    <p className="text-xs text-amber-700 dark:text-amber-300 mb-3">
                      This application requires biometric authentication (Face ID/Touch ID) to sign the visitor book.
                      Please go to Settings to enable biometric authentication.
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => window.location.href = '/biometric'}
                      className="w-full"
                    >
                      <Fingerprint className="h-4 w-4 mr-2" />
                      Go to Biometric Settings
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Registration required */}
            {needsRegistration && !isRegistering && (
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                      Register Your Biometric Key
                    </p>
                    <p className="text-xs text-blue-700 dark:text-blue-300 mb-3">
                      One-time setup: Register your biometric key on-chain to sign with Face ID/Touch ID.
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleRegisterBiometric}
                      disabled={isRegistering}
                      className="w-full"
                    >
                      {isRegistering ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Registering...
                        </>
                      ) : (
                        <>
                          <Fingerprint className="h-4 w-4 mr-2" />
                          Register Biometric Key
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Biometric ready - show status */}
            {canUseBiometric && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-emerald-800 dark:text-emerald-200">
                  <CheckCircle className="h-4 w-4" />
                  <span className="font-medium">
                    Ready to sign with {capability?.methods.includes('face') ? 'Face ID' : capability?.methods.includes('fingerprint') ? 'Touch ID' : 'Biometric'}
                  </span>
                </div>
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={!validation.isValid || isLoading || !canUseBiometric}
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {!isLoading && canUseBiometric && <Fingerprint className="h-4 w-4 mr-2" />}
              {isRegistering && 'Registering Biometric Key...'}
              {isBiometricPending && 'Authenticating with Biometric...'}
              {isBiometricConfirming && 'Confirming Transaction...'}
              {!isLoading && canUseBiometric && (
                `Sign with ${capability?.methods.includes('face') ? 'Face ID' : capability?.methods.includes('fingerprint') ? 'Touch ID' : 'Biometric'}`
              )}
              {!isLoading && !canUseBiometric && 'Biometric Required'}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
