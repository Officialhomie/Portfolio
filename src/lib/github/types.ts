/**
 * GitHub Project Types
 * Types for GitHub repository data
 */

export interface GitHubProject {
  id: string;
  name: string;
  fullName: string;
  description: string | null;
  htmlUrl: string;
  homepage: string | null;
  language: string | null;
  stargazersCount: number;
  forksCount: number;
  topics: string[];
  createdAt: string;
  updatedAt: string;
  pushedAt: string;
  owner: {
    login: string;
    avatarUrl: string;
  };
  isFork: boolean;
  archived: boolean;
}

export interface ProjectMetadata {
  id: string;
  name: string;
  description: string;
  image?: string;
  external_url: string;
  demo_url?: string;
  github_url?: string;
  tech_stack: string;
  category: string;
  status: 'Live' | 'Beta' | 'In Development' | 'Archived';
  year: number;
  featured?: boolean;
  tags?: string[];
  languages?: string[];
}




