'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, CheckCircle2, AlertCircle, Info, Loader2 } from 'lucide-react'
import { useToast } from '@/app/contexts/ToastContext'

export type ToastType = 'success' | 'error' | 'info' | 'loading'

export interface Toast {
  id: string
  message: string
  type: ToastType
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
  link?: {
    label: string
    href: string
  }
}

export function ToastContainer() {
  const { toasts, removeToast } = useToast()

  return (
    <div className="fixed top-20 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 300, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 300, scale: 0.8 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="pointer-events-auto"
          >
            <div className="glass-card rounded-xl p-4 min-w-[320px] max-w-[420px] border border-glass-border shadow-2xl">
              <div className="flex items-start gap-3">
                {/* Icon */}
                <div className="flex-shrink-0 mt-0.5">
                  {toast.type === 'success' && (
                    <CheckCircle2 className="h-5 w-5 text-green-400" />
                  )}
                  {toast.type === 'error' && (
                    <AlertCircle className="h-5 w-5 text-red-400" />
                  )}
                  {toast.type === 'info' && (
                    <Info className="h-5 w-5 text-primary" />
                  )}
                  {toast.type === 'loading' && (
                    <Loader2 className="h-5 w-5 text-primary animate-spin" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground font-medium break-words">
                    {toast.message}
                  </p>

                  {/* Action or Link */}
                  {(toast.action || toast.link) && (
                    <div className="mt-2 flex gap-2">
                      {toast.action && (
                        <button
                          onClick={() => {
                            toast.action?.onClick()
                            removeToast(toast.id)
                          }}
                          className="text-xs text-primary hover:text-primary-hover underline"
                        >
                          {toast.action.label}
                        </button>
                      )}
                      {toast.link && (
                        <a
                          href={toast.link.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:text-primary-hover underline"
                        >
                          {toast.link.label} →
                        </a>
                      )}
                    </div>
                  )}
                </div>

                {/* Close button */}
                <button
                  onClick={() => removeToast(toast.id)}
                  className="flex-shrink-0 text-foreground-secondary hover:text-foreground transition-colors p-1 rounded hover:bg-opacity-20"
                  aria-label="Close notification"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

