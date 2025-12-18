/**
 * Page Layout Component
 * Wraps pages with Header and Footer
 */

import { Header } from './header';
import { Footer } from './footer';

interface PageLayoutProps {
  children: React.ReactNode;
}

export function PageLayout({ children }: PageLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-primary/20 to-accent/20 overflow-x-hidden w-full max-w-full">
      <Header />
      <main className="flex-1 w-full max-w-full overflow-x-hidden">
        {children}
      </main>
      <Footer />
    </div>
  );
}
