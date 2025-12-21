/**
 * Projects data utilities
 * Provides access to project metadata and IPFS gateway URLs
 */

import projectsMetadata from './data/projects-metadata.json';
import { resolveIPFSUri } from './ipfs/client';
import type { ProjectMetadata } from './github/types';

/**
 * Get all projects from metadata
 */
export function getAllProjects(): ProjectMetadata[] {
  return (projectsMetadata.projects as ProjectMetadata[]).map((project) => ({
    ...project,
    github_url: project.github_url || project.external_url,
    demo_url: project.demo_url || undefined,
  }));
}

/**
 * Get featured projects
 */
export function getFeaturedProjects(): ProjectMetadata[] {
  return getAllProjects().filter((p) => p.featured === true);
}

/**
 * Get IPFS gateway URL for a CID
 * @param cid - IPFS CID (can be raw CID or ipfs:// URI)
 * @returns HTTP URL to access the IPFS content
 */
export function getIPFSGatewayURL(cid: string | undefined | null): string {
  if (!cid) return '';
  return resolveIPFSUri(cid);
}




