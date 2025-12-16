/**
 * Wagmi configuration for Web3 integration with Reown AppKit
 */

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
// Use fallback Project ID if not configured (for development only)
const fallbackProjectId = '000000000000000000000000000000000000000000';
const effectiveProjectId = projectId && 
  projectId !== 'your_project_id_here' && 
  projectId !== 'YOUR_PROJECT_ID' &&
  projectId.length > 20
  ? projectId 
  : fallbackProjectId;

const wagmiAdapter = new WagmiAdapter({
  networks: [base, baseSepolia],
  projectId: effectiveProjectId,
  transports: {
    [base.id]: http(process.env.NEXT_PUBLIC_BASE_RPC_URL || 'https://mainnet.base.org'),
    [baseSepolia.id]: http(
      process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org'
    ),
  },
  ssr: true,
});

// Note: AppKit is initialized via AppKitProvider in web3-provider.tsx
// We only create the wagmi adapter here, not the AppKit instance

// Export wagmi config from adapter
export const wagmiConfig = wagmiAdapter.wagmiConfig;

// Export adapter for use in provider
export { wagmiAdapter };

// Export for compatibility
export const config = wagmiConfig;

// Export chains for convenience
export { base, baseSepolia };
export const supportedChains = [base, baseSepolia] as const;
