'use client';

/**
 * Privy Provider
 * Replaces Web3Provider and SmartWalletProvider with Privy's unified solution
 * Provides wallet connection, embedded wallets, and smart wallet support
 */

import { PrivyProvider } from '@privy-io/react-auth';
import { createConfig, WagmiProvider } from '@privy-io/wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { base, baseSepolia } from 'wagmi/chains';
import { http } from 'wagmi';
import { useState } from 'react';
import { useTheme } from 'next-themes';

// Get Privy App ID from environment
const privyAppId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;

if (!privyAppId && typeof window !== 'undefined') {
  console.warn(
    '⚠️ Privy App ID not configured.\n' +
    'Get a free App ID at: https://dashboard.privy.io/\n' +
    'Then add it to your .env.local file as: NEXT_PUBLIC_PRIVY_APP_ID=your_app_id'
  );
}

// Create Wagmi config using Privy's createConfig
const wagmiConfig = createConfig({
  chains: [base, baseSepolia],
  transports: {
    [base.id]: http(process.env.NEXT_PUBLIC_BASE_RPC_URL || 'https://mainnet.base.org'),
    [baseSepolia.id]: http(
      process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org'
    ),
  },
  ssr: true,
});

export function PrivyProviderWrapper({ children }: { children: React.ReactNode }) {
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
    <PrivyProvider
      appId={privyAppId || ''}
      config={{
        // Embedded wallets - create automatically for users without wallets
        embeddedWallets: {
          createOnLogin: 'users-without-wallets',
          requireUserPasswordOnCreate: false,
          noPromptOnSignature: false,
        },
        // Smart wallets - enable ERC-4337 account abstraction with gas sponsorship
        smartWallets: {
          enabled: true,
          chainType: 'eip155',
          // Gas sponsorship is configured in Privy Dashboard
          // Go to: https://dashboard.privy.io -> Gas Sponsorship tab
          // Enable sponsorship for Base and Base Sepolia chains
        },
        // Login methods - all enabled for maximum flexibility
        loginMethods: [
          'email',      // Email OTP (one-time passcode)
          'wallet',     // External wallet connection (MetaMask, Coinbase Wallet, etc.)
          'sms',        // SMS OTP
          'google',     // Google OAuth
          'x',          // X (Twitter) OAuth
          'github',     // GitHub OAuth
          'apple',      // Apple Sign In
          'discord',    // Discord OAuth
        ],
        // Appearance
        appearance: {
          theme: themeMode,
          accentColor: 'hsl(var(--primary))',
          logo: '/IMG_6745.JPG', // Use relative path to avoid hydration mismatch
        },
        // Legal
        legal: {
          termsAndConditionsUrl: 'https://onetruehomie.com/terms',
          privacyPolicyUrl: 'https://onetruehomie.com/privacy',
        },
        // Metadata
        metadata: {
          name: 'OneTrueHomie - Web3 Portfolio',
          description: "OneTrueHomie's Decentralized Developer Portfolio Platform on Base L2",
          url: process.env.NEXT_PUBLIC_SITE_URL || 'https://onetruehomie.com',
          icons: ['/IMG_6745.JPG'], // Use relative path to avoid hydration mismatch
        },
      }}
    >
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={wagmiConfig} reconnectOnMount={false}>
          {children}
        </WagmiProvider>
      </QueryClientProvider>
    </PrivyProvider>
  );
}

