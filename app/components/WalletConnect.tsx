'use client'

import { useEffect, useState } from 'react'

export function WalletConnect() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="h-10 w-32 sm:w-40 animate-pulse rounded-lg glass-card border border-glass-border" />
    )
  }

  // Use AppKit's built-in web component which handles everything automatically
  return (
    <appkit-button />
  )
}
