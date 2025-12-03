'use client'

import { useEffect } from 'react'

// AppKit will be initialized via wagmi connectors
// The @reown/appkit package provides connectors that work with wagmi
export function AppKitProvider({ children }: { children: React.ReactNode }) {
  // AppKit integration happens through wagmi connectors
  // No additional setup needed here as wagmi handles it
  return <>{children}</>
}

