'use client'

import { useAccount } from 'wagmi'
import { WalletConnect } from './WalletConnect'
import { NetworkIndicator } from './NetworkIndicator'
import { GasTracker } from './GasTracker'
import { BlockHeightCounter } from './BlockHeightCounter'
import { motion, useScroll, useTransform } from 'framer-motion'
import { ArrowDown, Sparkles, Code2, Zap, Layers } from 'lucide-react'
import { useEffect, useState } from 'react'

export function Hero() {
  const { isConnected } = useAccount()
  const { scrollY } = useScroll()
  const [mounted, setMounted] = useState(false)

  const y1 = useTransform(scrollY, [0, 500], [0, 150])
  const y2 = useTransform(scrollY, [0, 500], [0, -100])
  const opacity = useTransform(scrollY, [0, 300], [1, 0])
  const scale = useTransform(scrollY, [0, 300], [1, 0.8])

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center px-4 py-20 overflow-hidden">
      {/* Animated background elements with parallax */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Primary glow orb */}
        <motion.div
          style={{ y: y1 }}
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse-glow"
        />

        {/* Secondary glow orb */}
        <motion.div
          style={{ y: y2, animationDelay: '1s' }}
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse-glow"
        />

        {/* Accent glow orb */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.5, delay: 0.5 }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-secondary/5 rounded-full blur-3xl"
        />

        {/* Grid overlay with fade */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(98,126,234,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(98,126,234,0.03)_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,black,transparent)]" />

        {/* Floating particles */}
        {mounted && Array.from({ length: 20 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-primary/30 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      <motion.div
        style={{ opacity, scale }}
        className="relative z-10 max-w-5xl mx-auto text-center"
      >
        {/* Animated badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8 inline-flex items-center gap-2 glass-card px-4 py-2 rounded-full"
        >
          <div className="flex items-center gap-2">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            >
              <Sparkles className="h-4 w-4 text-secondary" />
            </motion.div>
            <span className="text-sm font-mono text-foreground-secondary">
              Full-Stack Blockchain Developer
            </span>
          </div>
        </motion.div>

        {/* Main heading with gradient animation */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-mono font-bold mb-6">
            <span className="gradient-text gradient-text-animate block mb-2">
              Web3 Portfolio
            </span>
            <span className="text-foreground block">
              Protocol
            </span>
          </h1>
        </motion.div>

        {/* Subtitle with stagger animation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mb-8 space-y-4"
        >
          <p className="text-xl md:text-2xl text-foreground-secondary max-w-3xl mx-auto">
            Connect your wallet to explore interactive blockchain projects,
            smart contracts, and decentralized technologies.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-foreground-secondary/80">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-2 glass px-3 py-1.5 rounded-lg"
            >
              <Code2 className="h-4 w-4 text-primary" />
              <span>Smart Contracts</span>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-2 glass px-3 py-1.5 rounded-lg"
            >
              <Layers className="h-4 w-4 text-secondary" />
              <span>IPFS Storage</span>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-2 glass px-3 py-1.5 rounded-lg"
            >
              <Zap className="h-4 w-4 text-accent" />
              <span>Base Mainnet</span>
            </motion.div>
          </div>
        </motion.div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="flex flex-col items-center gap-6 mb-12"
        >
          {!isConnected ? (
            <>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <WalletConnect />
              </motion.div>
              <motion.div
                animate={{ y: [0, 8, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="flex items-center gap-2 text-foreground-secondary"
              >
                <ArrowDown className="h-5 w-5" />
                <span className="text-sm font-mono">Connect to unlock full experience</span>
              </motion.div>
            </>
          ) : (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", duration: 0.6 }}
              className="flex flex-col items-center gap-6"
            >
              <motion.div
                className="flex items-center gap-2 glass-card px-6 py-3 rounded-xl"
                animate={{
                  boxShadow: [
                    "0 0 20px rgba(98, 126, 234, 0.3)",
                    "0 0 40px rgba(98, 126, 234, 0.5)",
                    "0 0 20px rgba(98, 126, 234, 0.3)",
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  <Sparkles className="h-5 w-5 text-primary" />
                </motion.div>
                <span className="font-mono text-foreground">
                  Welcome! Explore the portfolio below.
                </span>
              </motion.div>
            </motion.div>
          )}
        </motion.div>

        {/* Live Stats Dashboard */}
        {isConnected && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="flex flex-wrap items-center justify-center gap-4"
          >
            <motion.div whileHover={{ scale: 1.05, y: -4 }}>
              <NetworkIndicator />
            </motion.div>
            <motion.div whileHover={{ scale: 1.05, y: -4 }}>
              <GasTracker />
            </motion.div>
            <motion.div whileHover={{ scale: 1.05, y: -4 }}>
              <BlockHeightCounter />
            </motion.div>
          </motion.div>
        )}
      </motion.div>

      {/* Scroll indicator */}
      {isConnected && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="absolute bottom-12 left-1/2 transform -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="flex flex-col items-center gap-2"
          >
            <span className="text-xs font-mono text-foreground-secondary">
              Scroll to explore
            </span>
            <div className="w-6 h-10 border-2 border-primary/30 rounded-full flex items-start justify-center p-2">
              <motion.div
                animate={{ y: [0, 12, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="w-1.5 h-1.5 bg-primary rounded-full"
              />
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Decorative elements */}
      <div className="absolute top-20 right-10 w-20 h-20 border border-primary/20 rounded-lg rotate-12 animate-float" />
      <div className="absolute bottom-40 left-10 w-16 h-16 border border-secondary/20 rounded-lg -rotate-12 animate-float" style={{ animationDelay: '0.5s' }} />
    </section>
  )
}
