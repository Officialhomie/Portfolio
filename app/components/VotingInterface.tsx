'use client'

import { useAccount, useWriteContract, useReadContract } from 'wagmi'
import { useState } from 'react'
import { CONTRACT_ADDRESSES, PROJECT_VOTING_ABI, PORTFOLIO_TOKEN_ABI } from '@/lib/contracts'
import { formatAddress } from '@/lib/utils'
import { Vote, Coins, CheckCircle2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { parseEther } from 'viem'

interface VotingInterfaceProps {
  projectId: string
  projectName: string
}

export function VotingInterface({ projectId, projectName }: VotingInterfaceProps) {
  const { address, isConnected } = useAccount()
  const [isVoting, setIsVoting] = useState(false)
  const [isApproving, setIsApproving] = useState(false)

  // Check if user has voted
  const { data: hasVoted } = useReadContract({
    address: CONTRACT_ADDRESSES.PROJECT_VOTING as `0x${string}`,
    abi: PROJECT_VOTING_ABI,
    functionName: 'checkVote',
    args: [address!, projectId],
    query: {
      enabled: !!address && !!CONTRACT_ADDRESSES.PROJECT_VOTING,
    },
  })

  // Get vote count
  const { data: voteCount } = useReadContract({
    address: CONTRACT_ADDRESSES.PROJECT_VOTING as `0x${string}`,
    abi: PROJECT_VOTING_ABI,
    functionName: 'getVotes',
    args: [projectId],
    query: {
      enabled: !!CONTRACT_ADDRESSES.PROJECT_VOTING,
    },
  })

  // Get vote cost
  const { data: voteCost } = useReadContract({
    address: CONTRACT_ADDRESSES.PROJECT_VOTING as `0x${string}`,
    abi: PROJECT_VOTING_ABI,
    functionName: 'voteCost',
    query: {
      enabled: !!CONTRACT_ADDRESSES.PROJECT_VOTING,
    },
  })

  // Get token balance
  const { data: tokenBalance } = useReadContract({
    address: CONTRACT_ADDRESSES.PORTFOLIO_TOKEN as `0x${string}`,
    abi: PORTFOLIO_TOKEN_ABI,
    functionName: 'balanceOf',
    args: [address!],
    query: {
      enabled: !!address && !!CONTRACT_ADDRESSES.PORTFOLIO_TOKEN,
    },
  })

  // Check token allowance
  const { data: allowance } = useReadContract({
    address: CONTRACT_ADDRESSES.PORTFOLIO_TOKEN as `0x${string}`,
    abi: PORTFOLIO_TOKEN_ABI,
    functionName: 'allowance',
    args: [address!, CONTRACT_ADDRESSES.PROJECT_VOTING as `0x${string}`],
    query: {
      enabled: !!address && !!CONTRACT_ADDRESSES.PORTFOLIO_TOKEN && !!CONTRACT_ADDRESSES.PROJECT_VOTING,
    },
  })

  const { writeContract } = useWriteContract()

  const handleApprove = async () => {
    if (!isConnected || !address || !voteCost) return

    setIsApproving(true)
    try {
      await writeContract({
        address: CONTRACT_ADDRESSES.PORTFOLIO_TOKEN as `0x${string}`,
        abi: PORTFOLIO_TOKEN_ABI,
        functionName: 'approve',
        args: [CONTRACT_ADDRESSES.PROJECT_VOTING as `0x${string}`, voteCost],
      })
    } catch (error) {
      console.error('Error approving tokens:', error)
    } finally {
      setIsApproving(false)
    }
  }

  const handleVote = async () => {
    if (!isConnected || !address) return

    setIsVoting(true)
    try {
      await writeContract({
        address: CONTRACT_ADDRESSES.PROJECT_VOTING as `0x${string}`,
        abi: PROJECT_VOTING_ABI,
        functionName: 'vote',
        args: [projectId],
      })
    } catch (error) {
      console.error('Error voting:', error)
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
              disabled={isApproving}
              className="w-full glass hover:bg-opacity-20 rounded-lg px-4 py-2 text-secondary hover:text-secondary-hover transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
              {isApproving ? 'Approving...' : 'Approve Tokens'}
            </button>
          )}

          {hasEnoughTokens && hasEnoughAllowance && (
            <button
              onClick={handleVote}
              disabled={isVoting}
              className="w-full glass hover:bg-opacity-20 rounded-lg px-4 py-2 text-secondary hover:text-secondary-hover transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
              {isVoting ? 'Voting...' : `Vote for ${projectName}`}
            </button>
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


