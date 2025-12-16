'use client';

/**
 * Vote Project Button
 * Button component for voting on projects
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useVote } from '@/hooks/contracts/useProjectVoting';
import { useAccount } from 'wagmi';
import { Loader2, Vote } from 'lucide-react';

interface VoteProjectButtonProps {
  projectId: string;
  voteCount?: number;
  size?: 'sm' | 'lg';
}

export function VoteProjectButton({ projectId, voteCount = 0, size = 'sm' }: VoteProjectButtonProps) {
  const { isConnected } = useAccount();
  const { vote, isPending, isConfirming } = useVote(projectId);
  const [isVoting, setIsVoting] = useState(false);

  const handleVote = async () => {
    if (!isConnected) {
      alert('Please connect your wallet to vote');
      return;
    }

    try {
      setIsVoting(true);
      await vote();
      alert('Vote submitted!');
    } catch (error: any) {
      alert(error?.message || 'Failed to vote');
    } finally {
      setIsVoting(false);
    }
  };

  const isLoading = isPending || isConfirming || isVoting;

  if (!isConnected) {
    return (
      <Button size={size} variant="outline" disabled>
        Connect to Vote
      </Button>
    );
  }

  return (
    <Button
      size={size}
      variant="secondary"
      onClick={handleVote}
      disabled={isLoading}
      className="gap-2"
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Voting...
        </>
      ) : (
        <>
          <Vote className="w-4 h-4" />
          Vote {voteCount > 0 && `(${voteCount})`}
        </>
      )}
    </Button>
  );
}

