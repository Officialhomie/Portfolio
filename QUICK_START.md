# Quick Start Guide

## 🚀 Get Running in 5 Minutes

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: Set Up Environment

```bash
# Copy example environment file
cp .env.example .env.local

# Edit .env.local and add your WalletConnect Project ID
# Get one for free at: https://cloud.walletconnect.com/
```

### Step 3: Update Contract Addresses (After Deployment)

Edit `src/lib/contracts/addresses.ts` with your deployed contract addresses.

### Step 4: Run Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## ✅ What's Included

### ✨ Fully Configured
- ✅ Next.js 16 with App Router
- ✅ React 19
- ✅ TypeScript with strict mode
- ✅ Tailwind CSS with dark/light mode
- ✅ Wagmi + Viem for Web3
- ✅ RainbowKit for wallet connection
- ✅ TanStack Query for data fetching
- ✅ Contract ABIs extracted from Foundry
- ✅ IPFS utilities
- ✅ Project metadata for all your GitHub projects

### 📁 Project Structure Created
- All folders and configuration files
- Contract configuration layer
- Type definitions
- Utility functions
- Web3 providers
- Root layout with providers
- Home page with hero section

### 📋 Your Projects Catalogued
All 10+ projects from both GitHub accounts:
1. MultiSig Wallet
2. HealthTrove
3. iFindr
4. EducationChain (Decentralized School Tree)
5. DEX dApp Template
6. CaveFi
7. DX Bloom
8. OneSeed
9. Bridge Scope
10. PaySteam

## 🔨 What You Need to Build

### Priority 1: Contract Hooks
Create custom hooks in `src/hooks/contracts/`:
- `usePortfolioToken.ts`
- `useProjectNFT.ts`
- `useProjectVoting.ts`
- `useVisitNFT.ts`
- `useVisitorBook.ts`

### Priority 2: UI Components
Create reusable components in `src/components/ui/`:
- button, card, input, textarea, skeleton, toast

### Priority 3: Feature Components
Build domain components:
- Project cards and grid
- Visitor book form and list
- Faucet claim interface
- Vote and endorse buttons

### Priority 4: Pages
Create app pages:
- Projects gallery (`app/projects/page.tsx`)
- Project detail (`app/projects/[tokenId]/page.tsx`)
- Voting (`app/voting/page.tsx`)
- Visitor book (`app/visitor-book/page.tsx`)
- Faucet (`app/faucet/page.tsx`)
- NFT gallery (`app/gallery/page.tsx`)

## 📖 Documentation

- **IMPLEMENTATION_GUIDE.md** - Comprehensive implementation guide
- **README.md** - Project overview and contract details
- **.env.example** - Environment variables template

## 🎯 Next Commands

```bash
# Development
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Lint code
npm run lint
```

## 🌐 Useful Links

- [Wagmi Docs](https://wagmi.sh/)
- [RainbowKit Docs](https://www.rainbowkit.com/)
- [Base Docs](https://docs.base.org/)
- [Your GitHub](https://github.com/Officialhomie)
- [ThePsalmsLabs](https://github.com/ThePsalmsLabs)

## 🆘 Need Help?

1. Check `IMPLEMENTATION_GUIDE.md` for detailed instructions
2. Review the architecture in the guide
3. Follow the patterns in existing code
4. Test on Base Sepolia testnet first

## 🎉 You're Ready!

The foundation is laid. Now build the hooks, components, and pages following the patterns in the implementation guide.

**Happy Building! 🚀**
