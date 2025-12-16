import { Inter_Tight, Inter } from 'next/font/google';
import localFont from 'next/font/local';

/**
 * Base Font Configuration
 * 
 * Base uses Base Sans (proprietary), which is not publicly available.
 * According to Base's typography guidelines, the recommended fallback fonts are:
 * - Inter Tight (primary fallback)
 * - Inter (secondary fallback)
 * - Roboto Mono (for monospace)
 * 
 * Base Sans is based on Modern Gothic with customizations, and is purpose-built
 * for legibility in the onchain world. Since it's not available for download,
 * we use Inter Tight as the primary font, which closely matches Base Sans.
 * 
 * Reference: https://www.base.org/brand/typography
 */

// Primary font: Inter Tight (Base's recommended fallback, closest to Base Sans)
export const baseSans = Inter_Tight({
  subsets: ['latin'],
  variable: '--font-base-sans',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

// Monospace font for code/technical text
// Uses system monospace fonts by default
// If Coinbase Mono files are available, uncomment and configure below
export const baseMono = {
  variable: '--font-base-mono',
  className: '',
};

/* 
 * UNCOMMENT BELOW TO USE COINBASE MONO (when font files are available):
 * 
 * export const baseMono = localFont({
 *   src: [
 *     {
 *       path: '../../public/fonts/CoinbaseMono-Regular.woff2',
 *       weight: '400',
 *       style: 'normal',
 *     },
 *     {
 *       path: '../../public/fonts/CoinbaseMono-Medium.woff2',
 *       weight: '500',
 *       style: 'normal',
 *     },
 *   ],
 *   variable: '--font-base-mono',
 *   fallback: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
 *   display: 'swap',
 *   preload: true,
 * });
 */

/* 
 * UNCOMMENT BELOW TO USE COINBASE SANS (when font files are available):
 * 
 * import localFont from 'next/font/local';
 * 
 * export const baseSans = localFont({
 *   src: [
 *     {
 *       path: '../../public/fonts/CoinbaseSans-Regular.woff2',
 *       weight: '400',
 *       style: 'normal',
 *     },
 *     {
 *       path: '../../public/fonts/CoinbaseSans-Medium.woff2',
 *       weight: '500',
 *       style: 'normal',
 *     },
 *     {
 *       path: '../../public/fonts/CoinbaseSans-Bold.woff2',
 *       weight: '700',
 *       style: 'normal',
 *     },
 *   ],
 *   variable: '--font-base-sans',
 *   fallback: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
 *   display: 'swap',
 *   preload: true,
 * });
 */

