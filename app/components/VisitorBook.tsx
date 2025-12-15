'use client'

import { useWriteContract, useReadContract, useWatchContractEvent, useWaitForTransactionReceipt, useEnsName as useEnsNameHook } from 'wagmi'
import { useAppKitAccount } from '@reown/appkit/react'
import { useState, useEffect } from 'react'
import { CONTRACT_ADDRESSES, VISITOR_BOOK_ABI, getContractAddress } from '@/lib/contracts'
import { formatAddress, formatENS, getBaseScanURL } from '@/lib/utils'
import { BookOpen, Send, Clock, MessageSquare, Users, PenLine, ChevronDown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useToast } from '@/app/contexts/ToastContext'
import { getErrorMessage } from '@/lib/errors'

interface Visitor {
  address: string
  message: string
  timestamp: number
}

function VisitorItem({ visitor, index }: { visitor: Visitor; index: number }) {
  const { data: ensName } = useEnsNameHook({ address: visitor.address as `0x${string}` })
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ delay: index * 0.05 }}
      className="group relative"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-secondary/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
      
      <div className="relative p-4 sm:p-5 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <motion.div
            whileHover={{ scale: 1.1 }}
            className="relative flex-shrink-0"
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-primary/30 to-secondary/30 flex items-center justify-center border border-primary/20">
              <span className="text-sm sm:text-base font-mono font-bold text-primary">
                {visitor.address.slice(2, 4).toUpperCase()}
              </span>
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-green-500/20 border-2 border-background flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-green-400" />
            </div>
          </motion.div>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="font-mono text-sm text-foreground truncate">
                {formatENS(ensName, visitor.address)}
              </span>
              <div className="flex items-center gap-1.5 text-xs text-foreground-secondary flex-shrink-0">
                <Clock className="h-3 w-3" />
                <span>{new Date(visitor.timestamp * 1000).toLocaleDateString()}</span>
              </div>
            </div>
            
            <p className="text-sm sm:text-base text-foreground-secondary leading-relaxed">
              {visitor.message}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export function VisitorBook() {
  const { address, isConnected } = useAppKitAccount()
  const walletAddress = address as `0x${string}` | undefined
  const { data: ensName } = useEnsNameHook({ address: walletAddress })
  const [message, setMessage] = useState('')
  const [visitors, setVisitors] = useState<Visitor[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [txHash, setTxHash] = useState<`0x${string}` | null>(null)
  const [page, setPage] = useState(0)
  const [isFocused, setIsFocused] = useState(false)
  const { success, error, loading: showLoadingToast, removeToast } = useToast()
  const contractAddress = getContractAddress('VISITOR_BOOK')

  const { writeContractAsync } = useWriteContract()

  // Fetch visitors from contract
  const { data: totalVisitorsCount } = useReadContract({
    address: contractAddress!,
    abi: VISITOR_BOOK_ABI,
    functionName: 'getTotalVisitors',
    query: {
      enabled: !!contractAddress,
    },
  })

  const itemsPerPage = 10
  const offset = page * itemsPerPage

  // Fetch visitors with pagination
  const { data: recentVisitors, isLoading: isLoadingVisitors } = useReadContract({
    address: contractAddress!,
    abi: VISITOR_BOOK_ABI,
    functionName: 'getVisitors',
    args: [
      totalVisitorsCount && Number(totalVisitorsCount) > offset
        ? BigInt(Math.max(0, Number(totalVisitorsCount) - offset - itemsPerPage))
        : BigInt(0),
      BigInt(itemsPerPage)
    ],
    query: {
      enabled: !!contractAddress && !!totalVisitorsCount && Number(totalVisitorsCount) > 0,
    },
  })

  // Wait for transaction receipt
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: txHash || undefined,
  })

  // Watch for new visitor events
  useWatchContractEvent({
    address: contractAddress!,
    abi: VISITOR_BOOK_ABI,
    eventName: 'VisitorSigned',
    onLogs(logs) {
      setPage(0)
    },
  })

  useEffect(() => {
    if (isConfirmed && txHash) {
      success('Successfully signed the visitor book!', {
        link: {
          label: 'View on Basescan',
          href: getBaseScanURL(txHash, 'tx'),
        },
      })
      setTxHash(null)
      setMessage('')
    }
  }, [isConfirmed, txHash, success])

  // Update visitors state when data changes
  useEffect(() => {
    if (recentVisitors && Array.isArray(recentVisitors)) {
      const formattedVisitors = recentVisitors.map((v: any) => ({
        address: v.visitor,
        message: v.message,
        timestamp: Number(v.timestamp),
      }))
      setVisitors(formattedVisitors.reverse())
    }
  }, [recentVisitors])

  const handleSign = async () => {
    if (!isConnected || !address || !message.trim() || !contractAddress) {
      if (!isConnected) {
        error('Please connect your wallet')
      }
      return
    }

    setIsLoading(true)
    const loadingToastId = showLoadingToast('Signing visitor book...')
    
    try {
      const hash = await writeContractAsync({
        address: contractAddress,
        abi: VISITOR_BOOK_ABI,
        functionName: 'signVisitorBook',
        args: [message],
      })
      
      if (hash) {
        setTxHash(hash)
        removeToast(loadingToastId)
        showLoadingToast('Transaction submitted. Waiting for confirmation...')
      }
    } catch (err: unknown) {
      removeToast(loadingToastId)
      const errorMessage = getErrorMessage(err)
      if (!errorMessage.includes('cancelled') && !errorMessage.includes('rejected')) {
        error(errorMessage)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const visitorCount = totalVisitorsCount ? Number(totalVisitorsCount) : 0
  const hasMore = visitorCount > (page + 1) * itemsPerPage

  // Disconnected state
  if (!isConnected) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative h-full rounded-3xl overflow-hidden"
      >
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />
        <div className="absolute top-0 left-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-48 h-48 bg-accent/10 rounded-full blur-3xl" />
        
        {/* Card */}
        <div className="relative glass-card h-full rounded-3xl border border-glass-border p-10 sm:p-14 lg:p-16 flex flex-col items-center justify-center text-center">
          <motion.div
            animate={{ 
              rotateY: [0, 10, -10, 0],
            }}
            transition={{ duration: 4, repeat: Infinity }}
            className="relative mb-6"
          >
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl" />
            <div className="relative p-5 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/30">
              <BookOpen className="h-10 w-10 text-primary" />
            </div>
          </motion.div>
          
          <h3 className="text-xl sm:text-2xl font-mono font-bold text-foreground mb-3">
            Visitor Book
          </h3>
          <p className="text-foreground-secondary text-sm sm:text-base max-w-xs">
            Connect your wallet to leave your mark on the blockchain
          </p>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative h-full rounded-3xl overflow-hidden"
    >
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />
      <motion.div
        animate={{ 
          x: [0, 30, 0],
          y: [0, -20, 0],
        }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-0 left-1/4 w-72 h-72 bg-primary/15 rounded-full blur-3xl"
      />
      <motion.div
        animate={{ 
          x: [0, -20, 0],
          y: [0, 30, 0],
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-0 right-1/4 w-56 h-56 bg-accent/15 rounded-full blur-3xl"
      />
      
      {/* Main card */}
      <div className="relative glass-card h-full rounded-3xl border border-glass-border p-8 sm:p-12 lg:p-16">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-8 sm:mb-10">
          <div className="flex items-center gap-4 sm:gap-5">
            <motion.div
              whileHover={{ scale: 1.1, rotate: 5 }}
              className="relative flex-shrink-0"
            >
              <div className="absolute inset-0 bg-primary/30 rounded-2xl blur-lg" />
              <div className="relative p-3 sm:p-4 rounded-2xl bg-gradient-to-br from-primary/25 to-accent/20 border border-primary/30 shadow-lg shadow-primary/20">
                <BookOpen className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
              </div>
            </motion.div>
            <div className="min-w-0">
              <h3 className="text-xl sm:text-2xl font-mono font-bold gradient-text">
                Visitor Book
              </h3>
              <p className="text-xs sm:text-sm text-foreground-secondary mt-1">
                On-chain guestbook
              </p>
            </div>
          </div>
          
          {/* Visitor count badge */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-sm flex-shrink-0"
          >
            <Users className="h-4 w-4 text-primary" />
            <span className="font-mono text-foreground">{visitorCount}</span>
            <span className="text-foreground-secondary">visitors</span>
          </motion.div>
        </div>

        {/* Message Input */}
        <motion.div
          animate={isFocused ? { scale: 1.01 } : { scale: 1 }}
          transition={{ type: "spring", stiffness: 300 }}
          className="relative mb-8 sm:mb-10"
        >
          <div className={`absolute inset-0 rounded-2xl bg-gradient-to-r from-primary/20 to-accent/20 blur-lg transition-opacity ${isFocused ? 'opacity-100' : 'opacity-0'}`} />
          
          <div className="relative p-6 sm:p-8 lg:p-10 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-primary/30 transition-colors">
            {/* Writing indicator */}
            <div className="flex items-center gap-2 mb-5">
              <PenLine className="h-4 w-4 text-primary" />
              <span className="text-sm text-foreground-secondary">Leave your message</span>
            </div>
            
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="Share your thoughts, feedback, or just say hello..."
              className="w-full bg-transparent text-foreground placeholder:text-foreground-secondary/50 resize-none focus:outline-none text-base leading-relaxed"
              rows={3}
              maxLength={200}
            />
            
            <div className="flex items-center justify-between gap-4 mt-5 pt-5 border-t border-white/5">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary/50" />
                <span className="text-xs text-foreground-secondary">
                  {message.length}/200 characters
                </span>
              </div>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSign}
                disabled={!message.trim() || isLoading || isConfirming}
                className="flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all"
              >
                {isLoading || isConfirming ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <Clock className="h-4 w-4" />
                    </motion.div>
                    <span>{isConfirming ? 'Confirming...' : 'Signing...'}</span>
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    <span>Sign Book</span>
                  </>
                )}
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Visitors List */}
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className="h-px flex-grow bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5">
              <MessageSquare className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-foreground-secondary">Recent Messages</span>
            </div>
            <div className="h-px flex-grow bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
          </div>
          
          <AnimatePresence mode="wait">
            {isLoadingVisitors && visitors.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 animate-pulse">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-white/5" />
                      <div className="flex-1 space-y-3">
                        <div className="h-4 bg-white/5 rounded-lg w-32" />
                        <div className="h-3 bg-white/5 rounded-lg w-full" />
                        <div className="h-3 bg-white/5 rounded-lg w-2/3" />
                      </div>
                    </div>
                  </div>
                ))}
              </motion.div>
            ) : visitors.length > 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-4 sm:space-y-5"
              >
                {visitors.map((visitor, index) => (
                  <VisitorItem 
                    key={`${visitor.address}-${visitor.timestamp}`} 
                    visitor={visitor}
                    index={index}
                  />
                ))}
                
                {/* Load more button */}
                {hasMore && (
                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onClick={() => setPage(page + 1)}
                    className="w-full mt-6 flex items-center justify-center gap-2 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 text-foreground-secondary hover:text-foreground transition-all group"
                  >
                    <span className="text-sm">Load more messages</span>
                    <ChevronDown className="h-4 w-4 group-hover:translate-y-0.5 transition-transform" />
                  </motion.button>
                )}
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
                  <MessageSquare className="h-8 w-8 text-primary/50" />
                </div>
                <p className="text-foreground-secondary">
                  Be the first to leave a message!
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  )
}
