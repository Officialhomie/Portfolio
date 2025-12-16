import { Inter } from 'next/font/google';
import localFont from 'next/font/local';

/**
 * Base Font Configuration
 * 
 * Base uses Coinbase Sans, which is a proprietary font.
 * 
 * TO USE COINBASE SANS:
 * 1. Download Coinbase Sans font files from Base brand resources
 * 2. Place them in public/fonts/:
 *    - CoinbaseSans-Regular.woff2
 *    - CoinbaseSans-Medium.woff2
 *    - CoinbaseSans-Bold.woff2
 *    - CoinbaseMono-Regular.woff2 (optional, for monospace)
 *    - CoinbaseMono-Medium.woff2 (optional, for monospace)
 * 3. Uncomment the localFont code below and comment out the Inter import
 * 
 * Currently using Inter as the primary font (similar to Coinbase Sans)
 * which is what Base uses as a fallback.
 */

// Primary font: Inter (similar to Coinbase Sans, used by Base as fallback)
export const baseSans = Inter({
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

