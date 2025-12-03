'use client'

import { useAccount } from 'wagmi'
import { WalletConnect } from './WalletConnect'
import { NetworkIndicator } from './NetworkIndicator'
import { GasTracker } from './GasTracker'
import { BlockHeightCounter } from './BlockHeightCounter'
import { motion } from 'framer-motion'
import { ArrowDown, Sparkles } from 'lucide-react'

export function Hero() {
  const { isConnected } = useAccount()

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center px-4 py-20 overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse-glow" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <h1 className="text-5xl md:text-7xl font-mono font-bold mb-6 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            Web3 Portfolio Protocol
          </h1>
          <p className="text-xl md:text-2xl text-foreground-secondary mb-4">
            Full-Stack Blockchain Developer
          </p>
          <p className="text-lg text-foreground-secondary/80 max-w-2xl mx-auto">
            Connect your wallet to explore interactive blockchain projects, smart contracts, and decentralized technologies.
            Every interaction demonstrates real Web3 expertise.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex flex-col items-center gap-6 mb-12"
        >
          {!isConnected ? (
            <>
              <WalletConnect />
              <div className="flex items-center gap-2 text-foreground-secondary animate-float">
                <ArrowDown className="h-5 w-5" />
                <span className="text-sm">Connect to unlock full experience</span>
              </div>
            </>
          ) : (
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="flex flex-col items-center gap-4"
            >
              <div className="flex items-center gap-2 text-primary">
                <Sparkles className="h-5 w-5" />
                <span className="font-mono">Welcome! Explore the portfolio below.</span>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Live Stats */}
        {isConnected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex flex-wrap items-center justify-center gap-4 mb-8"
          >
            <NetworkIndicator />
            <GasTracker />
            <BlockHeightCounter />
          </motion.div>
        )}
      </div>

      {/* Scroll indicator */}
      {isConnected && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-foreground-secondary"
          >
            <ArrowDown className="h-6 w-6" />
          </motion.div>
        </motion.div>
      )}
    </section>
  )
}


