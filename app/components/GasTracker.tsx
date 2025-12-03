'use client'

import { useGasPrice } from 'wagmi'
import { base } from 'wagmi/chains'
import { Zap } from 'lucide-react'

export function GasTracker() {
  const { data: gasPrice, isLoading } = useGasPrice({
    chainId: base.id,
  })

  const gasPriceGwei = gasPrice ? (Number(gasPrice) / 1e9).toFixed(2) : '0'

  return (
    <div className="glass rounded-lg px-4 py-2 flex items-center gap-2">
      <Zap className="h-4 w-4 text-secondary" />
      <div className="flex flex-col">
        <span className="text-xs text-foreground-secondary">Gas Price</span>
        <span className="text-sm font-mono text-foreground">
          {isLoading ? '...' : `${gasPriceGwei} gwei`}
        </span>
      </div>
    </div>
  )
}


