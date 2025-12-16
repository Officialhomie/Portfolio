'use client';

/**
 * Home Page
 * Main landing page with hero, stats, and CTAs
 */

import Link from 'next/link';
import { PageLayout } from '@/components/layout/page-layout';
import { StatsDisplay } from '@/components/stats/stats-display';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  return (
    <PageLayout>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-5xl font-bold mb-6">
          OneTrueHomie's Portfolio
        </h2>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Showcasing projects as NFTs, engaging with visitors through on-chain guestbook,
          and letting the community vote on favorites using blockchain technology.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link href="/projects">
            <Button size="lg">
              Explore Projects
            </Button>
          </Link>
          <Link href="/visitor-book">
            <Button size="lg" variant="outline">
              View Visitor Book
            </Button>
          </Link>
          <Link href="/faucet">
            <Button size="lg" variant="secondary">
              Claim Tokens
            </Button>
          </Link>
        </div>
      </section>

      {/* Stats Section - Now with REAL data from contracts! */}
      <section className="container mx-auto px-4 py-12">
        <StatsDisplay />
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <h3 className="text-3xl font-bold text-center mb-12">Key Features</h3>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              title: 'NFT Projects',
              description: 'Each project is minted as an ERC-721 NFT with IPFS metadata',
            },
            {
              title: 'Token-Gated Voting',
              description: 'Vote for your favorite projects using HOMIE tokens (tokens are burned)',
            },
            {
              title: 'Visitor Book',
              description: 'Leave permanent on-chain messages and mint limited edition Visit NFTs',
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="bg-card border border-border rounded-lg p-6"
            >
              <h4 className="text-xl font-semibold mb-3">{feature.title}</h4>
              <p className="text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

    </PageLayout>
  );
}
