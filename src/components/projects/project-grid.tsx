'use client';

/**
 * Project Grid Component
 * Grid layout for displaying multiple projects
 */

import { ProjectCard, ProjectCardSkeleton } from './project-card';
import type { Project } from '@/lib/types/contracts';

interface ProjectGridProps {
  projects: Project[];
  isLoading?: boolean;
  emptyMessage?: string;
}

export function ProjectGrid({
  projects,
  isLoading = false,
  emptyMessage = 'No projects found'
}: ProjectGridProps) {
  // Loading state
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <ProjectCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  // Empty state
  if (projects.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  // Projects grid
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {projects.map((project) => (
        <ProjectCard key={project.tokenId.toString()} project={project} />
      ))}
    </div>
  );
}
