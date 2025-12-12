'use client'

import { Hero } from './components/Hero'
import { ProjectsShowcase } from './components/ProjectsShowcase'
import { VisitorBook } from './components/VisitorBook'
import { NFTMint } from './components/NFTMint'
import { TokenFaucet } from './components/TokenFaucet'
import { NavigationMenu } from './components/NavigationMenu'
import { BentoGrid, BentoItem } from './components/BentoGrid'
import { ErrorBoundary } from './components/ErrorBoundary'
import { NetworkError } from './components/NetworkError'
import { motion } from 'framer-motion'
import { Shield, Database, Zap, Award, Globe, Github, Twitter, Linkedin, Mail } from 'lucide-react'

export default function Home() {
  return (
    <ErrorBoundary>
      <NetworkError />
      <NavigationMenu />
      <main className="relative min-h-screen">
      {/* Hero Section */}
      <section id="home">
        <Hero />
      </section>

      {/* Projects Showcase */}
      <section id="projects">
        <ProjectsShowcase />
      </section>

      {/* Interactive Features Section */}
      <section id="interactive" className="section-lg relative overflow-hidden bg-gradient-to-b from-background via-background-tertiary/50 to-background">
        {/* Animated background elements */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/[0.02] to-transparent" />
        <motion.div
          animate={{
            x: [0, 50, 0],
            y: [0, -30, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/4 left-0 w-[500px] h-[500px] bg-primary/8 rounded-full blur-[120px] pointer-events-none"
        />
        <motion.div
          animate={{
            x: [0, -40, 0],
            y: [0, 40, 0],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute bottom-1/4 right-0 w-[500px] h-[500px] bg-accent/8 rounded-full blur-[120px] pointer-events-none"
        />

        <div className="container-wide relative">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-20"
          >
            {/* Badge */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="inline-flex items-center gap-2 badge badge-primary px-5 py-2.5 mb-8"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
              >
                <Zap className="h-5 w-5" />
              </motion.div>
              <span className="font-medium">On-Chain Experience</span>
            </motion.div>

            <motion.h2
              className="text-5xl sm:text-6xl md:text-7xl font-mono font-bold gradient-text mb-6"
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
              className="text-lg sm:text-xl text-foreground-secondary max-w-3xl mx-auto leading-relaxed text-balance"
            >
              Experience the power of Web3 through interactive on-chain features.
              Every action executes real smart contract transactions on Base.
            </motion.p>
          </motion.div>

          {/* Bento Grid Layout */}
          <BentoGrid>
            {/* Token Faucet */}
            <BentoItem span="default">
              <TokenFaucet />
            </BentoItem>

            {/* NFT Mint */}
            <BentoItem span="default">
              <NFTMint />
            </BentoItem>

            {/* Visitor Book - Full width */}
            <BentoItem span="wide" className="lg:col-span-3">
              <VisitorBook />
            </BentoItem>
          </BentoGrid>

          {/* About This Portfolio */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <div className="relative rounded-3xl overflow-hidden">
              {/* Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-secondary/5" />
              <motion.div
                animate={{ 
                  x: [0, 30, 0],
                  opacity: [0.1, 0.2, 0.1],
                }}
                transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full blur-3xl"
              />
              <motion.div
                animate={{ 
                  x: [0, -20, 0],
                  opacity: [0.1, 0.15, 0.1],
                }}
                transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
                className="absolute bottom-0 left-0 w-80 h-80 bg-secondary/20 rounded-full blur-3xl"
              />
              
              {/* Grid pattern */}
              <div className="absolute inset-0 opacity-[0.015]" style={{
                backgroundImage: `radial-gradient(circle at 1px 1px, rgb(255 255 255) 1px, transparent 0)`,
                backgroundSize: '40px 40px'
              }} />
              
              {/* Content */}
              <div className="relative glass-card rounded-3xl border border-glass-border p-8 sm:p-10 lg:p-14">
                {/* Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-10 sm:mb-12">
                  <div className="flex items-center gap-4">
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      className="relative"
                    >
                      <div className="absolute inset-0 bg-primary/30 rounded-2xl blur-lg" />
                      <div className="relative p-4 rounded-2xl bg-gradient-to-br from-primary/25 to-secondary/20 border border-primary/30 shadow-lg shadow-primary/20">
                        <Globe className="h-7 w-7 text-primary" />
                      </div>
                    </motion.div>
                    <div>
                      <h3 className="text-2xl sm:text-3xl lg:text-4xl font-mono font-bold gradient-text">
                        About This Portfolio
                      </h3>
                      <p className="text-sm sm:text-base text-foreground-secondary mt-1">
                        Built with passion for Web3
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20">
                    <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                    <span className="text-sm font-medium text-accent">Live on Base</span>
                  </div>
                </div>

                {/* Two column layout */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 mb-10 sm:mb-12">
                  {/* Left column - Introduction */}
                  <div className="space-y-6">
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.2 }}
                      className="p-6 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/15"
                    >
                      <p className="text-base sm:text-lg text-foreground leading-relaxed">
                        I'm a <span className="text-primary font-semibold">Full-Stack Blockchain Developer</span> passionate 
                        about building decentralized applications that solve real-world problems. This portfolio itself 
                        is a testament to my skills—a fully functional Web3 application deployed on Base.
                      </p>
                    </motion.div>
                    
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.3 }}
                      className="p-6 rounded-2xl bg-gradient-to-br from-secondary/10 to-secondary/5 border border-secondary/15"
                    >
                      <p className="text-base sm:text-lg text-foreground-secondary leading-relaxed">
                        Every interaction you make here—from claiming tokens to minting NFTs—executes real smart 
                        contract transactions. This isn't just a showcase; it's a living demonstration of 
                        production-ready blockchain development.
                      </p>
                    </motion.div>
                  </div>

                  {/* Right column - Technical Highlights */}
                  <div>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="h-px flex-grow bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
                      <span className="text-sm font-mono text-foreground-secondary uppercase tracking-wider px-3 py-1.5 rounded-full bg-white/5">
                        Technical Highlights
                      </span>
                      <div className="h-px flex-grow bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {[
                        { icon: Shield, text: 'Base', color: 'text-primary', bg: 'from-primary/15 to-primary/5', border: 'border-primary/20' },
                        { icon: Database, text: 'IPFS Storage', color: 'text-secondary', bg: 'from-secondary/15 to-secondary/5', border: 'border-secondary/20' },
                        { icon: Globe, text: 'On-Chain Data', color: 'text-accent', bg: 'from-accent/15 to-accent/5', border: 'border-accent/20' },
                        { icon: Zap, text: 'Token Gating', color: 'text-primary', bg: 'from-primary/15 to-primary/5', border: 'border-primary/20' },
                        { icon: Award, text: 'NFT Collection', color: 'text-secondary', bg: 'from-secondary/15 to-secondary/5', border: 'border-secondary/20' },
                        { icon: Shield, text: 'Audited Contracts', color: 'text-accent', bg: 'from-accent/15 to-accent/5', border: 'border-accent/20' },
                      ].map((item, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, y: 10 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: 0.4 + i * 0.05 }}
                          whileHover={{ scale: 1.03, y: -2 }}
                          className={`flex items-center gap-3 sm:gap-4 p-4 sm:p-5 rounded-xl bg-gradient-to-br ${item.bg} border ${item.border} group cursor-default`}
                        >
                          <div className={`p-2 rounded-lg bg-gradient-to-br ${item.bg} border ${item.border}`}>
                            <item.icon className={`h-4 w-4 ${item.color} group-hover:scale-110 transition-transform`} />
                          </div>
                          <span className="text-sm text-foreground-secondary group-hover:text-foreground transition-colors font-medium">
                            {item.text}
                          </span>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Tech Stack */}
                <div className="pt-8 border-t border-glass-border">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="h-px flex-grow bg-gradient-to-r from-transparent via-secondary/20 to-transparent" />
                    <span className="text-xs font-mono text-foreground-secondary uppercase tracking-wider">
                      Tech Stack
                    </span>
                    <div className="h-px flex-grow bg-gradient-to-r from-transparent via-secondary/20 to-transparent" />
                  </div>
                  
                  <div className="flex flex-wrap gap-3 sm:gap-4 justify-center">
                    {['Solidity', 'Next.js', 'TypeScript', 'wagmi', 'viem', 'Foundry', 'Base', 'IPFS'].map((tech, i) => (
                      <motion.span
                        key={tech}
                        initial={{ opacity: 0, scale: 0.8 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.6 + i * 0.03 }}
                        whileHover={{ scale: 1.1, y: -2 }}
                        className="px-4 py-2 text-sm font-mono rounded-xl glass border border-glass-border text-foreground-secondary hover:text-foreground hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10 transition-all cursor-default"
                      >
                        {tech}
                      </motion.span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="relative border-t border-glass-border py-12 px-4 overflow-hidden">
        {/* Background decoration */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-96 h-32 bg-gradient-to-t from-primary/10 to-transparent blur-2xl" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative max-w-7xl mx-auto"
        >
          <div className="flex flex-col items-center gap-6">
            {/* Social Links */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="flex items-center gap-4"
            >
              <motion.a
                href="https://github.com/Officialhomie"
                target="_blank"
                rel="noopener noreferrer"
                className="glass-card hover:bg-opacity-20 rounded-lg p-3 text-foreground-secondary hover:text-foreground transition-all"
                whileHover={{ scale: 1.1, y: -2 }}
                whileTap={{ scale: 0.95 }}
                aria-label="GitHub profile"
              >
                <Github className="h-5 w-5" />
              </motion.a>
              <motion.a
                href="https://twitter.com/Officialhomie"
                target="_blank"
                rel="noopener noreferrer"
                className="glass-card hover:bg-opacity-20 rounded-lg p-3 text-foreground-secondary hover:text-foreground transition-all"
                whileHover={{ scale: 1.1, y: -2 }}
                whileTap={{ scale: 0.95 }}
                aria-label="Twitter profile"
              >
                <Twitter className="h-5 w-5" />
              </motion.a>
              <motion.a
                href="https://linkedin.com/in/officialhomie"
                target="_blank"
                rel="noopener noreferrer"
                className="glass-card hover:bg-opacity-20 rounded-lg p-3 text-foreground-secondary hover:text-foreground transition-all"
                whileHover={{ scale: 1.1, y: -2 }}
                whileTap={{ scale: 0.95 }}
                aria-label="LinkedIn profile"
              >
                <Linkedin className="h-5 w-5" />
              </motion.a>
              <motion.a
                href="mailto:officialhomie@example.com"
                className="glass-card hover:bg-opacity-20 rounded-lg p-3 text-foreground-secondary hover:text-foreground transition-all"
                whileHover={{ scale: 1.1, y: -2 }}
                whileTap={{ scale: 0.95 }}
                aria-label="Send email"
              >
                <Mail className="h-5 w-5" />
              </motion.a>
            </motion.div>

            {/* Tech Stack */}
            <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-foreground-secondary">
              {['Next.js', 'wagmi', 'viem', 'Framer Motion', 'Base'].map((tech, i) => (
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
              <p>© {new Date().getFullYear()} OneTrueHomie Portfolio Protocol</p>
            </motion.div>
          </div>
        </motion.div>
      </footer>
      </main>
    </ErrorBoundary>
  )
}
