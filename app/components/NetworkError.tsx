'use client'

import { useSwitchChain, useChainId } from 'wagmi'
import { useAppKitAccount } from '@reown/appkit/react'
import { base } from 'wagmi/chains'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { motion } from 'framer-motion'

export function NetworkError() {
  const { isConnected } = useAppKitAccount()
  const chainId = useChainId()
  const { switchChain } = useSwitchChain()
  const isWrongNetwork = isConnected && chainId !== base.id

  if (!isWrongNetwork) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed top-20 left-1/2 -translate-x-1/2 z-[60] glass-card rounded-xl p-4 border border-accent/30 shadow-2xl max-w-md mx-4"
    >
      <div className="flex items-center gap-3">
        <AlertCircle className="h-5 w-5 text-accent flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium text-foreground mb-1">
            Wrong Network
          </p>
          <p className="text-xs text-foreground-secondary">
            Please switch to Base to use this application
          </p>
        </div>
        <button
          onClick={() => switchChain({ chainId: base.id })}
          className="glass hover:bg-opacity-20 rounded-lg px-4 py-2 flex items-center gap-2 text-primary hover:text-primary-hover transition-all text-sm font-medium"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Switch</span>
        </button>
      </div>
    </motion.div>
  )
}
