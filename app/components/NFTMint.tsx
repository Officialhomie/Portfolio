'use client'

import { useAccount, useWriteContract, useReadContract } from 'wagmi'
import { useState } from 'react'
import { CONTRACT_ADDRESSES, VISIT_NFT_ABI } from '@/lib/contracts'
import { Gift, CheckCircle2, Users } from 'lucide-react'
import { motion } from 'framer-motion'

export function NFTMint() {
  const { address, isConnected } = useAccount()
  const [isMinting, setIsMinting] = useState(false)
  const [hasMinted, setHasMinted] = useState(false)

  // Check if user has already minted
  const { data: userHasMinted } = useReadContract({
    address: CONTRACT_ADDRESSES.VISIT_NFT as `0x${string}`,
    abi: VISIT_NFT_ABI,
    functionName: 'hasMinted',
    args: [address!],
    query: {
      enabled: !!address && !!CONTRACT_ADDRESSES.VISIT_NFT,
    },
  })

  // Get total supply
  const { data: totalSupply } = useReadContract({
    address: CONTRACT_ADDRESSES.VISIT_NFT as `0x${string}`,
    abi: VISIT_NFT_ABI,
    functionName: 'totalSupply',
    query: {
      enabled: !!CONTRACT_ADDRESSES.VISIT_NFT,
    },
  })

  // Get remaining supply
  const { data: remainingSupply } = useReadContract({
    address: CONTRACT_ADDRESSES.VISIT_NFT as `0x${string}`,
    abi: VISIT_NFT_ABI,
    functionName: 'remainingSupply',
    query: {
      enabled: !!CONTRACT_ADDRESSES.VISIT_NFT,
    },
  })

  const { writeContract } = useWriteContract()

  const handleMint = async () => {
    if (!isConnected || !address) return

    setIsMinting(true)
    try {
      await writeContract({
        address: CONTRACT_ADDRESSES.VISIT_NFT as `0x${string}`,
        abi: VISIT_NFT_ABI,
        functionName: 'mintVisitNFT',
      })
      setHasMinted(true)
    } catch (error) {
      console.error('Error minting NFT:', error)
    } finally {
      setIsMinting(false)
    }
  }

  const alreadyMinted = hasMinted || userHasMinted
  const supplyLeft = remainingSupply ? Number(remainingSupply) : 0

  if (!isConnected) {
    return (
      <div className="glass-card rounded-xl p-12 text-center">
        <Gift className="h-16 w-16 text-foreground-secondary mx-auto mb-6 opacity-50" />
        <p className="text-base text-foreground-secondary mb-3">
          Connect your wallet to mint your free Visit NFT
        </p>
        <p className="text-sm text-foreground-secondary/80">
          Limited to first 100 visitors
        </p>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-xl p-8"
    >
      <div className="flex items-center gap-3 mb-8">
        <Gift className="h-7 w-7 text-accent" />
        <h2 className="text-2xl font-mono font-bold gradient-text">
          Proof of Visit NFT
        </h2>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between text-sm">
          <span className="text-foreground-secondary">Minted</span>
          <span className="font-mono text-foreground">
            {totalSupply ? Number(totalSupply) : 0} / 100
          </span>
        </div>

        <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${((totalSupply ? Number(totalSupply) : 0) / 100) * 100}%` }}
            transition={{ duration: 0.5 }}
            className="h-full bg-gradient-to-r from-primary to-accent"
          />
        </div>

        {supplyLeft > 0 && (
          <div className="flex items-center gap-2 text-xs text-foreground-secondary">
            <Users className="h-4 w-4" />
            <span>{supplyLeft} NFTs remaining</span>
          </div>
        )}

        {alreadyMinted ? (
          <div className="glass rounded-lg p-4 flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm font-medium text-foreground">
                You've already minted your Visit NFT!
              </p>
              <p className="text-xs text-foreground-secondary mt-1">
                Check your wallet to view your NFT
              </p>
            </div>
          </div>
        ) : supplyLeft > 0 ? (
          <button
            onClick={handleMint}
            disabled={isMinting}
            className="w-full glass hover:bg-opacity-20 rounded-lg px-6 py-3 flex items-center justify-center gap-2 text-accent hover:text-accent-hover transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            <Gift className="h-5 w-5" />
            <span>{isMinting ? 'Minting...' : 'Mint Free NFT'}</span>
          </button>
        ) : (
          <div className="glass rounded-lg p-4 text-center">
            <p className="text-sm text-foreground-secondary">
              All Visit NFTs have been minted!
            </p>
          </div>
        )}
      </div>
    </motion.div>
  )
}


