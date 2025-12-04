'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { Toast, ToastType } from '@/components/Toast'

interface ToastContextType {
  toasts: Toast[]
  showToast: (message: string, type?: ToastType, options?: Partial<Toast>) => string
  removeToast: (id: string) => void
  success: (message: string, options?: Partial<Toast>) => string
  error: (message: string, options?: Partial<Toast>) => string
  info: (message: string, options?: Partial<Toast>) => string
  loading: (message: string, options?: Partial<Toast>) => string
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const showToast = useCallback(
    (message: string, type: ToastType = 'info', options?: Partial<Toast>) => {
      const id = Math.random().toString(36).substring(7)
      const duration = options?.duration ?? (type === 'loading' ? 0 : 5000)

      const toast: Toast = {
        id,
        message,
        type,
        duration,
        ...options,
      }

      setToasts((prev) => [...prev, toast])

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id)
        }, duration)
      }

      return id
    },
    [removeToast]
  )

  const success = useCallback(
    (message: string, options?: Partial<Toast>) => {
      return showToast(message, 'success', options)
    },
    [showToast]
  )

  const error = useCallback(
    (message: string, options?: Partial<Toast>) => {
      return showToast(message, 'error', { duration: 7000, ...options })
    },
    [showToast]
  )

  const info = useCallback(
    (message: string, options?: Partial<Toast>) => {
      return showToast(message, 'info', options)
    },
    [showToast]
  )

  const loading = useCallback(
    (message: string, options?: Partial<Toast>) => {
      return showToast(message, 'loading', { duration: 0, ...options })
    },
    [showToast]
  )

  return (
    <ToastContext.Provider
      value={{
        toasts,
        showToast,
        removeToast,
        success,
        error,
        info,
        loading,
      }}
    >
      {children}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

