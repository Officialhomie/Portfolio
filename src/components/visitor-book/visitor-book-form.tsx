'use client';

/**
 * Visitor Book Form Component
 * Form for signing the visitor book using smart wallet
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { 
  useSignVisitorBook, 
  useMessageValidation 
} from '@/hooks/contracts/useVisitorBook';
import { useAccount } from 'wagmi';
import { Loader2, CheckCircle } from 'lucide-react';
import { useSmartWallet } from '@/contexts/SmartWalletContext';

interface VisitorBookFormProps {
  onSuccess?: () => void;
}

export function VisitorBookForm({ onSuccess }: VisitorBookFormProps) {
  const { isConnected, address } = useAccount();
  const { executor, smartWalletAddress, isSendingTransaction } = useSmartWallet();
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  const validation = useMessageValidation(message);

  // Signing hook using smart wallet
  const {
    signVisitorBook,
    isPending,
    isConfirming,
    isSuccess,
    txHash
  } = useSignVisitorBook();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validation.isValid) return;

    if (!smartWalletAddress || !executor) {
      setError('Smart wallet not ready. Please wait for wallet initialization.');
      return;
    }

    try {
      await signVisitorBook(message);
      setMessage(''); // Clear form on success
      onSuccess?.();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to sign visitor book';
      setError(errorMessage);
      console.error('Sign visitor book failed:', error);
    }
  };

  const isLoading = isPending || isConfirming || isSendingTransaction;

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
        ) : !smartWalletAddress ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              Initializing smart wallet...
            </p>
            <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
          </div>
        ) : isSuccess ? (
          <div className="text-center py-8 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-center justify-center gap-2 mb-3">
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              <p className="text-green-800 dark:text-green-200 font-medium">
                Thank you for signing the visitor book!
              </p>
            </div>
            <p className="text-sm text-green-700 dark:text-green-300 mb-3">
              Your message has been permanently stored on-chain
            </p>
            {txHash && (
              <div className="mt-4 p-3 bg-white dark:bg-gray-800 rounded-lg border border-green-300 dark:border-green-700">
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 font-medium">
                  Transaction Hash:
                </p>
                <a
                  href={`https://basescan.org/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline break-all font-mono"
                >
                  {txHash.slice(0, 16)}...{txHash.slice(-14)}
                </a>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Click to view on BaseScan
                </p>
              </div>
            )}
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

            <Button
              type="submit"
              className="w-full"
              disabled={!validation.isValid || isLoading || !smartWalletAddress}
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {isConfirming && 'Confirming Transaction...'}
              {isPending && 'Preparing Transaction...'}
              {!isLoading && 'Sign Visitor Book'}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
