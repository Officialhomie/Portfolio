'use client';

/**
 * Site Footer Component
 * Footer with links and information
 */

import Link from 'next/link';
import Image from 'next/image';
import { Github, Twitter } from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t-2 border-primary/40 bg-gradient-to-r from-muted/50 via-primary/25 to-muted/50">
      {/* Main Footer */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* About */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Image 
                src="/IMG_6745.JPG" 
                alt="OneTrueHomie Logo" 
                width={32}
                height={32}
                className="rounded-lg object-cover"
              />
              <span className="font-bold">OneTrueHomie</span>
            </div>
            <p className="text-sm text-muted-foreground">
              OneTrueHomie's decentralized portfolio platform built on Base L2. Showcase projects as NFTs,
              vote with tokens, and engage on-chain.
            </p>
          </div>

          {/* Explore */}
          <div>
            <h4 className="font-semibold mb-4">Explore</h4>
            <div className="space-y-2 text-sm">
              <Link href="/projects" className="block text-muted-foreground hover:text-foreground transition-colors">
                All Projects
              </Link>
              <Link href="/voting" className="block text-muted-foreground hover:text-foreground transition-colors">
                Voting Leaderboard
              </Link>
              <Link href="/visitor-book" className="block text-muted-foreground hover:text-foreground transition-colors">
                Visitor Book
              </Link>
              <Link href="/faucet" className="block text-muted-foreground hover:text-foreground transition-colors">
                Token Faucet
              </Link>
            </div>
          </div>

          {/* Developer */}
          <div>
            <h4 className="font-semibold mb-4">Developer</h4>
            <div className="space-y-2 text-sm">
              <a
                href="https://github.com/Officialhomie"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <Github className="h-4 w-4" />
                @Officialhomie
              </a>
              <a
                href="https://github.com/ThePsalmsLabs"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <Github className="h-4 w-4" />
                ThePsalmsLabs
              </a>
            </div>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-semibold mb-4">Resources</h4>
            <div className="space-y-2 text-sm">
              <a
                href="https://docs.base.org"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-muted-foreground hover:text-foreground transition-colors"
              >
                Base Docs
              </a>
              <a
                href="https://basescan.org"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-muted-foreground hover:text-foreground transition-colors"
              >
                Basescan
              </a>
              <Link href="/" className="block text-muted-foreground hover:text-foreground transition-colors">
                Documentation
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-border">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
            <p>
              © {currentYear} OneTrueHomie. Built on Base L2 with ❤️
            </p>
            <div className="flex items-center gap-4">
              <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded border border-primary/30">
                Powered by Web3
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
