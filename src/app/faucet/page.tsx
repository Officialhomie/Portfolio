'use client';

/**
 * Faucet Page
 * Claim HOMIE tokens for voting
 */

import Link from 'next/link';
import { FaucetClaim } from '@/components/faucet/faucet-claim';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageLayout } from '@/components/layout/page-layout';
import { useTotalVotes } from '@/hooks/contracts/useProjectVoting';
import { usePortfolioToken } from '@/hooks/contracts/usePortfolioToken';

export default function FaucetPage() {
  const { totalVotes } = useTotalVotes();
  const { totalSupply } = usePortfolioToken();

  return (
    <PageLayout>
      {/* Page Header */}
      <section className="container mx-auto px-4 py-12">
        <div className="max-w-3xl">
          <h2 className="text-4xl font-bold mb-4 gradient-text">
            Token <span className="text-highlight-glow">Faucet</span>
          </h2>
          <p className="text-xl text-muted-foreground">
            Claim free <span className="accent-highlight">$HOMIE tokens</span> to participate in project voting.
            Vote for your favorite projects and help <span className="accent-highlight">build the community</span>!
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="container mx-auto px-4 pb-8">
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl">
          <Card className="border-gradient hover:shadow-lg hover:shadow-primary/20 transition-all duration-300">
            <CardHeader>
              <CardTitle className="text-sm font-medium gradient-text-subtle">Total Supply</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold gradient-text">
                {parseFloat(totalSupply).toLocaleString()} $HOMIE
              </p>
            </CardContent>
          </Card>
          <Card className="border-gradient hover:shadow-lg hover:shadow-accent/20 transition-all duration-300">
            <CardHeader>
              <CardTitle className="text-sm font-medium gradient-text-subtle">Total Votes Cast</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold gradient-text">{totalVotes}</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Main Content */}
      <section className="container mx-auto px-4 pb-20">
        <div className="grid lg:grid-cols-3 gap-8 max-w-6xl">
          {/* Faucet - Left Column */}
          <div className="lg:col-span-2">
            <FaucetClaim />
          </div>

          {/* Info - Right Column */}
          <div className="space-y-6">
            {/* About PPT */}
            <Card className="border-gradient hover:shadow-lg hover:shadow-primary/20 transition-all duration-300">
              <CardHeader>
                <CardTitle className="gradient-text-subtle">About $HOMIE</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div>
                  <h4 className="font-semibold mb-2">Portfolio Protocol Token</h4>
                  <p className="text-muted-foreground">
                    $HOMIE is the native utility token for this Web3 portfolio platform.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Use Cases</h4>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• Vote for projects (10 $HOMIE per vote)</li>
                    <li>• Participate in governance (future)</li>
                    <li>• Access premium features (future)</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Tokenomics</h4>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• ERC-20 standard token</li>
                    <li>• Deflationary (burned on votes)</li>
                    <li>• Free faucet distribution</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Quick Links */}
            <Card className="border-gradient hover:shadow-lg hover:shadow-primary/20 transition-all duration-300">
              <CardHeader>
                <CardTitle className="gradient-text-subtle">Quick Links</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link
                  href="/projects"
                  className="block text-sm text-primary hover:underline"
                >
                  → Browse Projects
                </Link>
                <Link
                  href="/voting"
                  className="block text-sm text-primary hover:underline"
                >
                  → Voting Leaderboard
                </Link>
                <Link
                  href="/visitor-book"
                  className="block text-sm text-primary hover:underline"
                >
                  → Sign Visitor Book
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </PageLayout>
  );
}
