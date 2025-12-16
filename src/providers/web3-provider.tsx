'use client';

/**
 * Web3 Provider
 * Wraps the app with Wagmi, Reown AppKit, and React Query
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { AppKitProvider } from '@reown/appkit/react';
import { wagmiConfig, wagmiAdapter, base, baseSepolia } from '@/lib/wagmi/config';
import { useTheme } from 'next-themes';
import { useState, useEffect } from 'react';

// Get WalletConnect Project ID from environment
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '000000000000000000000000000000000000000000';

export function Web3Provider({ children }: { children: React.ReactNode }) {
  const { resolvedTheme } = useTheme();
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000, // 30 seconds
            gcTime: 5 * 60 * 1000, // 5 minutes
            refetchOnWindowFocus: false,
            refetchOnReconnect: false,
            retry: 1,
          },
        },
      })
  );

  const themeMode = resolvedTheme === 'dark' ? 'dark' : 'light';

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <AppKitProvider
          adapters={[wagmiAdapter]}
          networks={[base, baseSepolia]}
          projectId={projectId}
          metadata={{
            name: 'Web3 Portfolio',
            description: 'Decentralized Developer Portfolio Platform on Base L2',
            url: typeof window !== 'undefined' ? window.location.origin : 'https://yourportfolio.com',
            icons: [
              typeof window !== 'undefined' 
                ? `${window.location.origin}/favicon.ico` 
                : 'https://yourportfolio.com/favicon.ico'
            ],
          }}
          features={{
            analytics: true,
            email: false,
            socials: ['google', 'x', 'github', 'apple', 'discord'],
          }}
          themeMode={themeMode}
          themeVariables={{
            '--w3m-accent': 'hsl(var(--primary))',
          }}
        >
          {children}
        </AppKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
