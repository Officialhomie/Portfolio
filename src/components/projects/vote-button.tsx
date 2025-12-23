'use client';

/**
 * Vote Button Component
 * Allows users to vote for projects (burns 10 HOMIE)
 * Uses smart wallet for transactions
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useVote, useCanVote } from '@/hooks/contracts/useProjectVoting';
import { useAccount } from 'wagmi';
import { Loader2 } from 'lucide-react';

interface VoteButtonProps {
  projectId: string;
  size?: 'default' | 'sm' | 'lg';
  variant?: 'default' | 'outline' | 'secondary';
  onSuccess?: () => void;
}

export function VoteButton({
  projectId,
  size = 'default',
  variant = 'default',
  onSuccess
}: VoteButtonProps) {
  const { isConnected } = useAccount();
  const { canVote, reason, isLoading: checkingEligibility } = useCanVote(projectId);
  const { vote, isPending, isConfirming, isSuccess } = useVote(projectId);

  const handleVote = async () => {
    try {
      await vote();
      onSuccess?.();
    } catch (error) {
      console.error('Vote failed:', error);
    }
  };

  const isLoading = isPending || isConfirming || checkingEligibility;

  // Not connected
  if (!isConnected) {
    return (
      <Button size={size} variant={variant} disabled>
        Connect Wallet to Vote
      </Button>
    );
  }

  // Success state
  if (isSuccess) {
    return (
      <Button size={size} variant="secondary" disabled>
        ✓ Voted!
      </Button>
    );
  }

  // Can't vote (already voted or insufficient balance)
  if (!canVote && !isLoading) {
    return (
      <Button
        size={size}
        variant="outline"
        disabled
        title={reason || undefined}
      >
        {reason === 'Already voted for this project' ? 'Already Voted' : 'Vote (10 $HOMIE)'}
      </Button>
    );
  }

  // Can vote
  return (
    <Button
      size={size}
      variant={variant}
      onClick={handleVote}
      disabled={isLoading}
      className="gap-2"
    >
      {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
      {isPending && 'Voting...'}
      {isConfirming && 'Confirming...'}
      {!isLoading && `Vote (10 $HOMIE)`}
    </Button>
  );
}
