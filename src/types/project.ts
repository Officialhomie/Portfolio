/**
 * Project type for UI components
 * Combines GitHub metadata with on-chain project data
 */

export interface Project {
  id: string;
  name: string;
  description: string;
  image?: string;
  ipfsImageCID?: string;
  external_url?: string;
  demo_url?: string;
  github_url?: string;
  tech_stack?: string;
  category?: string;
  status?: 'Live' | 'Beta' | 'In Development' | 'Archived';
  year?: number;
  featured?: boolean;
  tags?: string[];
  languages?: string[];
  contractAddress?: string;
  tokenId?: bigint;
  projectId?: string;
  creator?: `0x${string}`;
  createdAt?: bigint;
  endorsementCount?: bigint;
  voteCount?: number;
  // GitHub stats (optional)
  stats?: {
    stars?: number;
    forks?: number;
  };
  // Alternative direct properties (for GitHubProject compatibility)
  stargazersCount?: number;
  forksCount?: number;
}

