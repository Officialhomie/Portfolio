'use client'

import { useAccount, useWriteContract, useReadContract, useWatchContractEvent } from 'wagmi'
import { useState, useEffect } from 'react'
import { CONTRACT_ADDRESSES, VISITOR_BOOK_ABI } from '@/lib/contracts'
import { formatAddress, formatENS } from '@/lib/utils'
import { useEnsName } from 'wagmi'
import { BookOpen, Send, Clock } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface Visitor {
  address: string
  message: string
  timestamp: number
}

export function VisitorBook() {
  const { address, isConnected } = useAccount()
  const { data: ensName } = useEnsName({ address })
  const [message, setMessage] = useState('')
  const [visitors, setVisitors] = useState<Visitor[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const { writeContract } = useWriteContract()

  // Fetch visitors from contract
  const { data: totalVisitorsCount } = useReadContract({
    address: CONTRACT_ADDRESSES.VISITOR_BOOK as `0x${string}`,
    abi: VISITOR_BOOK_ABI,
    functionName: 'getTotalVisitors',
    query: {
      enabled: !!CONTRACT_ADDRESSES.VISITOR_BOOK,
    },
  })

  // Fetch recent visitors (last 10)
  const { data: recentVisitors } = useReadContract({
    address: CONTRACT_ADDRESSES.VISITOR_BOOK as `0x${string}`,
    abi: VISITOR_BOOK_ABI,
    functionName: 'getVisitors',
    args: [
      totalVisitorsCount && Number(totalVisitorsCount) > 10 
        ? BigInt(Number(totalVisitorsCount) - 10)
        : BigInt(0),
      BigInt(10)
    ],
    query: {
      enabled: !!CONTRACT_ADDRESSES.VISITOR_BOOK && !!totalVisitorsCount && Number(totalVisitorsCount) > 0,
    },
  })

  // Watch for new visitor events
  useWatchContractEvent({
    address: CONTRACT_ADDRESSES.VISITOR_BOOK as `0x${string}`,
    abi: VISITOR_BOOK_ABI,
    eventName: 'VisitorSigned',
    onLogs(logs) {
      // Refresh visitors list when new visitor signs
      // The useReadContract hook will automatically refetch
    },
  })

  // Update visitors state when data changes
  useEffect(() => {
    if (recentVisitors && Array.isArray(recentVisitors)) {
      setVisitors(recentVisitors.map((v: any) => ({
        address: v.visitor,
        message: v.message,
        timestamp: Number(v.timestamp),
      })))
    }
  }, [recentVisitors])

  const handleSign = async () => {
    if (!isConnected || !address || !message.trim()) return

    setIsLoading(true)
    try {
      await writeContract({
        address: CONTRACT_ADDRESSES.VISITOR_BOOK as `0x${string}`,
        abi: VISITOR_BOOK_ABI,
        functionName: 'signVisitorBook',
        args: [message],
      })
      setMessage('')
    } catch (error) {
      console.error('Error signing visitor book:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (!isConnected) {
    return (
      <div className="glass rounded-xl p-8 text-center">
        <BookOpen className="h-12 w-12 text-foreground-secondary mx-auto mb-4" />
        <p className="text-foreground-secondary">
          Connect your wallet to sign the visitor book
        </p>
      </div>
    )
  }

  return (
    <div className="glass rounded-xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <BookOpen className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-mono font-bold text-foreground">
          Visitor Book
        </h2>
        {totalVisitorsCount !== undefined && (
          <span className="text-sm text-foreground-secondary">
            ({Number(totalVisitorsCount)} visitors)
          </span>
        )}
      </div>

      <div className="space-y-4">
        <div>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Leave a message in the visitor book..."
            className="w-full glass rounded-lg px-4 py-3 text-foreground bg-transparent border border-glass-border focus:border-primary focus:outline-none resize-none"
            rows={3}
            maxLength={200}
          />
          <div className="text-xs text-foreground-secondary mt-1 text-right">
            {message.length}/200
          </div>
        </div>

        <button
          onClick={handleSign}
          disabled={!message.trim() || isLoading}
          className="glass hover:bg-opacity-20 rounded-lg px-6 py-2 flex items-center gap-2 text-primary hover:text-primary-hover transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className="h-4 w-4" />
          <span>{isLoading ? 'Signing...' : 'Sign Visitor Book'}</span>
        </button>
      </div>

      {/* Visitors List */}
      {visitors.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-mono font-bold text-foreground mb-4">
            Recent Visitors
          </h3>
          <div className="space-y-3">
            <AnimatePresence>
              {visitors.map((visitor, index) => (
                <motion.div
                  key={`${visitor.address}-${visitor.timestamp}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="glass rounded-lg p-4"
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className="font-mono text-sm text-foreground">
                      {formatENS(null, visitor.address)}
                    </span>
                    <div className="flex items-center gap-1 text-xs text-foreground-secondary">
                      <Clock className="h-3 w-3" />
                      {new Date(visitor.timestamp * 1000).toLocaleDateString()}
                    </div>
                  </div>
                  <p className="text-sm text-foreground-secondary">{visitor.message}</p>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  )
}


