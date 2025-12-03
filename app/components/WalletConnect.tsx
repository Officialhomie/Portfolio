'use client'

import { useAccount, useDisconnect, useEnsName, useConnect } from 'wagmi'
import { formatENS } from '@/lib/utils'
import { Wallet, LogOut, ChevronDown, X } from 'lucide-react'
import { useEffect, useState } from 'react'

export function WalletConnect() {
  const { address, isConnected } = useAccount()
  const { disconnect } = useDisconnect()
  const { connect, connectors, isPending } = useConnect()
  const { data: ensName } = useEnsName({ address })
  const [mounted, setMounted] = useState(false)
  const [showConnectors, setShowConnectors] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="h-10 w-32 animate-pulse rounded-lg bg-gray-800" />
    )
  }

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-3">
        <div className="glass rounded-lg px-4 py-2">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse-glow" />
            <span className="font-mono text-sm text-foreground">
              {formatENS(ensName, address)}
            </span>
          </div>
        </div>
        <button
          onClick={() => disconnect()}
          className="glass hover:bg-opacity-20 rounded-lg px-4 py-2 transition-all flex items-center gap-2 text-foreground-secondary hover:text-foreground"
          aria-label="Disconnect wallet"
        >
          <LogOut className="h-4 w-4" />
          <span className="text-sm">Disconnect</span>
        </button>
      </div>
    )
  }

  const handleConnect = (connector: any) => {
    connect({ connector })
    setShowConnectors(false)
  }

  // Filter out connectors that aren't available
  const availableConnectors = connectors.filter(c => c.ready)

  return (
    <div className="relative">
      {availableConnectors.length === 1 ? (
        <button
          onClick={() => handleConnect(availableConnectors[0])}
          disabled={isPending}
          className="glass hover:bg-opacity-20 rounded-lg px-6 py-2.5 transition-all flex items-center gap-2 text-primary hover:text-primary-hover font-medium glow-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Wallet className="h-5 w-5" />
          <span>{isPending ? 'Connecting...' : 'Connect Wallet'}</span>
        </button>
      ) : (
        <>
          <button
            onClick={() => setShowConnectors(!showConnectors)}
            disabled={isPending}
            className="glass hover:bg-opacity-20 rounded-lg px-6 py-2.5 transition-all flex items-center gap-2 text-primary hover:text-primary-hover font-medium glow-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Wallet className="h-5 w-5" />
            <span>Connect Wallet</span>
            <ChevronDown className="h-4 w-4" />
          </button>

          {showConnectors && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowConnectors(false)}
              />
              <div className="absolute top-full mt-2 right-0 z-50 glass rounded-lg p-2 min-w-[200px] border border-glass-border">
                <div className="flex items-center justify-between mb-2 px-2">
                  <span className="text-sm font-medium text-foreground">Select Wallet</span>
                  <button
                    onClick={() => setShowConnectors(false)}
                    className="text-foreground-secondary hover:text-foreground"
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
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-opacity-20 transition-all text-sm text-foreground-secondary hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {connector.name}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}

