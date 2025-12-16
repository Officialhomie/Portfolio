/**
 * Wagmi configuration for Web3 integration with Reown AppKit
 */

import { createAppKit } from '@reown/appkit/react';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { base, baseSepolia } from 'wagmi/chains';
import { http } from 'wagmi';

// Get WalletConnect Project ID from environment
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;

// Validate project ID
if (!projectId || projectId === 'your_project_id_here' || projectId === 'YOUR_PROJECT_ID') {
  if (typeof window !== 'undefined') {
    console.warn(
      '⚠️ WalletConnect Project ID not configured. Wallet connection may not work properly.\n' +
      'Get a free Project ID at: https://cloud.walletconnect.com/\n' +
      'Then add it to your .env.local file as: NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id'
    );
  }
}

// Create Wagmi adapter (it will create the wagmi config internally)
const wagmiAdapter = new WagmiAdapter({
  networks: [base, baseSepolia],
  projectId: projectId || '000000000000000000000000000000000000000000',
  transports: {
    [base.id]: http(process.env.NEXT_PUBLIC_BASE_RPC_URL || 'https://mainnet.base.org'),
    [baseSepolia.id]: http(
      process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org'
    ),
  },
  ssr: true,
});

// Create AppKit instance
export const appKit = createAppKit({
  adapters: [wagmiAdapter],
  networks: [base, baseSepolia],
  projectId: projectId || '000000000000000000000000000000000000000000',
  metadata: {
    name: 'Web3 Portfolio',
    description: 'Decentralized Developer Portfolio Platform on Base L2',
    url: typeof window !== 'undefined' ? window.location.origin : 'https://yourportfolio.com',
    icons: [
      typeof window !== 'undefined' 
        ? `${window.location.origin}/favicon.ico` 
        : 'https://yourportfolio.com/favicon.ico'
    ],
  },
  features: {
    analytics: true,
    email: false,
    socials: ['google', 'x', 'github', 'apple', 'discord'],
  },
  themeMode: 'light',
  themeVariables: {
    '--w3m-accent': 'hsl(var(--primary))',
  },
});

// Export wagmi config from adapter
export const wagmiConfig = wagmiAdapter.wagmiConfig;

// Export adapter for use in provider
export { wagmiAdapter };

// Export for compatibility
export const config = wagmiConfig;

// Export chains for convenience
export { base, baseSepolia };
export const supportedChains = [base, baseSepolia] as const;
