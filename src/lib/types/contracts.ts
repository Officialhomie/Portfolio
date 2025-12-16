/**
 * TypeScript types for smart contract data structures
 * 
 * These types match the Solidity struct definitions in the contracts
 */

/**
 * Project structure from ProjectNFT.sol
 * Matches the Project struct returned by getProject()
 */
export interface Project {
  tokenId: bigint;
  projectId: string;
  name: string;
  ipfsMetadataURI: string;
  creator: `0x${string}`;
  createdAt: bigint;
  endorsementCount: bigint;
}

/**
 * Raw Project tuple returned from contract
 * This is the exact structure returned by getProject() function
 * Note: projectId is NOT in the struct - it must be fetched separately via getTokenIdByProjectId()
 */
export type ProjectTuple = readonly [
  tokenId: bigint,
  name: string,
  ipfsMetadataURI: string,
  creator: `0x${string}`,
  createdAt: bigint,
  endorsementCount: bigint,
];

/**
 * Visitor structure from VisitorBook.sol
 * Matches the Visitor struct returned by getVisitors()
 */
export interface Visitor {
  visitor: `0x${string}`;
  message: string;
  timestamp: bigint;
}

/**
 * Raw Visitor tuple returned from contract
 * This is the exact structure returned by getVisitor() and getVisitors() functions
 */
export type VisitorTuple = readonly [
  visitor: `0x${string}`,
  message: string,
  timestamp: bigint,
];

/**
 * Vote structure from ProjectVoting.sol
 */
export interface Vote {
  voter: `0x${string}`;
  projectId: string;
  timestamp: bigint;
  tokensBurned: bigint;
}

/**
 * IPFS Metadata for ProjectNFT
 */
export interface ProjectMetadata {
  name: string;
  description: string;
  image: string;
  external_url?: string;
  attributes?: Array<{
    trait_type: string;
    value: string | number;
  }>;
}

/**
 * IPFS Metadata for VisitNFT
 * Note: VisitNFTMetadata is defined in metadata.ts to extend BaseNFTMetadata
 */

/**
 * Project with enriched metadata
 */
export interface EnrichedProject extends Project {
  metadata?: ProjectMetadata;
  voteCount?: number;
}

/**
 * Contract names
 */
export type ContractName =
  | 'PortfolioToken'
  | 'ProjectNFT'
  | 'ProjectVoting'
  | 'VisitNFT'
  | 'VisitorBook';

/**
 * Transaction states
 */
export type TransactionState =
  | 'idle'
  | 'pending'
  | 'confirming'
  | 'success'
  | 'error';
