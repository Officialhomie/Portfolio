'use client';

/**
 * Visitor Book Form Component
 * Form for signing the visitor book
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useSignVisitorBook, useMessageValidation } from '@/hooks/contracts/useVisitorBook';
import { useAccount } from 'wagmi';
import { Loader2 } from 'lucide-react';

interface VisitorBookFormProps {
  onSuccess?: () => void;
}

export function VisitorBookForm({ onSuccess }: VisitorBookFormProps) {
  const { isConnected } = useAccount();
  const [message, setMessage] = useState('');
  const { signVisitorBook, isPending, isConfirming, isSuccess } = useSignVisitorBook();
  const validation = useMessageValidation(message);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validation.isValid) return;

    try {
      await signVisitorBook(message);
      setMessage(''); // Clear form on success
      onSuccess?.();
    } catch (error) {
      console.error('Failed to sign visitor book:', error);
    }
  };

  const isLoading = isPending || isConfirming;

  // Success state
  if (isSuccess) {
    setTimeout(() => {
      // Reset form after showing success message
      setMessage('');
    }, 2000);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sign the Visitor Book</CardTitle>
        <CardDescription>
          Leave a permanent message on the blockchain (1-500 characters)
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

            <Button
              type="submit"
              className="w-full"
              disabled={!validation.isValid || isLoading}
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              {isPending && 'Signing...'}
              {isConfirming && 'Confirming...'}
              {!isLoading && 'Sign Visitor Book'}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
