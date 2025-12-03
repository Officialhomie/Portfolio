'use client'

import { useAccount, useDisconnect, useEnsName, useConnect } from 'wagmi'
import { formatENS } from '@/lib/utils'
import { Wallet, LogOut, ChevronDown, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export function WalletConnect() {
  const { address, isConnected, isConnecting } = useAccount()
  const { disconnect } = useDisconnect()
  const { connect, connectors, isPending } = useConnect()
  const { data: ensName } = useEnsName({ address })
  const [mounted, setMounted] = useState(false)
  const [showConnectors, setShowConnectors] = useState(false)

  // All hooks must be called unconditionally at the top
  useEffect(() => {
    setMounted(true)
  }, [])

  // Re-check connection status when mounted
  useEffect(() => {
    if (mounted && address) {
      console.log('Wallet connected:', address)
    }
  }, [mounted, address])

  // Debug: Log connection state (use connectors directly in dependency)
  useEffect(() => {
    if (!mounted) return
    const availableCount = connectors.filter(c => c.ready).length
    console.log('Wallet connection state:', { 
      isConnected, 
      address, 
      connectors: connectors.length, 
      available: availableCount,
      connectorNames: connectors.map(c => c.name)
    })
  }, [mounted, isConnected, address, connectors])

  // Filter out connectors that aren't available - computed after hooks
  const availableConnectors = connectors.filter(c => c.ready)

  const handleConnect = async (connector: any) => {
    try {
      await connect({ connector })
      setShowConnectors(false)
    } catch (error) {
      console.error('Connection error:', error)
      // Keep dropdown open on error so user can try again
    }
  }

  // Now we can do conditional rendering
  if (!mounted) {
    return (
      <div className="h-10 w-40 animate-pulse rounded-lg glass-card border border-glass-border" />
    )
  }

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-3">
        <div className="glass-card rounded-lg px-4 py-2.5 border border-primary/20">
          <div className="flex items-center gap-2.5">
            <div className="h-2.5 w-2.5 rounded-full bg-green-400 animate-pulse-glow shadow-lg shadow-green-400/50" />
            <span className="font-mono text-sm text-foreground font-medium">
              {formatENS(ensName, address)}
            </span>
          </div>
        </div>
        <button
          onClick={() => disconnect()}
          className="glass-card hover:bg-opacity-20 rounded-lg px-4 py-2.5 transition-all flex items-center gap-2 text-foreground-secondary hover:text-foreground border border-glass-border hover:border-accent/30"
          aria-label="Disconnect wallet"
        >
          <LogOut className="h-4 w-4" />
          <span className="text-sm font-medium">Disconnect</span>
        </button>
      </div>
    )
  }
  
  if (availableConnectors.length === 0) {
    return (
      <div className="glass-card rounded-lg px-4 py-2.5 text-sm text-foreground-secondary border border-glass-border">
        <div className="flex items-center gap-2">
          <Wallet className="h-4 w-4" />
          <span>No wallets available</span>
        </div>
      </div>
    )
  }

  return (
    <div className="relative">
      {availableConnectors.length === 1 ? (
        <button
          onClick={() => handleConnect(availableConnectors[0])}
          disabled={isPending}
          className="glass-card hover:bg-opacity-20 rounded-lg px-6 py-2.5 transition-all flex items-center gap-2 text-primary hover:text-primary-hover font-medium glow-primary disabled:opacity-50 disabled:cursor-not-allowed border border-primary/20 hover:border-primary/40"
        >
          <Wallet className="h-5 w-5" />
          <span>{isPending ? 'Connecting...' : 'Connect Wallet'}</span>
        </button>
      ) : (
        <>
          <button
            onClick={() => setShowConnectors(!showConnectors)}
            disabled={isPending}
            className="glass-card hover:bg-opacity-20 rounded-lg px-6 py-2.5 transition-all flex items-center gap-2 text-primary hover:text-primary-hover font-medium glow-primary disabled:opacity-50 disabled:cursor-not-allowed border border-primary/20 hover:border-primary/40"
          >
            <Wallet className="h-5 w-5" />
            <span>{isPending ? 'Connecting...' : 'Connect Wallet'}</span>
            <motion.div
              animate={{ rotate: showConnectors ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="h-4 w-4" />
            </motion.div>
          </button>

          <AnimatePresence>
            {showConnectors && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowConnectors(false)}
                />
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="absolute top-full mt-2 right-0 z-50 glass-card rounded-xl p-3 min-w-[240px] border border-glass-border shadow-2xl"
                >
                <div className="flex items-center justify-between mb-3 px-2">
                  <span className="text-sm font-medium text-foreground">Select Wallet</span>
                  <button
                    onClick={() => setShowConnectors(false)}
                    className="text-foreground-secondary hover:text-foreground transition-colors p-1 rounded hover:bg-opacity-20"
                    aria-label="Close wallet selector"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="space-y-1">
                  {availableConnectors.map((connector) => (
                    <button
                      key={connector.id}
                      onClick={() => handleConnect(connector)}
                      disabled={isPending}
                      className="w-full text-left px-4 py-3 rounded-lg hover:bg-opacity-20 transition-all text-sm text-foreground-secondary hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <Wallet className="h-4 w-4" />
                      <span>{connector.name}</span>
                    </button>
                  ))}
                </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  )
}

