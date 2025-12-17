'use client';

/**
 * Home Page
 * Main landing page with hero, stats, featured projects, and CTAs
 */

import Link from 'next/link';
import { PageLayout } from '@/components/layout/page-layout';
import { StatsDisplay } from '@/components/stats/stats-display';
import { Button } from '@/components/ui/button';
import { GitHubProjectCard } from '@/components/projects/github-project-card';
import { useFeaturedProjects } from '@/hooks/use-github-projects';
import { useScrollAnimation } from '@/hooks/use-scroll-animation';
import { ArrowRight, BookOpen, Vote, Droplet, Github, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export default function HomePage() {
  const { projects: featuredProjects } = useFeaturedProjects();
  const heroRef = useScrollAnimation();
  const featuredRef = useScrollAnimation();
  const featuresRef = useScrollAnimation();
  const ctaRef = useScrollAnimation();

  return (
    <PageLayout>
      {/* Hero Section */}
      <section
        ref={heroRef.ref}
        className={cn(
          'container mx-auto px-4 py-20 text-center transition-all duration-700',
          heroRef.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        )}
      >
        <h2 className="text-5xl font-bold mb-6 gradient-text">
          OneTrueHomie's <span className="text-highlight-glow">Decentralized</span> Developer Portfolio
        </h2>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto transition-all duration-700 delay-100">
          Showcasing <span className="accent-highlight">Web3 projects</span> as NFTs, engaging with visitors through <span className="accent-highlight">on-chain guestbook</span>,
          and letting the community vote on favorites using <span className="accent-highlight">blockchain technology</span> on Base L2.
        </p>
        <div className="flex gap-4 justify-center flex-wrap transition-all duration-700 delay-200">
          <Link href="/projects">
            <Button size="lg" className="gap-2 transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-primary/25 active:scale-95">
              Explore Projects
              <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
            </Button>
          </Link>
          <Link href="/visitor-book">
            <Button size="lg" variant="outline" className="gap-2 transition-all duration-200 hover:scale-105 hover:border-primary/50 hover:shadow-md active:scale-95">
              <BookOpen className="w-4 h-4 transition-transform duration-200 group-hover:rotate-12" />
              Sign Visitor Book
            </Button>
          </Link>
          <Link href="/voting">
            <Button size="lg" variant="secondary" className="gap-2 transition-all duration-200 hover:scale-105 hover:bg-primary/10 hover:shadow-md active:scale-95">
              <Vote className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" />
              Vote for Projects
            </Button>
          </Link>
        </div>
      </section>

      {/* Stats Section */}
      <section className="container mx-auto px-4 py-12">
        <div className="bg-gradient-to-r from-primary/30 via-accent/30 to-primary/30 rounded-2xl p-8 border-2 border-gradient shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300">
          <StatsDisplay />
        </div>
      </section>

      {/* Featured Projects Section */}
      {featuredProjects.length > 0 && (
        <section
          ref={featuredRef.ref}
          className={cn(
            'container mx-auto px-4 py-20 transition-all duration-700',
            featuredRef.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          )}
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-3xl font-bold mb-2 gradient-text">
                <span className="text-highlight-glow">Featured</span> Projects
              </h3>
              <p className="text-muted-foreground">
                Check out my latest and most <span className="accent-highlight">impactful Web3 projects</span>
              </p>
            </div>
            <Link href="/projects">
              <Button variant="outline" className="gap-2 transition-all duration-200 hover:scale-105 hover:border-primary/50 hover:shadow-md active:scale-95">
                View All
                <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {featuredProjects.slice(0, 3).map((project, index) => (
              <div
                key={project.id}
                className="transition-all duration-700"
                style={{
                  transitionDelay: `${index * 100}ms`,
                  opacity: featuredRef.isVisible ? 1 : 0,
                  transform: featuredRef.isVisible ? 'translateY(0)' : 'translateY(20px)',
                }}
              >
                <GitHubProjectCard
                  project={project}
                  featured
                  showActions
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Features Section */}
      <section
        ref={featuresRef.ref}
        className={cn(
          'container mx-auto px-4 py-20 transition-all duration-700',
          featuresRef.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        )}
      >
        <h3 className="text-3xl font-bold text-center mb-12 gradient-text">
          <span className="text-highlight-glow">Key</span> Features
        </h3>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              title: 'NFT Projects',
              description: 'Each project is minted as an ERC-721 NFT with IPFS metadata. Showcase your work on-chain!',
              icon: Github,
              link: '/projects',
            },
            {
              title: 'Token-Gated Voting',
              description: 'Vote for your favorite projects using $HOMIE tokens. Each vote costs 10 tokens which are burned.',
              icon: Vote,
              link: '/voting',
            },
            {
              title: 'Visitor Book',
              description: 'Leave permanent on-chain messages and mint limited edition Visit NFTs. Your message lives forever!',
              icon: BookOpen,
              link: '/visitor-book',
            },
          ].map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Link
                key={feature.title}
                href={feature.link}
                className="transition-all duration-700"
                style={{
                  transitionDelay: `${index * 150}ms`,
                  opacity: featuresRef.isVisible ? 1 : 0,
                  transform: featuresRef.isVisible ? 'translateY(0)' : 'translateY(20px)',
                }}
              >
                <div className="bg-gradient-to-br from-card via-primary/20 to-card border-2 border-gradient rounded-lg p-6 hover:shadow-xl hover:-translate-y-2 transition-all duration-300 cursor-pointer group hover:border-primary/60 hover:bg-gradient-to-br hover:from-primary/30 hover:via-accent/30 hover:to-primary/30">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-gradient-to-br from-primary/40 to-accent/40 rounded-lg group-hover:from-primary/60 group-hover:to-accent/60 group-hover:scale-110 transition-all duration-300 border-2 border-primary/50 group-hover:border-primary/80 group-hover:shadow-md group-hover:shadow-primary/30">
                      <Icon className="w-5 h-5 text-primary transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110" />
                    </div>
                    <h4 className="text-xl font-semibold gradient-text-subtle group-hover:gradient-text transition-all duration-200">
                      {feature.title}
                    </h4>
                  </div>
                  <p className="text-muted-foreground group-hover:text-foreground transition-colors duration-200">
                    {feature.description}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* CTA Section */}
      <section
        ref={ctaRef.ref}
        className={cn(
          'container mx-auto px-4 py-20 transition-all duration-700',
          ctaRef.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        )}
      >
        <div className="bg-gradient-to-r from-primary/40 via-accent/40 to-primary/40 rounded-2xl p-12 text-center border-2 border-gradient hover:border-primary/80 transition-all duration-300 hover:shadow-xl hover:shadow-primary/40 backdrop-blur-sm">
          <h3 className="text-3xl font-bold mb-4 gradient-text">
            Ready to <span className="text-highlight-glow">Explore</span>?
          </h3>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            Connect your wallet, claim some <span className="accent-highlight">$HOMIE tokens</span>, and start <span className="accent-highlight">voting for your favorite projects</span>!
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/faucet">
              <Button size="lg" className="gap-2 transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-primary/25 active:scale-95">
                <Droplet className="w-4 h-4 transition-transform duration-200 group-hover:rotate-12" />
                Claim Tokens
              </Button>
            </Link>
            <Link href="/projects">
              <Button size="lg" variant="outline" className="gap-2 transition-all duration-200 hover:scale-105 hover:border-primary/50 hover:shadow-md active:scale-95">
                Browse Projects
                <ExternalLink className="w-4 h-4 transition-transform duration-200 group-hover:rotate-12" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </PageLayout>
  );
}
