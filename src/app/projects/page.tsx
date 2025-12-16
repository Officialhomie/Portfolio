'use client';

/**
 * Projects Gallery Page
 * Browse all project NFTs
 */

import { useState, useMemo } from 'react';
import { useProjectList } from '@/hooks/contracts/useProjectNFT';
import { useBatchProjectVotes } from '@/hooks/contracts/useProjectVoting';
import { ProjectGrid } from '@/components/projects/project-grid';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PageLayout } from '@/components/layout/page-layout';

type SortOption = 'newest' | 'oldest' | 'votes' | 'endorsements';

export default function ProjectsPage() {
  const { projects, isLoading } = useProjectList();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  // Get vote counts for all projects
  const projectIds = projects.map(p => p.projectId);
  const { voteCounts } = useBatchProjectVotes(projectIds);

  // Filter and sort projects
  const filteredProjects = useMemo(() => {
    let filtered = projects;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((project) =>
        project.name.toLowerCase().includes(query) ||
        project.projectId.toLowerCase().includes(query)
      );
    }

    // Sort
    const sorted = [...filtered];
    switch (sortBy) {
      case 'newest':
        sorted.sort((a, b) => Number(b.createdAt - a.createdAt));
        break;
      case 'oldest':
        sorted.sort((a, b) => Number(a.createdAt - b.createdAt));
        break;
      case 'votes':
        sorted.sort((a, b) => {
          const votesA = voteCounts.find(v => v.projectId === a.projectId)?.voteCount || 0;
          const votesB = voteCounts.find(v => v.projectId === b.projectId)?.voteCount || 0;
          return votesB - votesA;
        });
        break;
      case 'endorsements':
        sorted.sort((a, b) => Number(b.endorsementCount - a.endorsementCount));
        break;
    }

    return sorted;
  }, [projects, searchQuery, sortBy, voteCounts]);

  return (
    <PageLayout>
      {/* Page Header */}
      <section className="container mx-auto px-4 py-12">
        <div className="max-w-3xl">
          <h2 className="text-4xl font-bold mb-4">Projects</h2>
          <p className="text-xl text-muted-foreground">
            Explore all projects minted as NFTs on the blockchain. Vote for your favorites!
          </p>
        </div>
      </section>

      {/* Filters & Search */}
      <section className="container mx-auto px-4 pb-8">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          {/* Search */}
          <div className="flex-1 w-full md:max-w-md">
            <Input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
          </div>

          {/* Sort */}
          <div className="flex gap-2 flex-wrap">
            <span className="text-sm text-muted-foreground self-center">Sort by:</span>
            {(['newest', 'oldest', 'votes', 'endorsements'] as SortOption[]).map((option) => (
              <Button
                key={option}
                size="sm"
                variant={sortBy === option ? 'default' : 'outline'}
                onClick={() => setSortBy(option)}
              >
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        {/* Results count */}
        <div className="mt-4">
          <p className="text-sm text-muted-foreground">
            {isLoading ? (
              'Loading projects...'
            ) : (
              <>
                Showing {filteredProjects.length} of {projects.length} projects
                {searchQuery && ` for "${searchQuery}"`}
              </>
            )}
          </p>
        </div>
      </section>

      {/* Projects Grid */}
      <section className="container mx-auto px-4 pb-20">
        <ProjectGrid
          projects={filteredProjects}
          isLoading={isLoading}
          emptyMessage={
            searchQuery
              ? `No projects found matching "${searchQuery}"`
              : 'No projects have been minted yet'
          }
        />
      </section>
    </PageLayout>
  );
}
