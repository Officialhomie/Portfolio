/**
 * TypeScript types for IPFS metadata
 * 
 * These types follow the ERC-721 metadata standard
 */

/**
 * NFT Attribute (ERC-721 standard)
 * Used in metadata.attributes array
 */
export interface NFTAttribute {
  trait_type: string;
  value: string | number;
  display_type?: string;
}

/**
 * Base NFT Metadata (ERC-721 standard)
 * Common fields for all NFT types
 */
export interface BaseNFTMetadata {
  name: string;
  description: string;
  image: string;
  external_url?: string;
  background_color?: string;
  animation_url?: string;
  youtube_url?: string;
  attributes?: NFTAttribute[];
}

/**
 * Project NFT Metadata
 * Extends base metadata with project-specific fields
 */
export interface ProjectNFTMetadata extends BaseNFTMetadata {
  // Additional project-specific fields
  github_url?: string;
  demo_url?: string;
  documentation_url?: string;
}

/**
 * Visit NFT Metadata
 * Extends base metadata with visit-specific fields
 */
export interface VisitNFTMetadata extends BaseNFTMetadata {
  visit_number?: number;
  minted_at?: string;
}

/**
 * Project display data (from both on-chain and IPFS)
 * Combined data structure for UI display
 */
export interface ProjectDisplayData {
  // On-chain data
  tokenId: string;
  projectId: string;
  name: string;
  creator: string;
  createdAt: Date;
  endorsementCount: number;

  // IPFS metadata
  description?: string;
  image?: string;
  externalUrl?: string;
  techStack?: string[];
  category?: string;
  status?: string;
  year?: number;

  // Additional display data
  voteCount?: number;
  hasVoted?: boolean;
  hasEndorsed?: boolean;
}

/**
 * Raw IPFS metadata object (before parsing)
 * Used for parsing functions that accept unknown JSON data
 */
export interface RawIPFSMetadata {
  name?: unknown;
  description?: unknown;
  image?: unknown;
  external_url?: unknown;
  externalUrl?: unknown;
  background_color?: unknown;
  animation_url?: unknown;
  youtube_url?: unknown;
  attributes?: unknown;
  github_url?: unknown;
  githubUrl?: unknown;
  demo_url?: unknown;
  demoUrl?: unknown;
  documentation_url?: unknown;
  documentationUrl?: unknown;
  visit_number?: unknown;
  visitNumber?: unknown;
  minted_at?: unknown;
  mintedAt?: unknown;
  [key: string]: unknown;
}

/**
 * Metadata validation result
 */
export interface MetadataValidationResult {
  isValid: boolean;
  errors: string[];
}
