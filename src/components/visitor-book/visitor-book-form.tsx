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
import { Loader2, Fingerprint, Shield } from 'lucide-react';
import { base } from 'wagmi/chains';
import { keccak256, encodePacked } from 'viem';

interface VisitorBookFormProps {
  onSuccess?: () => void;
}

export function VisitorBookForm({ onSuccess }: VisitorBookFormProps) {
  const { isConnected, address, chainId } = useAccount();
  const [message, setMessage] = useState('');
  const [useBiometric, setUseBiometric] = useState(false);
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
  
  // Signing hooks
  const { signVisitorBook, isPending: isEIP712Pending, isConfirming: isEIP712Confirming, isSuccess: isEIP712Success } = useSignVisitorBook();
  const { 
    signVisitorBookWithBiometric, 
    isPending: isBiometricPending, 
    isConfirming: isBiometricConfirming, 
    isSuccess: isBiometricSuccess 
  } = useSignVisitorBookWithBiometric();
  
  // Determine if biometric should be available
  const canUseBiometric = biometricAvailable && biometricEnabled && isBiometricRegistered && publicKey;
  const shouldShowBiometricOption = biometricAvailable && biometricEnabled && publicKey;
  
  // Auto-switch to biometric if available and registered
  useEffect(() => {
    if (canUseBiometric && !useBiometric) {
      setUseBiometric(true);
    }
  }, [canUseBiometric, useBiometric]);
  
  // Handle registration success
  useEffect(() => {
    if (registrationSuccess) {
      setUseBiometric(true);
    }
  }, [registrationSuccess]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validation.isValid) return;

    try {
      if (useBiometric && canUseBiometric) {
        // Use biometric signing
        await signVisitorBookWithBiometric(message);
      } else {
        // Fall back to EIP-712 signing
        await signVisitorBook(message);
      }
      setMessage(''); // Clear form on success
      onSuccess?.();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to sign visitor book';
      setError(errorMessage);
      console.error('Failed to sign visitor book:', error);
      
      // If biometric fails, fall back to EIP-712
      if (useBiometric && canUseBiometric) {
        try {
          await signVisitorBook(message);
          setMessage('');
          onSuccess?.();
        } catch (fallbackError) {
          console.error('Fallback signing also failed:', fallbackError);
        }
      }
    }
  };

  const handleRegisterBiometric = async () => {
    try {
      setError(null);
      await registerKey();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to register biometric key';
      setError(errorMessage);
      console.error('Failed to register biometric key:', err);
    }
  };

  const isLoading = isEIP712Pending || isEIP712Confirming || isBiometricPending || isBiometricConfirming || isRegistering;
  const isSuccess = isEIP712Success || isBiometricSuccess;

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

            {/* Biometric registration prompt */}
            {shouldShowBiometricOption && !isBiometricRegistered && !isRegistering && (
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                      Enable Biometric Signing
                    </p>
                    <p className="text-xs text-blue-700 dark:text-blue-300 mb-3">
                      Register your biometric key to sign with Face ID/Touch ID for enhanced security.
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleRegisterBiometric}
                      className="w-full"
                    >
                      <Fingerprint className="h-4 w-4 mr-2" />
                      Register Biometric Key
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Signing method selection */}
            {shouldShowBiometricOption && isBiometricRegistered && (
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={useBiometric ? "default" : "outline"}
                  onClick={() => setUseBiometric(true)}
                  disabled={isLoading}
                  className="flex-1"
                >
                  <Fingerprint className="h-4 w-4 mr-2" />
                  {capability?.methods.includes('face') ? 'Face ID' : capability?.methods.includes('fingerprint') ? 'Touch ID' : 'Biometric'}
                </Button>
                <Button
                  type="button"
                  variant={!useBiometric ? "default" : "outline"}
                  onClick={() => setUseBiometric(false)}
                  disabled={isLoading}
                  className="flex-1"
                >
                  <Shield className="h-4 w-4 mr-2" />
                  EIP-712
                </Button>
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={!validation.isValid || isLoading}
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {isRegistering && 'Registering...'}
              {isEIP712Pending && 'Signing with EIP-712...'}
              {isBiometricPending && 'Authenticating...'}
              {isEIP712Confirming && 'Confirming transaction...'}
              {isBiometricConfirming && 'Confirming transaction...'}
              {!isLoading && (
                <>
                  {useBiometric && canUseBiometric 
                    ? `Sign with ${capability?.methods.includes('face') ? 'Face ID' : capability?.methods.includes('fingerprint') ? 'Touch ID' : 'Biometric'}`
                    : 'Sign Visitor Book'}
                </>
              )}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
