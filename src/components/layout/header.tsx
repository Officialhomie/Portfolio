'use client';

/**
 * Site Header Component
 * Main navigation with mobile menu support
 */

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { ConnectButton } from '@/components/wallet/connect-button';
import { Button } from '@/components/ui/button';
import { Menu, X, Home, FolderKanban, Vote, BookOpen, Droplet, Fingerprint } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

const navigation = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'Projects', href: '/projects', icon: FolderKanban },
  { name: 'Voting', href: '/voting', icon: Vote },
  { name: 'Visitor Book', href: '/visitor-book', icon: BookOpen },
  { name: 'Faucet', href: '/faucet', icon: Droplet },
  { name: 'Biometric', href: '/biometric', icon: Fingerprint },
];

export function Header() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="border-b-2 border-primary/40 bg-gradient-to-r from-background via-primary/25 to-background backdrop-blur supports-[backdrop-filter]:bg-background/80 sticky top-0 z-50 shadow-sm shadow-primary/20">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 transition-all duration-200 hover:scale-105 active:scale-95">
            <Image 
              src="/IMG_6745.JPG" 
              alt="OneTrueHomie Logo" 
              width={40}
              height={40}
              className="rounded-lg object-cover transition-transform duration-200 hover:rotate-3"
              priority
            />
            <span className="font-bold text-base sm:text-lg transition-colors duration-200 hover:text-primary">
              OneTrueHomie
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href ||
                (item.href !== '/' && pathname.startsWith(item.href));

              return (
                <Link key={item.name} href={item.href}>
                  <Button
                    variant={isActive ? 'default' : 'ghost'}
                    size="sm"
                    className="gap-2 transition-all duration-200 hover:scale-105 active:scale-95"
                  >
                    <Icon className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
                    {item.name}
                  </Button>
                </Link>
              );
            })}
          </nav>

          {/* Right Section */}
          <div className="flex items-center gap-2">
            {/* Wallet Connect */}
            <div className="hidden sm:block">
              <ConnectButton />
            </div>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-border py-4 space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href ||
                (item.href !== '/' && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Button
                    variant={isActive ? 'default' : 'ghost'}
                    className="w-full justify-start gap-2"
                  >
                    <Icon className="h-4 w-4" />
                    {item.name}
                  </Button>
                </Link>
              );
            })}

            {/* Mobile Wallet Connect */}
            <div className="pt-2 sm:hidden">
              <ConnectButton />
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
