'use client';

/**
 * Endorse Button Component
 * Allows users to endorse projects (free, on-chain)
 */

import { Button } from '@/components/ui/button';
import { useEndorseProject } from '@/hooks/contracts/useProjectNFT';
import { useAccount } from 'wagmi';
import { Loader2 } from 'lucide-react';

interface EndorseButtonProps {
  tokenId: bigint;
  size?: 'default' | 'sm' | 'lg';
  variant?: 'default' | 'outline' | 'secondary';
  onSuccess?: () => void;
}

export function EndorseButton({
  tokenId,
  size = 'sm',
  variant = 'outline',
  onSuccess
}: EndorseButtonProps) {
  const { isConnected } = useAccount();
  const { endorseProject, isPending, isConfirming, isSuccess } = useEndorseProject(tokenId);

  const handleEndorse = async () => {
    try {
      await endorseProject();
      onSuccess?.();
    } catch (error) {
      console.error('Endorse failed:', error);
    }
  };

  const isLoading = isPending || isConfirming;

  // Not connected
  if (!isConnected) {
    return (
      <Button size={size} variant={variant} disabled>
        Connect to Endorse
      </Button>
    );
  }

  // Success state
  if (isSuccess) {
    return (
      <Button size={size} variant="secondary" disabled>
        ✓ Endorsed!
      </Button>
    );
  }

  // Can endorse
  return (
    <Button
      size={size}
      variant={variant}
      onClick={handleEndorse}
      disabled={isLoading}
    >
      {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
      {isPending && 'Endorsing...'}
      {isConfirming && 'Confirming...'}
      {!isLoading && '👍 Endorse'}
    </Button>
  );
}
