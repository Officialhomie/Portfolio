'use client';

/**
 * Unified Project Grid
 * Displays both GitHub projects and on-chain NFT projects
 */

import { useMemo } from 'react';
import { ProjectCard, ProjectCardSkeleton } from './project-card';
import { GitHubProjectCard, GitHubProjectCardSkeleton } from './github-project-card';
import { VoteProjectButton } from './vote-project-button';
import { useGitHubProjects } from '@/hooks/use-github-projects';
import { useProjectList } from '@/hooks/contracts/useProjectNFT';
import { useBatchProjectVotes } from '@/hooks/contracts/useProjectVoting';
import type { Project } from '@/lib/types/contracts';
import type { ProjectMetadata } from '@/lib/github/types';

type ProjectType = 'all' | 'github' | 'onchain';

interface UnifiedProjectGridProps {
  type?: ProjectType;
  featuredOnly?: boolean;
  category?: string;
  searchQuery?: string;
  onVoteProject?: (projectId: string) => void;
}

export function UnifiedProjectGrid({
  type = 'all',
  featuredOnly = false,
  category,
  searchQuery = '',
  onVoteProject,
}: UnifiedProjectGridProps) {
  const { projects: githubProjects, isLoading: githubLoading } = useGitHubProjects();
  const { projects: onChainProjects, isLoading: onChainLoading } = useProjectList();
  const projectIds = onChainProjects.map((p) => p.projectId);
  const { voteCounts } = useBatchProjectVotes(projectIds);

  // Filter GitHub projects
  const filteredGitHubProjects = useMemo(() => {
    let filtered = githubProjects;

    if (featuredOnly) {
      filtered = filtered.filter((p) => p.featured === true);
    }

    if (category) {
      filtered = filtered.filter((p) => p.category.toLowerCase() === category.toLowerCase());
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query) ||
          p.tech_stack.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [githubProjects, featuredOnly, category, searchQuery]);

  // Filter on-chain projects
  const filteredOnChainProjects = useMemo(() => {
    let filtered = onChainProjects;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.projectId.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [onChainProjects, searchQuery]);

  const isLoading = githubLoading || onChainLoading;

  // Loading state
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <GitHubProjectCardSkeleton key={`skeleton-${i}`} />
        ))}
      </div>
    );
  }

  // Empty state
  const hasGitHubProjects = type !== 'onchain' && filteredGitHubProjects.length > 0;
  const hasOnChainProjects = type !== 'github' && filteredOnChainProjects.length > 0;

  if (!hasGitHubProjects && !hasOnChainProjects) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          {searchQuery ? `No projects found matching "${searchQuery}"` : 'No projects found'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* GitHub Projects Section */}
      {(type === 'all' || type === 'github') && filteredGitHubProjects.length > 0 && (
        <div>
          {type === 'all' && (
            <h3 className="text-2xl font-bold mb-6">GitHub Projects</h3>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {filteredGitHubProjects.map((project) => {
              const voteCount = voteCounts.find((v) => v.projectId === project.id)?.voteCount || 0;
              return (
                <GitHubProjectCard
                  key={project.id}
                  project={project}
                  featured={project.featured}
                  onVote={onVoteProject}
                  voteCount={voteCount}
                  showActions
                />
              );
            })}
          </div>
        </div>
      )}

      {/* On-Chain Projects Section */}
      {(type === 'all' || type === 'onchain') && filteredOnChainProjects.length > 0 && (
        <div>
          {type === 'all' && (
            <h3 className="text-2xl font-bold mb-6">On-Chain Projects (NFTs)</h3>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {filteredOnChainProjects.map((project) => (
              <ProjectCard key={project.tokenId.toString()} project={project} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

