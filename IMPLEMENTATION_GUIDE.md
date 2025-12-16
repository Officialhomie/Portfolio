# Web3 Portfolio - Complete Implementation Guide

## 🎯 Project Overview

This is a production-ready frontend for the Web3 Portfolio platform on Base L2. The architecture follows enterprise-grade patterns with clear separation between contract logic, business logic, and presentation.

## 📁 Project Structure

```
web3-portfolio/
├── contracts/                  # Solidity smart contracts (Foundry)
├── out/                        # Compiled contract artifacts
├── src/
│   ├── app/                    # Next.js 16 App Router pages
│   │   ├── layout.tsx          # Root layout with providers
│   │   ├── page.tsx            # Home page
│   │   ├── globals.css         # Global styles
│   │   └── [future pages]/
│   ├── components/             # React components
│   │   ├── ui/                 # Reusable UI primitives
│   │   ├── layout/             # Layout components
│   │   ├── projects/           # Project-related components
│   │   ├── visitor-book/       # Visitor book components
│   │   ├── faucet/             # Faucet components
│   │   ├── nft/                # NFT components
│   │   └── stats/              # Statistics components
│   ├── hooks/                  # Custom React hooks
│   │   └── contracts/          # Contract interaction hooks
│   ├── lib/                    # Core utilities
│   │   ├── contracts/          # Contract ABIs and addresses
│   │   │   ├── abis/           # JSON ABI files
│   │   │   ├── addresses.ts    # Contract addresses
│   │   │   └── config.ts       # Contract configuration
│   │   ├── wagmi/              # Wagmi configuration
│   │   ├── ipfs/               # IPFS utilities
│   │   ├── utils/              # General utilities
│   │   └── types/              # TypeScript types
│   └── providers/              # React context providers
├── public/                     # Static assets
│   ├── images/                 # Project images
│   └── projects-metadata.json  # Project data
├── .env.local                  # Environment variables (create from .env.example)
└── package.json
```

## 🚀 Getting Started

### 1. Prerequisites

- Node.js 18+ and npm
- Git
- MetaMask or Coinbase Wallet
- WalletConnect Project ID (get from https://cloud.walletconnect.com/)

### 2. Installation

```bash
# Clone the repository
cd web3-portfolio

# Install dependencies
npm install

# Create environment file
cp .env.example .env.local

# Edit .env.local with your WalletConnect Project ID
# NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here
```

### 3. Update Contract Addresses

After deploying contracts, update addresses in `src/lib/contracts/addresses.ts`:

```typescript
export const CONTRACT_ADDRESSES = {
  [base.id]: {
    PortfolioToken: '0xYOUR_DEPLOYED_ADDRESS',
    ProjectNFT: '0xYOUR_DEPLOYED_ADDRESS',
    // ... etc
  },
};
```

### 4. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000`

## 🏗️ Architecture Deep Dive

### Contract Layer

**Location**: `src/lib/contracts/`

**Responsibilities**:
- Store contract ABIs (auto-extracted from Foundry compilation)
- Manage contract addresses per chain
- Provide type-safe contract configurations

**Key Files**:
- `abis/index.ts` - ABI exports
- `addresses.ts` - Contract addresses by chain
- `config.ts` - Centralized contract configuration

### Wagmi Layer

**Location**: `src/lib/wagmi/`

**Responsibilities**:
- Configure Web3 wallet connections
- Set up RPC providers
- Define supported chains (Base, Base Sepolia)

**Key Files**:
- `config.ts` - Wagmi and RainbowKit configuration

### Hooks Layer

**Location**: `src/hooks/contracts/`

**Responsibilities**:
- Encapsulate contract read/write logic
- Handle transaction lifecycles
- Manage data fetching and caching
- Provide React components with clean APIs

**Pattern Example**:
```typescript
// usePortfolioToken.ts
export function usePortfolioToken() {
  const { address } = useAccount();

  const { data, isLoading } = useReadContracts({
    contracts: [
      { address: TOKEN_ADDRESS, abi: TOKEN_ABI, functionName: 'balanceOf', args: [address] },
      { address: TOKEN_ADDRESS, abi: TOKEN_ABI, functionName: 'canClaimFaucet', args: [address] },
    ],
  });

  return {
    balance: formatUnits(data?.[0]?.result || 0n, 18),
    canClaimFaucet: data?.[1]?.result,
    isLoading,
  };
}
```

### Component Layer

**Location**: `src/components/`

**Responsibilities**:
- Pure presentation (no direct contract calls)
- Receive data via props from hooks
- Emit events via callbacks
- Handle UI states (loading, error, success)

**Component Hierarchy**:
```
Page (smart component - uses hooks)
  ├── Layout Component
  │   └── UI Components (buttons, cards, etc.)
  └── Feature Component (uses hooks)
      └── UI Components
```

### Provider Layer

**Location**: `src/providers/`

**Responsibilities**:
- Wrap app with necessary contexts
- Configure global state (Wagmi, React Query, Theme)

**Key Providers**:
- `Web3Provider` - Wagmi + RainbowKit + React Query
- `ThemeProvider` - Dark/light mode

## 🔧 Next Steps for Implementation

### Phase 1: Core Hooks (Priority: High)

Create these contract hooks in `src/hooks/contracts/`:

1. **usePortfolioToken.ts**
   - `usePortfolioToken()` - Read token data
   - `useClaimFaucet()` - Claim faucet tokens

2. **useProjectNFT.ts**
   - `useProjectList()` - Fetch all projects
   - `useProject(tokenId)` - Fetch single project
   - `useEndorseProject(tokenId)` - Endorse project

3. **useProjectVoting.ts**
   - `useProjectVotes(projectId)` - Get vote count
   - `useVote(projectId)` - Cast vote
   - `useCanVote(projectId)` - Check if user can vote

4. **useVisitNFT.ts**
   - `useVisitNFT()` - Get Visit NFT data
   - `useMintVisitNFT()` - Mint Visit NFT

5. **useVisitorBook.ts**
   - `useVisitorBook(pageSize)` - Get visitor list
   - `useSignVisitorBook()` - Sign visitor book

### Phase 2: UI Components (Priority: High)

Create these in `src/components/ui/`:

1. **button.tsx** - Reusable button component
2. **card.tsx** - Card container
3. **input.tsx** - Form input
4. **textarea.tsx** - Textarea for visitor book
5. **skeleton.tsx** - Loading skeletons
6. **toast.tsx** - Toast notifications

Use shadcn/ui for inspiration or copy components directly.

### Phase 3: Feature Components (Priority: Medium)

Create these domain-specific components:

1. **components/layout/**
   - `header.tsx` - Site header with navigation
   - `footer.tsx` - Site footer
   - `wallet-connection.tsx` - Wallet connect button (uses RainbowKit)

2. **components/projects/**
   - `project-card.tsx` - Project card in gallery
   - `project-grid.tsx` - Grid of project cards
   - `project-detail.tsx` - Full project view
   - `vote-button.tsx` - Vote for project button
   - `endorse-button.tsx` - Endorse project button

3. **components/visitor-book/**
   - `visitor-list.tsx` - Paginated visitor list
   - `visitor-card.tsx` - Individual visitor entry
   - `visitor-book-form.tsx` - Sign visitor book form

4. **components/faucet/**
   - `faucet-claim.tsx` - Claim faucet tokens
   - `cooldown-timer.tsx` - Countdown timer

5. **components/nft/**
   - `visit-nft-mint.tsx` - Mint Visit NFT component

6. **components/stats/**
   - `stats-display.tsx` - Platform statistics

### Phase 4: Pages (Priority: Medium)

Create these pages in `src/app/`:

1. **app/projects/page.tsx** - Projects gallery
2. **app/projects/[tokenId]/page.tsx** - Project detail
3. **app/voting/page.tsx** - Voting leaderboard
4. **app/visitor-book/page.tsx** - Visitor book
5. **app/faucet/page.tsx** - Token faucet
6. **app/gallery/page.tsx** - User's NFT gallery

### Phase 5: Helpers (Priority: Low)

1. **use-ipfs-metadata.ts** - Hook for fetching IPFS metadata
2. **use-transaction.ts** - Generic transaction handler hook
3. **Additional utility functions as needed**

## 📝 Development Guidelines

### TypeScript

- Always use strict typing
- Use `bigint` for on-chain numbers
- Use `0x${string}` for addresses
- Import types from `viem` and `wagmi`

### React Patterns

- Use client components (`'use client'`) for interactive features
- Use server components for static content
- Keep components small and focused
- Extract hooks for reusable logic

### Error Handling

```typescript
try {
  await writeContract({ ... });
} catch (error) {
  if (error.message.includes('user rejected')) {
    toast({ title: 'Transaction cancelled' });
  } else {
    toast({ title: 'Transaction failed', description: error.message });
  }
}
```

### Loading States

Always show loading states:
```typescript
{isLoading ? <Skeleton /> : <Component data={data} />}
```

### Transaction States

Every write operation should show:
- Pending (user approved in wallet)
- Confirming (waiting for block)
- Success (transaction confirmed)
- Error (transaction failed)

## 🎨 Styling Guidelines

### Tailwind Classes

- Use design tokens: `bg-background`, `text-foreground`
- Responsive: `md:grid-cols-2 lg:grid-cols-3`
- Dark mode: `dark:bg-gray-900`

### Component Styling

```typescript
<Card className="p-6 hover:shadow-lg transition-shadow">
  <h3 className="text-lg font-semibold mb-2">{title}</h3>
  <p className="text-muted-foreground">{description}</p>
</Card>
```

## 🧪 Testing Strategy

### Manual Testing Checklist

- [ ] Wallet connection works
- [ ] Network switching works (Base/Base Sepolia)
- [ ] Contract reads display correct data
- [ ] Contract writes execute successfully
- [ ] Transaction states update correctly
- [ ] Error messages are user-friendly
- [ ] Loading states show appropriately
- [ ] Responsive on mobile/tablet/desktop

### Contract Testing

Smart contracts should be tested with Foundry:
```bash
forge test
```

## 📚 Resources

- [Wagmi Docs](https://wagmi.sh/)
- [RainbowKit Docs](https://www.rainbowkit.com/)
- [Base Docs](https://docs.base.org/)
- [Next.js Docs](https://nextjs.org/docs)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)

## 🐛 Troubleshooting

### Common Issues

**Issue**: "Module not found: Can't resolve 'wagmi'"
**Solution**: Run `npm install` again

**Issue**: "Invalid chain ID"
**Solution**: Make sure you're connected to Base or Base Sepolia in MetaMask

**Issue**: "Transaction failed"
**Solution**: Check you have enough ETH for gas and tokens for transactions

**Issue**: IPFS images not loading
**Solution**: Try different IPFS gateways in `src/lib/ipfs/client.ts`

## 📊 Project Metadata

All your projects are catalogued in `public/projects-metadata.json` with:
- MultiSig Wallet
- HealthTrove
- iFindr
- EducationChain
- DEX dApp Template
- CaveFi
- DX Bloom
- OneSeed
- Bridge Scope
- PaySteam

These will be displayed as NFTs once you mint them via the `ProjectNFT` contract.

## 🎯 MVP Checklist

### Must Have (MVP)
- [x] Project structure
- [x] Contract ABIs configured
- [x] Wagmi setup
- [x] Basic home page
- [ ] Contract hooks
- [ ] Project gallery page
- [ ] Visitor book page
- [ ] Faucet page
- [ ] Wallet connection
- [ ] Mobile responsive

### Nice to Have (v2)
- [ ] Project search/filter
- [ ] ENS resolution
- [ ] Transaction history
- [ ] User profiles
- [ ] Analytics dashboard
- [ ] Admin panel for minting projects

## 🚢 Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
```

### Environment Variables

Make sure to set these in Vercel:
- `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`
- Contract addresses (if using env vars instead of hardcoding)

## 💡 Tips

1. **Start Simple**: Build one page at a time
2. **Test Frequently**: Test each hook as you build it
3. **Use Testnets**: Develop on Base Sepolia first
4. **Cache Aggressively**: IPFS data is immutable, cache forever
5. **Batch Reads**: Use `useReadContracts` for multiple calls
6. **Handle Errors**: Always provide user-friendly error messages

## 📞 Support

- GitHub Issues: [Report bugs](https://github.com/Officialhomie)
- Discord: [Join community](#)

---

**Built with ❤️ on Base L2**
