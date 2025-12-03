'use client'

import { useAccount, useWriteContract, useReadContract } from 'wagmi'
import { useState, useEffect } from 'react'
import { CONTRACT_ADDRESSES, PORTFOLIO_TOKEN_ABI } from '@/lib/contracts'
import { formatAddress } from '@/lib/utils'
import { Coins, CheckCircle2, Clock } from 'lucide-react'
import { motion } from 'framer-motion'

export function TokenFaucet() {
  const { address, isConnected } = useAccount()
  const [isClaiming, setIsClaiming] = useState(false)
  const [canClaim, setCanClaim] = useState(false)
  const [timeUntilClaim, setTimeUntilClaim] = useState(0)

  // Check faucet status
  const { data: faucetStatus } = useReadContract({
    address: CONTRACT_ADDRESSES.PORTFOLIO_TOKEN as `0x${string}`,
    abi: PORTFOLIO_TOKEN_ABI,
    functionName: 'canClaimFaucet',
    args: [address!],
    query: {
      enabled: !!address && !!CONTRACT_ADDRESSES.PORTFOLIO_TOKEN,
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

  // Get faucet amount
  const { data: faucetAmount } = useReadContract({
    address: CONTRACT_ADDRESSES.PORTFOLIO_TOKEN as `0x${string}`,
    abi: PORTFOLIO_TOKEN_ABI,
    functionName: 'FAUCET_AMOUNT',
    query: {
      enabled: !!CONTRACT_ADDRESSES.PORTFOLIO_TOKEN,
    },
  })

  const { writeContract } = useWriteContract()

  useEffect(() => {
    if (faucetStatus) {
      setCanClaim(faucetStatus[0])
      setTimeUntilClaim(Number(faucetStatus[1]))
    }
  }, [faucetStatus])

  // Update countdown timer
  useEffect(() => {
    if (timeUntilClaim > 0) {
      const timer = setInterval(() => {
        setTimeUntilClaim((prev) => Math.max(0, prev - 1))
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [timeUntilClaim])

  const handleClaim = async () => {
    if (!isConnected || !address) return

    setIsClaiming(true)
    try {
      await writeContract({
        address: CONTRACT_ADDRESSES.PORTFOLIO_TOKEN as `0x${string}`,
        abi: PORTFOLIO_TOKEN_ABI,
        functionName: 'claimFaucet',
      })
    } catch (error) {
      console.error('Error claiming tokens:', error)
    } finally {
      setIsClaiming(false)
    }
  }

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hours}h ${minutes}m ${secs}s`
  }

  if (!isConnected) {
    return (
      <div className="glass rounded-lg p-4 text-center">
        <p className="text-sm text-foreground-secondary">
          Connect wallet to claim tokens
        </p>
      </div>
    )
  }

  return (
    <div className="glass rounded-lg p-4">
      <div className="flex items-center gap-2 mb-4">
        <Coins className="h-5 w-5 text-secondary" />
        <h3 className="font-mono font-bold text-foreground">Portfolio Token Faucet</h3>
      </div>

      <div className="space-y-4">
        {tokenBalance !== undefined && (
          <div className="text-sm">
            <span className="text-foreground-secondary">Balance: </span>
            <span className="font-mono text-foreground">
              {(Number(tokenBalance) / 1e18).toFixed(2)} PPT
            </span>
          </div>
        )}

        {faucetAmount && (
          <div className="text-sm text-foreground-secondary">
            Claim amount: {(Number(faucetAmount) / 1e18).toFixed(0)} PPT tokens
          </div>
        )}

        {canClaim ? (
          <button
            onClick={handleClaim}
            disabled={isClaiming}
            className="w-full glass hover:bg-opacity-20 rounded-lg px-4 py-2 flex items-center justify-center gap-2 text-secondary hover:text-secondary-hover transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
          >
            <Coins className="h-4 w-4" />
            <span>{isClaiming ? 'Claiming...' : 'Claim Tokens'}</span>
          </button>
        ) : timeUntilClaim > 0 ? (
          <div className="flex items-center gap-2 text-sm text-foreground-secondary">
            <Clock className="h-4 w-4" />
            <span>Next claim available in: {formatTime(timeUntilClaim)}</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm text-primary">
            <CheckCircle2 className="h-4 w-4" />
            <span>You've already claimed from the faucet</span>
          </div>
        )}
      </div>
    </div>
  )
}


