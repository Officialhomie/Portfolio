import type { Metadata } from 'next';
import './error-suppression'; // Import early to suppress errors before React loads
import './globals.css';
import { ClientProviders } from '@/components/providers/client-providers';
import { ThemeProvider } from '@/providers/theme-provider';
import { baseSans } from '@/lib/fonts/base-font';
import { ClientErrorHandler } from '@/components/providers/client-error-handler';

const siteUrl = 'https://portfolio-tawny-pi-68.vercel.app';

const title = 'OneTrueHomie — Blockchain Developer & Web3 Systems Architect';
const description =
  'Full-stack blockchain engineer (Lagos). Smart contracts, protocol tooling, agents on Base, Solidity/Foundry, TypeScript & Go — plus an on-chain portfolio with NFT projects, voting, and visitor book.';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: title,
    template: '%s · OneTrueHomie',
  },
  description,
  keywords: [
    'OneTrueHomie',
    'Officialhomie',
    'Web3',
    'blockchain developer',
    'smart contracts',
    'Solidity',
    'Foundry',
    'Base',
    'EVM',
    'portfolio',
    'NFT',
    'agents',
  ],
  authors: [{ name: 'OneTrueHomie', url: 'https://github.com/Officialhomie' }],
  icons: {
    icon: '/IMG_6745.JPG',
    apple: '/IMG_6745.JPG',
  },
  openGraph: {
    title,
    description,
    type: 'website',
    url: siteUrl,
    siteName: 'OneTrueHomie Portfolio',
    locale: 'en_NG',
    images: [{ url: '/IMG_6745.JPG', width: 1200, height: 1200, alt: 'OneTrueHomie' }],
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
    creator: '@officialhomie_',
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
