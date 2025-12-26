'use client';

/**
 * Client-only Providers Wrapper
 * Ensures all client-only providers are loaded dynamically
 * This prevents server-side bundling issues with Privy
 */

import dynamic from 'next/dynamic';
import { type ReactNode } from 'react';

// Dynamically import PrivyProvider with no SSR
const PrivyProviderWrapper = dynamic(
  () => import('@/providers/privy-provider').then(mod => ({ default: mod.PrivyProviderWrapper })),
  { ssr: false }
);

export function ClientProviders({ children }: { children: ReactNode }) {
  return <PrivyProviderWrapper>{children}</PrivyProviderWrapper>;
}
