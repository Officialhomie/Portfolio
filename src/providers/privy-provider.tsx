'use client';

/**
 * Privy Provider
 * Replaces Web3Provider and SmartWalletProvider with Privy's unified solution
 * Provides wallet connection, embedded wallets, and smart wallet support
 */

import { PrivyProvider } from '@privy-io/react-auth';
import { SmartWalletsProvider } from '@privy-io/react-auth/smart-wallets';
import { createConfig, WagmiProvider } from '@privy-io/wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { base, baseSepolia } from 'wagmi/chains';
import { http } from 'wagmi';
import { useState, useEffect } from 'react';

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

  // Detect theme on the client side to avoid SSR mismatch
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>('dark');

  useEffect(() => {
    // Check for theme preference on mount (client-side only)
    const isDark = document.documentElement.classList.contains('dark');
    setThemeMode(isDark ? 'dark' : 'light');

    // Watch for theme changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          const isDark = document.documentElement.classList.contains('dark');
          setThemeMode(isDark ? 'dark' : 'light');
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, []);

  return (
    <PrivyProvider
      appId={privyAppId || ''}
      config={{
        // Embedded wallets - create for all users (including EOA users)
        // This ensures even users connecting with MetaMask get an embedded wallet
        // which can be used to create a smart wallet
        embeddedWallets: {
          ethereum: {
            createOnLogin: 'all-users', // Changed from 'users-without-wallets' to 'all-users'
          },
        },
        // Supported chains for the app
        supportedChains: [base, baseSepolia],
        defaultChain: base,
        // Login methods - all enabled for maximum flexibility
        loginMethods: [
          'email',      // Email OTP (one-time passcode)
          'wallet',     // External wallet connection (MetaMask, Coinbase Wallet, etc.)
          'sms',        // SMS OTP
          'google',     // Google OAuth
          'twitter',   // Twitter OAuth
          'github',     // GitHub OAuth
          'apple',      // Apple Sign In
          'discord',    // Discord OAuth
        ],
        // Appearance - configure wallet list to show Base Account (Coinbase Smart Wallet)
        appearance: {
          theme: themeMode,
          accentColor: '#8B5CF6', // Purple color
          logo: '/IMG_6745.JPG', // Use relative path to avoid hydration mismatch
          walletList: ['base_account', 'coinbase_wallet', 'metamask', 'rainbow', 'wallet_connect'], // Support for smart wallets
        },
        // Legal
        legal: {
          termsAndConditionsUrl: 'https://onetruehomie.com/terms',
          privacyPolicyUrl: 'https://onetruehomie.com/privacy',
        },
      }}
    >
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={wagmiConfig} reconnectOnMount={false}>
          <SmartWalletsProvider>
            {children}
          </SmartWalletsProvider>
        </WagmiProvider>
      </QueryClientProvider>
    </PrivyProvider>
  );
}

