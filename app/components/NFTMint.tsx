'use client'

import { useWriteContract, useReadContract, useWaitForTransactionReceipt } from 'wagmi'
import { useAppKitAccount } from '@reown/appkit/react'
import { useState, useEffect } from 'react'
import { CONTRACT_ADDRESSES, VISIT_NFT_ABI, getContractAddress } from '@/lib/contracts'
import { Gift, CheckCircle2, Users, ExternalLink, Hexagon, Star } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useToast } from '@/app/contexts/ToastContext'
import { getBaseScanURL } from '@/lib/utils'
import { getErrorMessage } from '@/lib/errors'

export function NFTMint() {
  const { address, isConnected } = useAppKitAccount()
  const walletAddress = address as `0x${string}` | undefined
  const [isMinting, setIsMinting] = useState(false)
  const [hasMinted, setHasMinted] = useState(false)
  const [txHash, setTxHash] = useState<`0x${string}` | null>(null)
  const { success, error, loading: showLoadingToast, removeToast } = useToast()
  const contractAddress = getContractAddress('VISIT_NFT')

  // Check if user has already minted
  const { data: userHasMinted } = useReadContract({
    address: contractAddress!,
    abi: VISIT_NFT_ABI,
    functionName: 'hasMinted',
    args: walletAddress ? [walletAddress] : undefined,
    query: {
      enabled: !!address && !!contractAddress,
    },
  })

  // Get total supply
  const { data: totalSupply } = useReadContract({
    address: contractAddress!,
    abi: VISIT_NFT_ABI,
    functionName: 'totalSupply',
    query: {
      enabled: !!contractAddress,
    },
  })

  // Get remaining supply
  const { data: remainingSupply } = useReadContract({
    address: contractAddress!,
    abi: VISIT_NFT_ABI,
    functionName: 'remainingSupply',
    query: {
      enabled: !!contractAddress,
    },
  })

  // Wait for transaction receipt
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: txHash || undefined,
  })

  useEffect(() => {
    if (isConfirmed && txHash) {
      success('NFT minted successfully!', {
        link: {
          label: 'View on Basescan',
          href: getBaseScanURL(txHash, 'tx'),
        },
      })
      setHasMinted(true)
      setTxHash(null)
    }
  }, [isConfirmed, txHash, success])

  const { writeContractAsync } = useWriteContract()

  const handleMint = async () => {
    if (!isConnected || !address || !contractAddress) {
      if (!isConnected) {
        error('Please connect your wallet')
      }
      return
    }

    setIsMinting(true)
    const loadingToastId = showLoadingToast('Minting NFT...')
    
    try {
      const hash = await writeContractAsync({
        address: contractAddress,
        abi: VISIT_NFT_ABI,
        functionName: 'mintVisitNFT',
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
      setIsMinting(false)
    }
  }

  const alreadyMinted = hasMinted || userHasMinted
  const supplyLeft = remainingSupply ? Number(remainingSupply) : 0
  const mintedCount = totalSupply ? Number(totalSupply) : 0
  const maxSupply = 100
  const progressPercent = (mintedCount / maxSupply) * 100

  // Disconnected state
  if (!isConnected) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative h-full rounded-3xl overflow-hidden"
      >
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-background to-secondary/5" />
        <div className="absolute top-0 left-0 w-64 h-64 bg-accent/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-48 h-48 bg-secondary/10 rounded-full blur-3xl" />
        
        {/* Card */}
        <div className="relative glass-card h-full rounded-3xl border border-glass-border p-10 sm:p-14 lg:p-16 flex flex-col items-center justify-center text-center">
          <motion.div
            animate={{ 
              y: [0, -8, 0],
              rotateY: [0, 180, 360]
            }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="relative mb-6"
          >
            <div className="absolute inset-0 bg-accent/20 rounded-full blur-xl" />
            <div className="relative p-5 rounded-2xl bg-gradient-to-br from-accent/20 to-secondary/20 border border-accent/30">
              <Gift className="h-10 w-10 text-accent" />
            </div>
          </motion.div>
          
          <h3 className="text-xl sm:text-2xl font-mono font-bold text-foreground mb-3">
            Proof of Visit NFT
          </h3>
          <p className="text-foreground-secondary text-sm sm:text-base max-w-xs mb-4">
            Connect your wallet to mint your exclusive Visit NFT
          </p>
          <div className="flex items-center gap-2 text-xs text-accent">
            <Star className="h-3.5 w-3.5" />
            <span>Limited to 100 visitors</span>
          </div>
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
      <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-background to-secondary/5" />
      <motion.div
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.1, 0.2, 0.1]
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/4 left-1/4 w-72 h-72 bg-accent/20 rounded-full blur-3xl"
      />
      <motion.div
        animate={{ 
          scale: [1.2, 1, 1.2],
          opacity: [0.15, 0.1, 0.15]
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-1/4 right-1/4 w-56 h-56 bg-secondary/20 rounded-full blur-3xl"
      />
      
      {/* Floating hexagons */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-accent/10"
            style={{
              left: `${20 + i * 20}%`,
              top: `${10 + i * 15}%`,
            }}
            animate={{
              y: [0, -20, 0],
              rotate: [0, 180, 360],
              opacity: [0.1, 0.2, 0.1],
            }}
            transition={{
              duration: 8 + i * 2,
              repeat: Infinity,
              delay: i * 0.5,
            }}
          >
            <Hexagon className="h-8 w-8" />
          </motion.div>
        ))}
      </div>
      
      {/* Main card */}
      <div className="relative glass-card h-full rounded-3xl border border-glass-border p-8 sm:p-12 lg:p-16">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-8 sm:mb-10">
          <div className="flex items-center gap-4 sm:gap-5">
            <motion.div
              whileHover={{ scale: 1.1, rotate: -5 }}
              className="relative flex-shrink-0"
            >
              <div className="absolute inset-0 bg-accent/30 rounded-2xl blur-lg" />
              <div className="relative p-3 sm:p-4 rounded-2xl bg-gradient-to-br from-accent/25 to-secondary/20 border border-accent/30 shadow-lg shadow-accent/20">
                <Gift className="h-6 w-6 sm:h-7 sm:w-7 text-accent" />
              </div>
            </motion.div>
            <div className="min-w-0">
              <h3 className="text-xl sm:text-2xl font-mono font-bold gradient-text">
                Proof of Visit
              </h3>
              <p className="text-xs sm:text-sm text-foreground-secondary mt-1">
                Exclusive NFT Collection
              </p>
            </div>
          </div>
          
          {/* Edition badge */}
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="px-3 py-1.5 rounded-full text-xs font-medium bg-gradient-to-r from-accent/20 to-secondary/20 text-accent border border-accent/30 flex items-center gap-1.5 flex-shrink-0"
          >
            <Star className="h-3 w-3" />
            <span>Limited Edition</span>
          </motion.div>
        </div>

        {/* Supply Progress */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="relative mb-8 sm:mb-10 p-6 sm:p-8 lg:p-10 rounded-2xl bg-gradient-to-br from-white/5 to-transparent border border-white/10"
        >
          <div className="flex items-center justify-between gap-4 mb-5">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-foreground-secondary" />
              <span className="text-sm text-foreground-secondary">Minted</span>
            </div>
            <span className="font-mono text-foreground font-semibold flex-shrink-0">
              {mintedCount} <span className="text-foreground-secondary">/ {maxSupply}</span>
            </span>
          </div>
          
          {/* Progress bar */}
          <div className="relative h-3 rounded-full bg-white/5 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-accent via-secondary to-accent"
            />
            {/* Shine effect */}
            <motion.div
              animate={{ x: [-100, 200] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              className="absolute inset-y-0 w-20 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12"
            />
          </div>
          
          {/* Remaining count */}
          {supplyLeft > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex items-center justify-center gap-2 mt-4 text-sm"
            >
              <Star className="h-4 w-4 text-accent" />
              <span className="text-foreground-secondary">
                <span className="font-semibold text-accent">{supplyLeft}</span> NFTs remaining
              </span>
            </motion.div>
          )}
        </motion.div>

        {/* NFT Preview Card */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300 }}
          className="relative mb-8 sm:mb-10 p-5 sm:p-6 lg:p-8 rounded-2xl bg-gradient-to-br from-accent/10 via-secondary/5 to-primary/10 border border-accent/20 overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 rounded-full blur-2xl" />
          
          <div className="relative flex items-center gap-4 sm:gap-5">
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-gradient-to-br from-accent/30 to-secondary/30 border border-accent/30 flex items-center justify-center overflow-hidden flex-shrink-0">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
              />
              <Hexagon className="h-8 w-8 sm:h-10 sm:w-10 text-accent relative z-10" />
            </div>
            
            <div className="flex-1 min-w-0">
              <h4 className="font-mono font-bold text-foreground mb-2">
                Visitor Pass #{mintedCount + 1}
              </h4>
              <p className="text-xs sm:text-sm text-foreground-secondary mb-3">
                Proof of visiting OneTrueHomie's portfolio
              </p>
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                <span className="text-xs px-2 py-0.5 rounded-full bg-accent/20 text-accent">ERC-721</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-secondary/20 text-secondary">Base</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Action Section */}
        <AnimatePresence mode="wait">
          {alreadyMinted ? (
            <motion.div
              key="minted"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="relative p-5 rounded-2xl bg-gradient-to-br from-primary/15 to-accent/10 border border-primary/25"
            >
              <div className="flex items-start gap-4">
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="p-3 rounded-xl bg-primary/20 border border-primary/30"
                >
                  <CheckCircle2 className="h-6 w-6 text-primary" />
                </motion.div>
                <div className="flex-1">
                  <h4 className="font-semibold text-foreground mb-1">
                    NFT Successfully Minted!
                  </h4>
                  <p className="text-sm text-foreground-secondary mb-3">
                    Your Proof of Visit NFT is now in your wallet
                  </p>
                  <motion.a
                    href="#"
                    whileHover={{ x: 4 }}
                    className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary-hover transition-colors"
                  >
                    <span>View on OpenSea</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </motion.a>
                </div>
              </div>
            </motion.div>
          ) : supplyLeft > 0 ? (
            <motion.button
              key="mint-button"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              onClick={handleMint}
              disabled={isMinting || isConfirming}
              className="w-full relative group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-accent via-secondary to-accent rounded-2xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity" />
              <div className="relative flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-gradient-to-r from-accent to-secondary text-white font-semibold text-base sm:text-lg shadow-lg shadow-accent/25 hover:shadow-xl hover:shadow-accent/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                {isMinting || isConfirming ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <Gift className="h-5 w-5" />
                    </motion.div>
                    <span>{isConfirming ? 'Confirming...' : 'Minting...'}</span>
                  </>
                ) : (
                  <>
                    <Gift className="h-5 w-5" />
                    <span>Mint Free NFT</span>
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <Star className="h-4 w-4" />
                    </motion.div>
                  </>
                )}
              </div>
            </motion.button>
          ) : (
            <motion.div
              key="sold-out"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-center p-6 rounded-2xl bg-white/5 border border-white/10"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-foreground-secondary/10 text-foreground-secondary mb-3">
                <span className="font-mono font-bold">SOLD OUT</span>
              </div>
              <p className="text-sm text-foreground-secondary">
                All Visit NFTs have been claimed!
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
