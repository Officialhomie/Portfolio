import { createConfig, http, createStorage } from 'wagmi'
import { base } from 'wagmi/chains'
import { injected, walletConnect } from 'wagmi/connectors'

// Create storage with persistence
const storage = createStorage({
  storage: typeof window !== 'undefined' ? window.localStorage : undefined,
})

export const config = createConfig({
  chains: [base],
  connectors: [
    injected({
      target: 'metaMask',
    }),
    injected({
      target: 'coinbaseWallet',
    }),
    injected(),
    ...(typeof window !== 'undefined' && process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID
      ? [
          walletConnect({
            projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,
            showQrModal: true,
          }),
        ]
      : []),
  ],
  transports: {
    [base.id]: http(process.env.NEXT_PUBLIC_BASE_RPC_URL || 'https://mainnet.base.org'),
  },
  ssr: false,
  storage,
})

export default config
