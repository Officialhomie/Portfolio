'use client';

/**
 * Web3 Provider
 * Wraps the app with Wagmi, Reown AppKit, and React Query
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { AppKitProvider, type Features } from '@reown/appkit/react';
import { wagmiConfig, wagmiAdapter, base, baseSepolia } from '@/lib/wagmi/config';
import { useTheme } from 'next-themes';
import { useState, useEffect } from 'react';

// Get WalletConnect Project ID from environment
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;

// Validate project ID
const isValidProjectId = projectId && 
  projectId !== 'your_project_id_here' && 
  projectId !== 'YOUR_PROJECT_ID' &&
  projectId.length > 20;

const effectiveProjectId = isValidProjectId 
  ? projectId 
  : '000000000000000000000000000000000000000000';

if (!isValidProjectId && typeof window !== 'undefined') {
  console.warn(
    '⚠️ WalletConnect Project ID not configured or invalid.\n' +
    'Get a free Project ID at: https://cloud.reown.com/\n' +
    'Then add it to your .env.local file as: NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id\n' +
    'Wallet connection features may not work properly without a valid Project ID.'
  );
}

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

  // Disable analytics and reduce API calls when Project ID is invalid
  // This prevents 403 errors and reduces unnecessary network requests
  const features: Features = isValidProjectId ? {
    analytics: true,
    email: false,
    socials: ['google', 'x', 'github', 'apple', 'discord'],
  } : {
    analytics: false,
    email: false,
    socials: false,
  };

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <AppKitProvider
          adapters={[wagmiAdapter]}
          networks={[base, baseSepolia]}
          projectId={effectiveProjectId}
          metadata={{
            name: 'OneTrueHomie - Web3 Portfolio',
            description: 'OneTrueHomie\'s Decentralized Developer Portfolio Platform on Base L2',
            url: typeof window !== 'undefined' ? window.location.origin : 'https://onetruehomie.com',
            icons: [
              typeof window !== 'undefined' 
                ? `${window.location.origin}/IMG_6745.JPG` 
                : 'https://onetruehomie.com/IMG_6745.JPG'
            ],
          }}
          features={features}
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
