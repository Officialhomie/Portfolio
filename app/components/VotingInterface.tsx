'use client'

import { useWriteContract, useReadContract, useWaitForTransactionReceipt } from 'wagmi'
import { useAppKitAccount } from '@reown/appkit/react'
import { useState, useEffect } from 'react'
import { CONTRACT_ADDRESSES, PROJECT_VOTING_ABI, PORTFOLIO_TOKEN_ABI, getContractAddress } from '@/lib/contracts'
import { formatAddress, getBaseScanURL } from '@/lib/utils'
import { Vote, Coins, CheckCircle2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { parseEther } from 'viem'
import { useToast } from '@/app/contexts/ToastContext'
import { getErrorMessage } from '@/lib/errors'

interface VotingInterfaceProps {
  projectId: string
  projectName: string
}

export function VotingInterface({ projectId, projectName }: VotingInterfaceProps) {
  const { address, isConnected } = useAppKitAccount()
  const [isVoting, setIsVoting] = useState(false)
  const [isApproving, setIsApproving] = useState(false)
  const [approveTxHash, setApproveTxHash] = useState<`0x${string}` | null>(null)
  const [voteTxHash, setVoteTxHash] = useState<`0x${string}` | null>(null)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const { success, error, loading: showLoadingToast, removeToast } = useToast()
  const votingContractAddress = getContractAddress('PROJECT_VOTING')
  const tokenContractAddress = getContractAddress('PORTFOLIO_TOKEN')

  // Check if user has voted
  const { data: hasVoted } = useReadContract({
    address: votingContractAddress!,
    abi: PROJECT_VOTING_ABI,
    functionName: 'checkVote',
    args: [address!, projectId],
    query: {
      enabled: !!address && !!votingContractAddress,
    },
  })

  // Get vote count
  const { data: voteCount } = useReadContract({
    address: votingContractAddress!,
    abi: PROJECT_VOTING_ABI,
    functionName: 'getVotes',
    args: [projectId],
    query: {
      enabled: !!votingContractAddress,
    },
  })

  // Get vote cost
  const { data: voteCost } = useReadContract({
    address: votingContractAddress!,
    abi: PROJECT_VOTING_ABI,
    functionName: 'voteCost',
    query: {
      enabled: !!votingContractAddress,
    },
  })

  // Get token balance
  const { data: tokenBalance } = useReadContract({
    address: tokenContractAddress!,
    abi: PORTFOLIO_TOKEN_ABI,
    functionName: 'balanceOf',
    args: [address!],
    query: {
      enabled: !!address && !!tokenContractAddress,
    },
  })

  // Check token allowance
  const { data: allowance } = useReadContract({
    address: tokenContractAddress!,
    abi: PORTFOLIO_TOKEN_ABI,
    functionName: 'allowance',
    args: [address!, votingContractAddress!],
    query: {
      enabled: !!address && !!tokenContractAddress && !!votingContractAddress,
    },
  })

  // Wait for approve transaction
  const { isLoading: isApprovingConfirming, isSuccess: isApproveConfirmed } = useWaitForTransactionReceipt({
    hash: approveTxHash || undefined,
  })

  // Wait for vote transaction
  const { isLoading: isVotingConfirming, isSuccess: isVoteConfirmed } = useWaitForTransactionReceipt({
    hash: voteTxHash || undefined,
  })

  useEffect(() => {
    if (isApproveConfirmed && approveTxHash) {
      success('Tokens approved successfully!', {
        link: {
          label: 'View on Basescan',
          href: getBaseScanURL(approveTxHash, 'tx'),
        },
      })
      setApproveTxHash(null)
    }
  }, [isApproveConfirmed, approveTxHash, success])

  useEffect(() => {
    if (isVoteConfirmed && voteTxHash) {
      success(`Successfully voted for ${projectName}!`, {
        link: {
          label: 'View on Basescan',
          href: getBaseScanURL(voteTxHash, 'tx'),
        },
      })
      setVoteTxHash(null)
      setShowConfirmDialog(false)
    }
  }, [isVoteConfirmed, voteTxHash, success, projectName])

  const { writeContract } = useWriteContract()

  const handleApprove = async () => {
    if (!isConnected || !address || !voteCost || !tokenContractAddress || !votingContractAddress) {
      if (!isConnected) {
        error('Please connect your wallet')
      }
      return
    }

    setIsApproving(true)
    const loadingToastId = showLoadingToast('Approving tokens...')
    
    try {
      const hash = await writeContract({
        address: tokenContractAddress,
        abi: PORTFOLIO_TOKEN_ABI,
        functionName: 'approve',
        args: [votingContractAddress, voteCost],
      })
      
      if (hash) {
        setApproveTxHash(hash)
        removeToast(loadingToastId)
        showLoadingToast('Transaction submitted. Waiting for confirmation...')
      }
    } catch (err: unknown) {
      removeToast(loadingToastId)
      const errorMessage = getErrorMessage(err)
      if (!errorMessage.includes('cancelled') && !errorMessage.includes('rejected')) {
        error(errorMessage)
      }
    } finally {
      setIsApproving(false)
    }
  }

  const handleVote = async () => {
    if (!isConnected || !address || !votingContractAddress) {
      if (!isConnected) {
        error('Please connect your wallet')
      }
      return
    }

    setIsVoting(true)
    const loadingToastId = showLoadingToast('Submitting vote...')
    
    try {
      const hash = await writeContract({
        address: votingContractAddress,
        abi: PROJECT_VOTING_ABI,
        functionName: 'vote',
        args: [projectId],
      })
      
      if (hash) {
        setVoteTxHash(hash)
        removeToast(loadingToastId)
        showLoadingToast('Transaction submitted. Waiting for confirmation...')
      }
    } catch (err: unknown) {
      removeToast(loadingToastId)
      const errorMessage = getErrorMessage(err)
      if (!errorMessage.includes('cancelled') && !errorMessage.includes('rejected')) {
        error(errorMessage)
      }
      setShowConfirmDialog(false)
    } finally {
      setIsVoting(false)
    }
  }

  const hasEnoughTokens = tokenBalance 
    ? BigInt(tokenBalance) >= (voteCost || parseEther('10'))
    : false

  const hasEnoughAllowance = allowance && voteCost
    ? BigInt(allowance) >= BigInt(voteCost)
    : false

  if (!isConnected) {
    return (
      <div className="glass rounded-lg p-4 text-center">
        <p className="text-sm text-foreground-secondary">
          Connect wallet to vote
        </p>
      </div>
    )
  }

  return (
    <div className="glass rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Vote className="h-5 w-5 text-secondary" />
          <span className="font-mono text-sm text-foreground">Votes: {voteCount ? Number(voteCount) : 0}</span>
        </div>
        {hasVoted && (
          <div className="flex items-center gap-1 text-xs text-primary">
            <CheckCircle2 className="h-4 w-4" />
            <span>Voted</span>
          </div>
        )}
      </div>

      {!hasVoted ? (
        <div className="space-y-3">
          {voteCost && (
            <div className="flex items-center gap-2 text-xs text-foreground-secondary">
              <Coins className="h-4 w-4" />
              <span>Cost: {Number(voteCost) / 1e18} PPT tokens</span>
            </div>
          )}

          {!hasEnoughTokens && (
            <div className="text-xs text-accent">
              Insufficient tokens. Claim from faucet first.
            </div>
          )}

          {hasEnoughTokens && !hasEnoughAllowance && (
            <button
              onClick={handleApprove}
              disabled={isApproving || isApprovingConfirming}
              className="w-full glass hover:bg-opacity-20 rounded-lg px-4 py-2 text-secondary hover:text-secondary-hover transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
              {isApproving || isApprovingConfirming 
                ? (isApprovingConfirming ? 'Confirming...' : 'Approving...') 
                : 'Approve Tokens'}
            </button>
          )}

          {hasEnoughTokens && hasEnoughAllowance && (
            <>
              {!showConfirmDialog ? (
                <button
                  onClick={() => setShowConfirmDialog(true)}
                  className="w-full glass hover:bg-opacity-20 rounded-lg px-4 py-2 text-secondary hover:text-secondary-hover transition-all text-sm font-medium"
                >
                  Vote for {projectName}
                </button>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-foreground-secondary text-center">
                    Confirm your vote for {projectName}?
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowConfirmDialog(false)}
                      className="flex-1 glass hover:bg-opacity-20 rounded-lg px-4 py-2 text-foreground-secondary hover:text-foreground transition-all text-sm"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleVote}
                      disabled={isVoting || isVotingConfirming}
                      className="flex-1 glass hover:bg-opacity-20 rounded-lg px-4 py-2 text-secondary hover:text-secondary-hover transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                    >
                      {isVoting || isVotingConfirming 
                        ? (isVotingConfirming ? 'Confirming...' : 'Voting...') 
                        : 'Confirm Vote'}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        <p className="text-sm text-foreground-secondary">
          You've already voted for this project
        </p>
      )}
    </div>
  )
}


