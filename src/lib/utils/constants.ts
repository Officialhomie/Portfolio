/**
 * Application constants
 */

import { parseUnits } from 'viem';

/**
 * Token constants
 */
export const TOKEN_CONSTANTS = {
  FAUCET_AMOUNT: parseUnits('100', 18),
  VOTE_COST: parseUnits('10', 18),
  FAUCET_COOLDOWN: 24 * 60 * 60, // 24 hours in seconds
} as const;

/**
 * NFT constants
 */
export const NFT_CONSTANTS = {
  VISIT_NFT_MAX_SUPPLY: 100,
  MAX_ENDORSEMENTS_PER_PROJECT: 1000,
} as const;

/**
 * Visitor book constants
 */
export const VISITOR_BOOK_CONSTANTS = {
  MIN_MESSAGE_LENGTH: 1,
  MAX_MESSAGE_LENGTH: 500,
  PAGE_SIZE: 20,
} as const;

/**
 * UI constants
 */
export const UI_CONSTANTS = {
  PROJECT_CARD_IMAGE_ASPECT: 'video', // 16:9
  SKELETON_ANIMATION_DURATION: '1.5s',
  TOAST_DURATION: 5000, // 5 seconds
  DEBOUNCE_DELAY: 300, // milliseconds
} as const;

/**
 * Chain explorer URLs
 */
export const EXPLORER_URLS = {
  8453: 'https://basescan.org', // Base Mainnet
  84532: 'https://sepolia.basescan.org', // Base Sepolia
} as const;

/**
 * Portfolio owner information
 * TODO: Update with actual information
 */
export const PORTFOLIO_OWNER = {
  name: 'OneTrueHomie',
  title: 'Full-Stack Blockchain Engineer',
  location: 'Lagos, Nigeria',
  bio: 'Building the future of Web3, one dApp at a time.',
  github: 'https://github.com/Officialhomie',
  twitter: 'https://twitter.com/yourhandle',
  email: 'your@email.com',
} as const;

/**
 * Project categories
 */
export const PROJECT_CATEGORIES = [
  'All',
  'DeFi',
  'NFT',
  'DAO',
  'Infrastructure',
  'Gaming',
  'Social',
  'Tools',
  'Other',
] as const;

/**
 * Project statuses
 */
export const PROJECT_STATUSES = [
  'Live',
  'In Development',
  'Beta',
  'Archived',
] as const;
