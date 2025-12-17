'use client';

/**
 * Vote Button Component with Biometric Support
 * Allows users to vote for projects with optional biometric authentication
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useVote, useVoteWithBiometric, useCanVote } from '@/hooks/contracts/useProjectVoting';
import { useBiometricAuth } from '@/hooks/useBiometric';
import { useAccount } from 'wagmi';
import { Loader2, Fingerprint } from 'lucide-react';
import { BiometricPrompt } from '@/components/biometric/biometric-prompt';

interface VoteButtonWithBiometricProps {
  projectId: string;
  size?: 'default' | 'sm' | 'lg';
  variant?: 'default' | 'outline' | 'secondary';
  onSuccess?: () => void;
}

export function VoteButtonWithBiometric({
  projectId,
  size = 'default',
  variant = 'default',
  onSuccess
}: VoteButtonWithBiometricProps) {
  const { isConnected } = useAccount();
  const { isEnabled: biometricEnabled } = useBiometricAuth();
  const { canVote, reason, isLoading: checkingEligibility } = useCanVote(projectId);
  const { vote, isPending: isPendingRegular, isConfirming: isConfirmingRegular, isSuccess: isSuccessRegular } = useVote(projectId);
  const { voteWithBiometric, isPending: isPendingBiometric, isConfirming: isConfirmingBiometric, isSuccess: isSuccessBiometric } = useVoteWithBiometric(projectId);
  
  const [showBiometricPrompt, setShowBiometricPrompt] = useState(false);
  const [pendingVote, setPendingVote] = useState(false);

  const isPending = isPendingRegular || isPendingBiometric;
  const isConfirming = isConfirmingRegular || isConfirmingBiometric;
  const isSuccess = isSuccessRegular || isSuccessBiometric;

  const handleVote = async () => {
    if (biometricEnabled) {
      // Show biometric prompt first
      setShowBiometricPrompt(true);
      setPendingVote(true);
    } else {
      // Regular vote without biometric
      try {
        await vote();
        onSuccess?.();
      } catch (error) {
        console.error('Vote failed:', error);
      }
    }
  };

  const handleBiometricSuccess = async () => {
    setShowBiometricPrompt(false);
    try {
      await voteWithBiometric();
      setPendingVote(false);
      onSuccess?.();
    } catch (error) {
      console.error('Biometric vote failed:', error);
      setPendingVote(false);
    }
  };

  const handleBiometricCancel = () => {
    setShowBiometricPrompt(false);
    setPendingVote(false);
    // Fallback to regular vote
    vote().catch(console.error);
  };

  const isLoading = isPending || isConfirming || checkingEligibility || pendingVote;

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
    <>
      <Button
        size={size}
        variant={variant}
        onClick={handleVote}
        disabled={isLoading}
        className="gap-2"
      >
        {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
        {biometricEnabled && !isLoading && <Fingerprint className="h-4 w-4" />}
        {isPending && 'Voting...'}
        {isConfirming && 'Confirming...'}
        {!isLoading && `Vote (10 $HOMIE)`}
      </Button>

      {/* Biometric Prompt */}
      <BiometricPrompt
        open={showBiometricPrompt}
        onSuccess={handleBiometricSuccess}
        onCancel={handleBiometricCancel}
        message="Please authenticate with your fingerprint or Face ID to vote"
      />
    </>
  );
}

