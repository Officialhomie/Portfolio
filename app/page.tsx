import { Hero } from './components/Hero'
import { ProjectsShowcase } from './components/ProjectsShowcase'
import { VisitorBook } from './components/VisitorBook'
import { NFTMint } from './components/NFTMint'
import { TokenFaucet } from './components/TokenFaucet'
import { WalletConnect } from './components/WalletConnect'

export const dynamic = 'force-dynamic'

export default function Home() {
  return (
    <main className="relative min-h-screen">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-glass-border">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="font-mono font-bold text-xl text-foreground">
            Web3 Portfolio
          </div>
          <WalletConnect />
        </div>
      </header>

      {/* Hero Section */}
      <Hero />

      {/* Projects Showcase */}
      <ProjectsShowcase />

      {/* Interactive Features Section */}
      <section className="py-20 px-4 bg-gradient-to-b from-transparent to-background/50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-mono font-bold text-center mb-12 text-foreground">
            Interactive Features
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <TokenFaucet />
            <NFTMint />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <VisitorBook />
            <div className="glass rounded-xl p-6">
              <h3 className="text-xl font-mono font-bold text-foreground mb-4">
                About This Portfolio
              </h3>
              <p className="text-foreground-secondary mb-4">
                This portfolio is a living blockchain application. Every interaction demonstrates
                real Web3 development skills including smart contract interactions, IPFS storage,
                NFT minting, and token economics.
              </p>
              <div className="space-y-2 text-sm text-foreground-secondary">
                <p>✓ Deployed on Base Mainnet</p>
                <p>✓ All project assets stored on IPFS</p>
                <p>✓ On-chain visitor book</p>
                <p>✓ Token-gated voting system</p>
                <p>✓ Limited edition NFTs</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-glass-border py-8 px-4">
        <div className="max-w-7xl mx-auto text-center text-foreground-secondary text-sm">
          <p>Built with Next.js, wagmi, viem, and deployed on Base Mainnet</p>
          <p className="mt-2">
            © {new Date().getFullYear()} Web3 Portfolio Protocol
          </p>
        </div>
      </footer>
      </main>
  )
}
