import type { Metadata } from 'next';
import './error-suppression'; // Import early to suppress errors before React loads
import './globals.css';
import { ClientProviders } from '@/components/providers/client-providers';
import { ThemeProvider } from '@/providers/theme-provider';
import { baseSans, baseMono } from '@/lib/fonts/base-font';
import { ClientErrorHandler } from '@/components/providers/client-error-handler';

export const metadata: Metadata = {
  title: 'OneTrueHomie - Web3 Portfolio',
  description: 'OneTrueHomie\'s decentralized portfolio platform on Base L2 featuring NFT projects, token-gated voting, and on-chain visitor interactions.',
  keywords: ['web3', 'portfolio', 'blockchain', 'base', 'nft', 'defi', 'OneTrueHomie'],
  authors: [{ name: 'OneTrueHomie' }],
  icons: {
    icon: '/IMG_6745.JPG',
    apple: '/IMG_6745.JPG',
  },
  openGraph: {
    title: 'OneTrueHomie - Web3 Portfolio',
    description: 'OneTrueHomie\'s Decentralized Developer Portfolio on Base L2',
    type: 'website',
    images: ['/IMG_6745.JPG'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${baseSans.variable} ${baseSans.className}`}>
        <ClientErrorHandler>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <ClientProviders>
              {children}
            </ClientProviders>
          </ThemeProvider>
        </ClientErrorHandler>
      </body>
    </html>
  );
}
