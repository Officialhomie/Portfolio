'use client'

import { useBlockNumber } from 'wagmi'
import { base } from 'wagmi/chains'
import { Blocks } from 'lucide-react'
import { formatNumber } from '@/lib/utils'

export function BlockHeightCounter() {
  const { data: blockNumber, isLoading } = useBlockNumber({
    chainId: base.id,
    watch: true,
  })

  return (
    <div className="glass rounded-lg px-4 py-2 flex items-center gap-2">
      <Blocks className="h-4 w-4 text-primary" />
      <div className="flex flex-col">
        <span className="text-xs text-foreground-secondary">Block Height</span>
        <span className="text-sm font-mono text-foreground">
          {isLoading ? '...' : blockNumber ? formatNumber(Number(blockNumber)) : '0'}
        </span>
      </div>
    </div>
  )
}


