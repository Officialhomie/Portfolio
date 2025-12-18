import { Unbounded } from 'next/font/google';
import localFont from 'next/font/local';

/**
 * Font Configuration
 * 
 * Primary font: Söhne from Klim Type Foundry
 * Fallback: Inter Tight (Base's recommended fallback, closest to Base Sans)
 * 
 * To use Söhne font:
 * 1. Place font files in /public/fonts/ directory
 * 2. Font files should be named: Sohne-*.woff2 (or .woff)
 * 3. Available weights: Regular (400), Medium (500), Semibold (600), Bold (700)
 * 4. Set USE_SOEHNE_FONT to true below once files are added
 * 
 * Reference: https://klim.co.nz
 */

/**
 * Söhne Font Configuration
 * 
 * To enable Söhne font from Klim Type Foundry:
 * 1. Place font files in /public/fonts/ directory:
 *    - Sohne-Regular.woff2
 *    - Sohne-Medium.woff2
 *    - Sohne-Semibold.woff2
 *    - Sohne-Bold.woff2
 * 2. Uncomment the soehneFont configuration below
 * 3. Comment out or remove the interTightFont export
 * 4. Change the export to use soehneFont
 */

// Primary font: Unbounded from Google Fonts
// Modern, geometric sans-serif font with a futuristic feel
export const baseSans = Unbounded({
  subsets: ['latin'],
  variable: '--font-base-sans',
  display: 'swap', // Show fallback text immediately, then swap when font loads
  preload: true, // Preload font files for faster loading
  weight: ['400', '500', '600', '700'],
  fallback: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
});

// Fallback font: Inter Tight (Base's recommended fallback)
// UNCOMMENT BELOW TO USE INTER TIGHT INSTEAD OF UNBOUNDED
/*
export const baseSans = Inter_Tight({
  subsets: ['latin'],
  variable: '--font-base-sans',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});
*/

// Ostrich Sans font (removed - didn't work)
// Removed on user request - will be replaced with another font
/*
export const baseSans = localFont({
  src: [
    {
      path: '../../fonts/OstrichSans-Light.woff',
      weight: '300',
      style: 'normal',
    },
    {
      path: '../../fonts/OstrichSans-Regular.woff',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../../fonts/OstrichSans-Bold.woff',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-base-sans',
  fallback: ['Inter Tight', 'Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
  display: 'swap',
  preload: true,
});
*/

// Söhne Font Configuration (from Klim Type Foundry)
// UNCOMMENT BELOW ONCE SÖHNE FONT FILES ARE ADDED TO /public/fonts/
/*
export const baseSans = localFont({
  src: [
    {
      path: '../../public/fonts/Sohne-Regular.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../../public/fonts/Sohne-Medium.woff2',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../../public/fonts/Sohne-Semibold.woff2',
      weight: '600',
      style: 'normal',
    },
    {
      path: '../../public/fonts/Sohne-Bold.woff2',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-base-sans',
  fallback: ['Inter Tight', 'Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
  display: 'swap',
  preload: true,
});
*/

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

