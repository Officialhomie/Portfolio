'use client'

import { useChainId, useChains } from 'wagmi'
import { base } from 'wagmi/chains'
import { CheckCircle2, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

export function NetworkIndicator() {
  const chainId = useChainId()
  const chains = useChains()
  const chain = chains.find(c => c.id === chainId)
  const isBase = chainId === base.id

  return (
    <div className="flex items-center gap-2">
      <div className={cn(
        "glass rounded-lg px-3 py-1.5 flex items-center gap-2",
        isBase ? "border-primary/50" : "border-accent/50"
      )}>
        {isBase ? (
          <>
            <CheckCircle2 className="h-4 w-4 text-primary" />
            <span className="text-xs font-mono text-foreground">
              Base Mainnet
            </span>
          </>
        ) : (
          <>
            <AlertCircle className="h-4 w-4 text-accent" />
            <span className="text-xs font-mono text-foreground-secondary">
              Wrong Network
            </span>
          </>
        )}
      </div>
      {chain && (
        <div className="text-xs font-mono text-foreground-secondary">
          Chain ID: {chainId}
        </div>
      )}
    </div>
  )
}


