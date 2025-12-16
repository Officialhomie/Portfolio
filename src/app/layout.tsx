import type { Metadata } from 'next';
import './globals.css';
import { Web3Provider } from '@/providers/web3-provider';
import { ThemeProvider } from '@/providers/theme-provider';
import { baseSans, baseMono } from '@/lib/fonts/base-font';

export const metadata: Metadata = {
  title: 'OneTrueHomie - Web3 Portfolio',
  description: 'OneTrueHomie\'s decentralized portfolio platform on Base L2 featuring NFT projects, token-gated voting, and on-chain visitor interactions.',
  keywords: ['web3', 'portfolio', 'blockchain', 'base', 'nft', 'defi', 'OneTrueHomie'],
  authors: [{ name: 'OneTrueHomie' }],
  openGraph: {
    title: 'OneTrueHomie - Web3 Portfolio',
    description: 'OneTrueHomie\'s Decentralized Developer Portfolio on Base L2',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${baseSans.variable} ${baseMono.variable || ''}`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Web3Provider>
            {children}
          </Web3Provider>
        </ThemeProvider>
      </body>
    </html>
  );
}
