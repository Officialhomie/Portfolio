'use client'

import { useWriteContract, useReadContract, useWaitForTransactionReceipt } from 'wagmi'
import { useAppKitAccount } from '@reown/appkit/react'
import { useState, useEffect } from 'react'
import { CONTRACT_ADDRESSES, PORTFOLIO_TOKEN_ABI, getContractAddress } from '@/lib/contracts'
import { formatAddress, getBaseScanURL } from '@/lib/utils'
import { Coins, CheckCircle2, Clock, TrendingUp, Wallet, Zap } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useToast } from '@/app/contexts/ToastContext'
import { getErrorMessage } from '@/lib/errors'

export function TokenFaucet() {
  const { address, isConnected } = useAppKitAccount()
  const walletAddress = address as `0x${string}` | undefined
  const [isClaiming, setIsClaiming] = useState(false)
  const [canClaim, setCanClaim] = useState(false)
  const [timeUntilClaim, setTimeUntilClaim] = useState(0)
  const [txHash, setTxHash] = useState<`0x${string}` | null>(null)
  const { success, error, loading: showLoadingToast, removeToast } = useToast()
  const contractAddress = getContractAddress('PORTFOLIO_TOKEN')

  // Check faucet status
  const { data: faucetStatus } = useReadContract({
    address: contractAddress!,
    abi: PORTFOLIO_TOKEN_ABI,
    functionName: 'canClaimFaucet',
    args: walletAddress ? [walletAddress] : undefined,
    query: {
      enabled: !!address && !!contractAddress,
    },
  })

  // Get token balance
  const { data: tokenBalance } = useReadContract({
    address: contractAddress!,
    abi: PORTFOLIO_TOKEN_ABI,
    functionName: 'balanceOf',
    args: walletAddress ? [walletAddress] : undefined,
    query: {
      enabled: !!address && !!contractAddress,
    },
  })

  // Get faucet amount
  const { data: faucetAmount } = useReadContract({
    address: contractAddress!,
    abi: PORTFOLIO_TOKEN_ABI,
    functionName: 'FAUCET_AMOUNT',
    query: {
      enabled: !!contractAddress,
    },
  })

  // Wait for transaction receipt
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: txHash || undefined,
  })

  const { writeContractAsync } = useWriteContract()

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

  useEffect(() => {
    if (isConfirmed && txHash) {
      success('Tokens claimed successfully!', {
        link: {
          label: 'View on Basescan',
          href: getBaseScanURL(txHash, 'tx'),
        },
      })
      setTxHash(null)
    }
  }, [isConfirmed, txHash, success])

  const handleClaim = async () => {
    if (!isConnected || !address || !contractAddress) {
      error('Please connect your wallet')
      return
    }

    setIsClaiming(true)
    const loadingToastId = showLoadingToast('Claiming tokens...')
    
    try {
      const hash = await writeContractAsync({
        address: contractAddress,
        abi: PORTFOLIO_TOKEN_ABI,
        functionName: 'claimFaucet',
      })
      
      if (hash) {
        setTxHash(hash)
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
      setIsClaiming(false)
    }
  }

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const balance = tokenBalance !== undefined ? (Number(tokenBalance) / 1e18) : 0
  const claimAmount = faucetAmount ? (Number(faucetAmount) / 1e18) : 100

  // Disconnected state
  if (!isConnected) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative h-full rounded-3xl overflow-hidden"
      >
        {/* Background gradients */}
        <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 via-background to-primary/5" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-secondary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary/10 rounded-full blur-3xl" />
        
        {/* Glass card */}
        <div className="relative glass-card h-full rounded-3xl border border-glass-border p-10 sm:p-14 lg:p-16 flex flex-col items-center justify-center text-center">
          <motion.div
            animate={{ 
              rotate: [0, 10, -10, 0],
              scale: [1, 1.05, 1]
            }}
            transition={{ duration: 4, repeat: Infinity }}
            className="relative mb-6"
          >
            <div className="absolute inset-0 bg-secondary/20 rounded-full blur-xl" />
            <div className="relative p-5 rounded-2xl bg-gradient-to-br from-secondary/20 to-primary/20 border border-secondary/30">
              <Coins className="h-10 w-10 text-secondary" />
            </div>
          </motion.div>
          
          <h3 className="text-xl sm:text-2xl font-mono font-bold text-foreground mb-3">
            Token Faucet
          </h3>
          <p className="text-foreground-secondary text-sm sm:text-base max-w-xs">
            Connect your wallet to claim free Portfolio Tokens
          </p>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative h-full rounded-3xl overflow-hidden"
    >
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 via-background to-primary/5" />
      <motion.div
        animate={{ 
          x: [0, 20, 0],
          y: [0, -20, 0],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-0 right-0 w-72 h-72 bg-secondary/15 rounded-full blur-3xl"
      />
      <motion.div
        animate={{ 
          x: [0, -15, 0],
          y: [0, 15, 0],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-0 left-0 w-56 h-56 bg-primary/15 rounded-full blur-3xl"
      />
      
      {/* Grid pattern */}
      <div className="absolute inset-0 opacity-[0.02]" style={{
        backgroundImage: `radial-gradient(circle at 1px 1px, rgb(255 255 255) 1px, transparent 0)`,
        backgroundSize: '32px 32px'
      }} />
      
      {/* Main card */}
      <div className="relative glass-card h-full rounded-3xl border border-glass-border p-8 sm:p-12 lg:p-16">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-8 sm:mb-10">
          <div className="flex items-center gap-4 sm:gap-5">
            <motion.div
              whileHover={{ scale: 1.1, rotate: 5 }}
              className="relative flex-shrink-0"
            >
              <div className="absolute inset-0 bg-secondary/30 rounded-2xl blur-lg" />
              <div className="relative p-3 sm:p-4 rounded-2xl bg-gradient-to-br from-secondary/25 to-primary/20 border border-secondary/30 shadow-lg shadow-secondary/20">
                <Coins className="h-6 w-6 sm:h-7 sm:w-7 text-secondary" />
              </div>
            </motion.div>
            <div className="min-w-0">
              <h3 className="text-xl sm:text-2xl font-mono font-bold gradient-text">
                Token Faucet
              </h3>
              <p className="text-xs sm:text-sm text-foreground-secondary mt-1">
                Claim free PPT tokens
              </p>
            </div>
          </div>
          
          {/* Status indicator */}
          <motion.div
            animate={canClaim ? { scale: [1, 1.1, 1] } : {}}
            transition={{ duration: 2, repeat: Infinity }}
            className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 flex-shrink-0 ${
              canClaim 
                ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${canClaim ? 'bg-green-400' : 'bg-amber-400'}`} />
            {canClaim ? 'Ready' : 'Cooldown'}
          </motion.div>
        </div>

        {/* Balance Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="relative mb-8 sm:mb-10 p-6 sm:p-8 lg:p-10 rounded-2xl bg-gradient-to-br from-white/5 to-transparent border border-white/10 overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/10 rounded-full blur-2xl" />
          
          <div className="relative flex items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-foreground-secondary text-sm mb-3">
                <Wallet className="h-4 w-4" />
                <span>Your Balance</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-mono font-bold text-foreground">
                  {balance.toFixed(2)}
                </span>
                <span className="text-lg text-secondary font-medium">PPT</span>
              </div>
            </div>
            
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="p-3 rounded-full bg-gradient-to-br from-secondary/20 to-primary/10 border border-secondary/20 flex-shrink-0"
            >
              <TrendingUp className="h-5 w-5 text-secondary" />
            </motion.div>
          </div>
        </motion.div>

        {/* Claim Amount Info */}
        <div className="flex items-center justify-between gap-4 mb-8 sm:mb-10 p-5 sm:p-6 lg:p-7 rounded-xl bg-primary/5 border border-primary/10">
          <div className="flex items-center gap-2">
            <Coins className="h-4 w-4 text-primary" />
            <span className="text-sm text-foreground-secondary">Claim Amount</span>
          </div>
          <span className="font-mono text-foreground font-semibold flex-shrink-0">
            +{claimAmount.toFixed(0)} PPT
          </span>
        </div>

        {/* Action Section */}
        <AnimatePresence mode="wait">
          {canClaim ? (
            <motion.button
              key="claim-button"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              onClick={handleClaim}
              disabled={isClaiming || isConfirming}
              className="w-full relative group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-secondary via-primary to-secondary rounded-2xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity" />
              <div className="relative flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-gradient-to-r from-secondary to-primary text-white font-semibold text-base sm:text-lg shadow-lg shadow-secondary/25 hover:shadow-xl hover:shadow-secondary/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                {isClaiming || isConfirming ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <Zap className="h-5 w-5" />
                    </motion.div>
                    <span>{isConfirming ? 'Confirming...' : 'Claiming...'}</span>
                  </>
                ) : (
                  <>
                    <Coins className="h-5 w-5" />
                    <span>Claim Free Tokens</span>
                    <motion.div
                      animate={{ x: [0, 4, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      →
                    </motion.div>
                  </>
                )}
              </div>
            </motion.button>
          ) : timeUntilClaim > 0 ? (
            <motion.div
              key="countdown"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="relative p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-amber-500/20">
                    <Clock className="h-5 w-5 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-sm text-foreground-secondary">Next claim available in</p>
                    <p className="text-lg font-mono font-bold text-amber-400">
                      {formatTime(timeUntilClaim)}
                    </p>
                  </div>
                </div>
                
                {/* Progress ring */}
                <div className="relative w-14 h-14">
                  <svg className="w-14 h-14 -rotate-90">
                    <circle
                      cx="28"
                      cy="28"
                      r="24"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="transparent"
                      className="text-amber-500/20"
                    />
                    <motion.circle
                      cx="28"
                      cy="28"
                      r="24"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="transparent"
                      strokeLinecap="round"
                      className="text-amber-400"
                      initial={{ strokeDasharray: "150.8", strokeDashoffset: "150.8" }}
                      animate={{ 
                        strokeDashoffset: 150.8 * (timeUntilClaim / 86400)
                      }}
                      transition={{ duration: 0.5 }}
                    />
                  </svg>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="claimed"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-3 p-5 rounded-2xl bg-primary/10 border border-primary/20"
            >
              <div className="p-2 rounded-xl bg-primary/20">
                <CheckCircle2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground">Already Claimed</p>
                <p className="text-sm text-foreground-secondary">
                  You've claimed from the faucet
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
