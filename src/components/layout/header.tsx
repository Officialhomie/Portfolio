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
import { ThemeToggle } from '@/components/theme/theme-toggle';

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
    <header className="border-b-2 border-primary/40 bg-gradient-to-r from-background via-primary/20 to-background backdrop-blur supports-[backdrop-filter]:bg-background/80 sticky top-0 z-50 shadow-sm shadow-primary/20 relative border-gradient">
      {/* Subtle border glow effect */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-60"></div>
      
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 transition-all duration-300 hover:scale-105 active:scale-95 group">
            <div className="relative">
              <Image 
                src="/IMG_6745.JPG" 
                alt="OneTrueHomie Logo" 
                width={40}
                height={40}
                className="rounded-lg object-cover transition-all duration-300 hover:rotate-3 border border-primary/20 hover:border-primary/50 hover:shadow-md hover:shadow-primary/30"
                priority
              />
              <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-primary/0 to-accent/0 group-hover:from-primary/20 group-hover:to-accent/20 transition-all duration-300"></div>
            </div>
            <span className="font-bold text-base sm:text-lg gradient-text transition-all duration-300">
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
                <Link key={item.name} href={item.href} className="group">
                  <Button
                    variant={isActive ? 'default' : 'ghost'}
                    size="sm"
                    className={cn(
                      "gap-2 relative transition-all duration-300 hover:scale-105 active:scale-95",
                      isActive 
                        ? "nav-item-active shadow-sm shadow-primary/20" 
                        : "nav-item hover:bg-primary/5"
                    )}
                  >
                    <Icon className={cn(
                      "h-4 w-4 transition-all duration-300",
                      isActive 
                        ? "text-primary-foreground" 
                        : "text-muted-foreground group-hover:text-primary group-hover:scale-110"
                    )} />
                    <span className={cn(
                      "transition-colors duration-300",
                      isActive 
                        ? "text-primary-foreground font-medium" 
                        : "group-hover:text-primary"
                    )}>
                      {item.name}
                    </span>
                    {isActive && (
                      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-0.5 bg-gradient-to-r from-primary to-accent rounded-full"></div>
                    )}
                  </Button>
                </Link>
              );
            })}
          </nav>

          {/* Right Section */}
          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <ThemeToggle />
            
            {/* Wallet Connect */}
            <div className="hidden sm:flex items-center">
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
          <div className="lg:hidden border-t border-primary/30 border-gradient py-4 space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href ||
                (item.href !== '/' && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="group"
                >
                  <Button
                    variant={isActive ? 'default' : 'ghost'}
                    className={cn(
                      "w-full justify-start gap-2 transition-all duration-300",
                      isActive 
                        ? "nav-item-active shadow-sm shadow-primary/20" 
                        : "hover:bg-primary/5"
                    )}
                  >
                    <Icon className={cn(
                      "h-4 w-4 transition-all duration-300",
                      isActive 
                        ? "text-primary-foreground" 
                        : "text-muted-foreground group-hover:text-primary group-hover:scale-110"
                    )} />
                    <span className={cn(
                      "transition-colors duration-300",
                      isActive 
                        ? "text-primary-foreground font-medium" 
                        : "group-hover:text-primary"
                    )}>
                      {item.name}
                    </span>
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
