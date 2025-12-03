'use client'

import { Hero } from './components/Hero'
import { ProjectsShowcase } from './components/ProjectsShowcase'
import { VisitorBook } from './components/VisitorBook'
import { NFTMint } from './components/NFTMint'
import { TokenFaucet } from './components/TokenFaucet'
import { WalletConnect } from './components/WalletConnect'
import { motion } from 'framer-motion'
import { Sparkles, Shield, Database, Zap, Award, Globe } from 'lucide-react'

export default function Home() {
  return (
    <main className="relative min-h-screen">
      {/* Enhanced Header */}
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-glass-border backdrop-blur-xl"
      >
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <motion.div
            className="font-mono font-bold text-xl gradient-text flex items-center gap-2"
            whileHover={{ scale: 1.05 }}
          >
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            >
              <Sparkles className="h-5 w-5 text-primary" />
            </motion.div>
            Web3 Portfolio
          </motion.div>
          <WalletConnect />
        </div>
      </motion.header>

      {/* Hero Section */}
      <Hero />

      {/* Projects Showcase */}
      <ProjectsShowcase />

      {/* Interactive Features Section */}
      <section className="relative py-32 px-4 overflow-hidden">
        {/* Background elements */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />
        <div className="absolute top-1/2 left-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 right-0 w-96 h-96 bg-secondary/10 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-20"
          >
            <motion.h2
              className="text-4xl md:text-5xl font-mono font-bold gradient-text mb-6"
              initial={{ scale: 0.9 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
            >
              Interactive Features
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="text-lg text-foreground-secondary max-w-2xl mx-auto"
            >
              Experience the power of Web3 through interactive on-chain features
            </motion.p>
          </motion.div>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <TokenFaucet />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <NFTMint />
            </motion.div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <VisitorBook />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="glass-card rounded-xl p-8 relative overflow-hidden"
            >
              {/* Decorative gradient */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/20 to-transparent rounded-full blur-2xl" />

              <h3 className="text-2xl font-mono font-bold gradient-text mb-6 relative z-10">
                About This Portfolio
              </h3>

              <p className="text-foreground-secondary mb-6 leading-relaxed relative z-10">
                This portfolio is a living blockchain application. Every interaction demonstrates
                real Web3 development skills including smart contract interactions, IPFS storage,
                NFT minting, and token economics.
              </p>

              <div className="space-y-3 relative z-10">
                {[
                  { icon: Shield, text: 'Deployed on Base Mainnet', color: 'text-primary' },
                  { icon: Database, text: 'All project assets stored on IPFS', color: 'text-secondary' },
                  { icon: Globe, text: 'On-chain visitor book', color: 'text-accent' },
                  { icon: Zap, text: 'Token-gated voting system', color: 'text-primary' },
                  { icon: Award, text: 'Limited edition NFTs', color: 'text-secondary' },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.4 + i * 0.1 }}
                    whileHover={{ x: 8, transition: { duration: 0.2 } }}
                    className="flex items-center gap-3 text-sm group"
                  >
                    <div className={`glass-card p-2 rounded-lg ${item.color} group-hover:scale-110 transition-transform`}>
                      <item.icon className="h-4 w-4" />
                    </div>
                    <span className="text-foreground-secondary group-hover:text-foreground transition-colors">
                      {item.text}
                    </span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative border-t border-glass-border py-12 px-4 overflow-hidden">
        {/* Background decoration */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-96 h-32 bg-gradient-to-t from-primary/10 to-transparent blur-2xl" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative max-w-7xl mx-auto"
        >
          <div className="flex flex-col items-center gap-4">
            {/* Tech Stack */}
            <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-foreground-secondary">
              {['Next.js', 'wagmi', 'viem', 'Framer Motion', 'Base Mainnet'].map((tech, i) => (
                <motion.span
                  key={tech}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  whileHover={{ scale: 1.1 }}
                  className="glass px-3 py-1.5 rounded-full hover:border-primary/50 transition-all cursor-default"
                >
                  {tech}
                </motion.span>
              ))}
            </div>

            {/* Copyright */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5 }}
              className="text-center text-foreground-secondary text-sm space-y-1"
            >
              <p className="flex items-center justify-center gap-2">
                <span>Built with</span>
                <motion.span
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="text-accent"
                >
                  ♥
                </motion.span>
                <span>for Web3</span>
              </p>
              <p>© {new Date().getFullYear()} Web3 Portfolio Protocol</p>
            </motion.div>
          </div>
        </motion.div>
      </footer>
    </main>
  )
}
