'use client'

import { motion } from 'framer-motion'
import { Users, Award, Coins, TrendingUp } from 'lucide-react'
import { useReadContract } from 'wagmi'
import { getContractAddress, VISITOR_BOOK_ABI, VISIT_NFT_ABI, PORTFOLIO_TOKEN_ABI } from '@/lib/contracts'

export function MetricsTicker() {
  const visitorBookAddress = getContractAddress('VISITOR_BOOK')
  const visitNFTAddress = getContractAddress('VISIT_NFT')
  const tokenAddress = getContractAddress('PORTFOLIO_TOKEN')

  // Get total visitors
  const { data: totalVisitors } = useReadContract({
    address: visitorBookAddress!,
    abi: VISITOR_BOOK_ABI,
    functionName: 'getTotalVisitors',
    query: {
      enabled: !!visitorBookAddress,
    },
  })

  // Get total NFTs minted
  const { data: totalNFTs } = useReadContract({
    address: visitNFTAddress!,
    abi: VISIT_NFT_ABI,
    functionName: 'totalSupply',
    query: {
      enabled: !!visitNFTAddress,
    },
  })

  // Get total token supply
  const { data: tokenSupply } = useReadContract({
    address: tokenAddress!,
    abi: PORTFOLIO_TOKEN_ABI,
    functionName: 'totalSupply',
    query: {
      enabled: !!tokenAddress,
    },
  })

  const metrics = [
    {
      icon: Users,
      label: 'Total Visitors',
      value: totalVisitors ? Number(totalVisitors).toLocaleString() : '...',
      color: 'primary',
      gradient: 'from-primary/20 to-primary/10',
    },
    {
      icon: Award,
      label: 'NFTs Minted',
      value: totalNFTs ? Number(totalNFTs).toLocaleString() : '...',
      color: 'accent',
      gradient: 'from-accent/20 to-accent/10',
    },
    {
      icon: Coins,
      label: 'Tokens Claimed',
      value: tokenSupply ? (Number(tokenSupply) / 1e18).toLocaleString(undefined, { maximumFractionDigits: 0 }) : '...',
      color: 'secondary',
      gradient: 'from-secondary/20 to-secondary/10',
    },
    {
      icon: TrendingUp,
      label: 'Network',
      value: 'Base',
      color: 'success',
      gradient: 'from-success/20 to-success/10',
    },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full">
      {metrics.map((metric, index) => {
        const Icon = metric.icon
        return (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.02, y: -2 }}
            className="relative group"
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${metric.gradient} rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity`} />
            <div className="relative glass-card rounded-2xl p-4 sm:p-5 border border-glass-border">
              <div className="flex items-start justify-between mb-3">
                <div className={`p-2 rounded-xl bg-gradient-to-br ${metric.gradient} border border-${metric.color}/20`}>
                  <Icon className={`h-4 w-4 sm:h-5 sm:w-5 text-${metric.color}`} />
                </div>
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity, delay: index * 0.2 }}
                  className={`w-2 h-2 rounded-full bg-${metric.color}`}
                />
              </div>
              <div className="space-y-1">
                <div className="font-mono font-bold text-xl sm:text-2xl text-foreground">
                  {metric.value}
                </div>
                <div className="text-xs sm:text-sm text-foreground-secondary font-medium">
                  {metric.label}
                </div>
              </div>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}
