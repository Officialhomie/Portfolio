'use client'

import { createAppKit } from '@reown/appkit/react'
import { WagmiProvider, type Config } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { base } from '@reown/appkit/networks'
import { ReactNode } from 'react'

// 1. Get projectId from https://cloud.reown.com
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || ''

// 2. Set up metadata
const metadata = {
  name: 'OneTrueHomie Portfolio',
  description: 'Full-Stack Blockchain Developer Portfolio Protocol',
  url: typeof window !== 'undefined' ? window.location.origin : 'https://onetruehomie.dev',
  icons: ['https://avatars.githubusercontent.com/u/179229932']
}

// 3. Create wagmi adapter
const wagmiAdapter = new WagmiAdapter({
  networks: [base],
  projectId,
})

// 4. Create query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

// 5. Create modal - only on client side
if (typeof window !== 'undefined' && projectId) {
  createAppKit({
    adapters: [wagmiAdapter],
    networks: [base],
    projectId,
    metadata,
    features: {
      analytics: true,
      email: false,
      socials: false,
    },
    themeMode: 'dark',
    themeVariables: {
      '--w3m-color-mix': '#627eea',
      '--w3m-color-mix-strength': 20,
      '--w3m-accent': '#627eea',
      '--w3m-border-radius-master': '8px',
    }
  })
}

// Export the wagmi config for use in other components
export const config = wagmiAdapter.wagmiConfig as Config

interface AppKitProviderProps {
  children: ReactNode
}

export function AppKitProvider({ children }: AppKitProviderProps) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  )
}
