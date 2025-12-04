'use client'

import { useAppKitAccount } from '@reown/appkit/react'
import { WalletConnect } from './WalletConnect'
import { NetworkIndicator } from './NetworkIndicator'
import { GasTracker } from './GasTracker'
import { BlockHeightCounter } from './BlockHeightCounter'
import { MetricsTicker } from './MetricsTicker'
import { motion, useScroll, useTransform } from 'framer-motion'
import { ArrowDown, Sparkles, Code2, Zap, Layers, Github, Twitter, Linkedin, ExternalLink, ChevronRight, Play } from 'lucide-react'
import { useEffect, useState } from 'react'

export function Hero() {
  const { isConnected } = useAppKitAccount()
  const { scrollY } = useScroll()
  const [mounted, setMounted] = useState(false)
  const [greeting, setGreeting] = useState('')

  const y1 = useTransform(scrollY, [0, 500], [0, 150])
  const y2 = useTransform(scrollY, [0, 500], [0, -100])
  const opacity = useTransform(scrollY, [0, 300], [1, 0])
  const scale = useTransform(scrollY, [0, 300], [1, 0.8])

  useEffect(() => {
    setMounted(true)

    // Dynamic greeting based on time
    const hour = new Date().getHours()
    if (hour < 12) setGreeting('Good morning')
    else if (hour < 18) setGreeting('Good afternoon')
    else setGreeting('Good evening')
  }, [])

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Minimal subtle background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          style={{ y: y1 }}
          className="absolute top-1/4 left-1/4 w-[800px] h-[800px] bg-primary/[0.02] rounded-full blur-3xl"
        />
      </div>

      {/* Main Content - Split Layout */}
      <div className="container-wide relative z-10 py-12 sm:py-16 lg:py-24">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Column - Content */}
          <motion.div
            style={{ opacity, scale }}
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            {/* Greeting Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-glass-bg border border-glass-border text-sm text-foreground-secondary"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-primary" />
              <span className="font-medium">{greeting}! Welcome</span>
            </motion.div>

            {/* Main Headline */}
            <div className="space-y-4">
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.1 }}
                className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-mono font-bold leading-tight"
              >
                <span className="gradient-text gradient-text-animate block">
                  Building the Future
                </span>
                <span className="text-foreground block mt-2">
                  with Web3 Technology
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="text-lg sm:text-xl text-foreground-secondary leading-relaxed max-w-2xl text-balance"
              >
                Full-stack blockchain developer specializing in smart contracts,
                decentralized applications, and Web3 infrastructure. Turning innovative
                ideas into production-ready solutions on Base Mainnet.
              </motion.p>
            </div>

            {/* Tech Badges */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="flex flex-wrap gap-2"
            >
              {[
                { icon: Code2, label: 'Smart Contracts' },
                { icon: Layers, label: 'IPFS Storage' },
                { icon: Zap, label: 'Base' },
              ].map((item, index) => {
                const Icon = item.icon
                return (
                  <motion.div
                    key={item.label}
                    whileHover={{ scale: 1.02 }}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-glass-bg border border-glass-border text-sm text-foreground-secondary hover:border-glass-border-hover transition-colors"
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span>{item.label}</span>
                  </motion.div>
                )
              })}
            </motion.div>

            {/* CTA Buttons */}
            {!isConnected ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="flex flex-col sm:flex-row gap-4 pt-4"
              >
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <WalletConnect />
                </motion.div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth' })
                  }}
                  className="btn btn-ghost btn-lg"
                >
                  <Play className="h-5 w-5" />
                  <span>View Projects</span>
                  <ChevronRight className="h-5 w-5" />
                </motion.button>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="space-y-6 pt-4"
              >
                {/* Welcome Message */}
                <motion.div
                  className="glass-card-elevated p-6 rounded-2xl border border-primary/20"
                  animate={{
                    boxShadow: [
                      '0 0 20px rgba(91, 126, 245, 0.2)',
                      '0 0 40px rgba(91, 126, 245, 0.3)',
                      '0 0 20px rgba(91, 126, 245, 0.2)',
                    ],
                  }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  <div className="flex items-center gap-3">
                    <motion.div
                      animate={{ rotate: [0, 360] }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                      className="p-2 rounded-xl bg-primary/20"
                    >
                      <Sparkles className="h-5 w-5 text-primary" />
                    </motion.div>
                    <div>
                      <p className="font-semibold text-foreground">Connected Successfully!</p>
                      <p className="text-sm text-foreground-secondary">Explore interactive features below</p>
                    </div>
                  </div>
                </motion.div>

                {/* Network Stats */}
                <div className="flex flex-wrap items-center gap-3">
                  <NetworkIndicator />
                  <GasTracker />
                  <BlockHeightCounter />
                </div>
              </motion.div>
            )}

            {/* Social Links */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="flex items-center gap-4 pt-4"
            >
              {[
                { icon: Github, href: 'https://github.com/Officialhomie', label: 'GitHub' },
                { icon: Twitter, href: 'https://twitter.com/Officialhomie', label: 'Twitter' },
                { icon: Linkedin, href: 'https://linkedin.com/in/officialhomie', label: 'LinkedIn' },
              ].map((social) => {
                const Icon = social.icon
                return (
                  <motion.a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.1, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    className="glass-card p-3 rounded-xl hover:border-primary/30 transition-colors"
                    aria-label={social.label}
                  >
                    <Icon className="h-5 w-5 text-foreground-secondary" />
                  </motion.a>
                )
              })}
            </motion.div>
          </motion.div>

          {/* Right Column - Metrics & Visual */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="space-y-8"
          >
            {/* Live Metrics */}
            <div className="space-y-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="flex items-center gap-2"
              >
                <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                <span className="text-sm font-mono text-foreground-secondary uppercase tracking-wider">
                  Live Portfolio Metrics
                </span>
              </motion.div>
              <MetricsTicker />
            </div>

            {/* Visual Element - Clean Stats Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.6 }}
              className="relative"
            >
              <div className="glass-card rounded-2xl p-8 border border-glass-border overflow-hidden">
                {/* Animated background grid */}
                <div
                  className="absolute inset-0 opacity-[0.02]"
                  style={{
                    backgroundImage: `radial-gradient(circle at 1px 1px, rgb(255 255 255) 1px, transparent 0)`,
                    backgroundSize: '32px 32px',
                  }}
                />

                {/* Content */}
                <div className="relative space-y-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-mono font-bold text-xl text-foreground">
                      Technical Skills
                    </h3>
                    <div className="px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
                      <span className="text-xs font-medium text-primary">Verified</span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {[
                      { label: 'Smart Contract Development', value: '98%' },
                      { label: 'Frontend Engineering', value: '95%' },
                      { label: 'Web3 Integration', value: '97%' },
                    ].map((skill, index) => (
                      <div key={skill.label} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-foreground-secondary">{skill.label}</span>
                          <span className="font-mono text-sm text-foreground">
                            {skill.value}
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full bg-glass-bg overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: skill.value }}
                            transition={{ duration: 1.5, delay: 0.8 + index * 0.2 }}
                            className="h-full rounded-full bg-primary"
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-4 border-t border-glass-border">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-foreground-secondary">Deployed on Base</span>
                      <span className="status-indicator status-online">Live</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="flex flex-col items-center gap-2"
        >
          <span className="text-xs font-mono text-foreground-secondary">Scroll to explore</span>
          <div className="w-6 h-10 border-2 border-primary/30 rounded-full flex items-start justify-center p-2">
            <motion.div
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-1.5 h-1.5 bg-primary rounded-full"
            />
          </div>
        </motion.div>
      </motion.div>

      {/* Decorative elements */}
      <div className="absolute top-20 right-10 w-20 h-20 border border-primary/20 rounded-lg rotate-12 animate-float" />
      <div className="absolute bottom-40 left-10 w-16 h-16 border border-secondary/20 rounded-lg -rotate-12 animate-float" style={{ animationDelay: '0.5s' }} />
    </section>
  )
}
