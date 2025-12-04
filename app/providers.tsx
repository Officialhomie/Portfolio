'use client'

import { AppKitProvider } from './components/AppKitProvider'
import { ToastProvider } from './contexts/ToastContext'
import { ToastContainer } from './components/Toast'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AppKitProvider>
      <ToastProvider>
        {children}
        <ToastContainer />
      </ToastProvider>
    </AppKitProvider>
  )
}
