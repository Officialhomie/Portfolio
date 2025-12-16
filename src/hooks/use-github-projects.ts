/**
 * GitHub Projects Hook
 * Fetches and manages GitHub projects
 */

import { useMemo } from 'react';
import type { ProjectMetadata } from '@/lib/github/types';

// Import projects metadata
import projectsMetadata from '@/lib/data/projects-metadata.json';

/**
 * Get all GitHub projects from metadata
 */
export function useGitHubProjects() {
  const projects = useMemo(() => {
    return (projectsMetadata.projects as ProjectMetadata[]).map((project) => ({
      ...project,
      // Ensure consistent structure
      github_url: project.github_url || project.external_url,
      demo_url: project.demo_url || undefined,
    }));
  }, []);

  return {
    projects,
    isLoading: false,
  };
}

/**
 * Get featured projects
 */
export function useFeaturedProjects() {
  const { projects } = useGitHubProjects();
  
  const featured = useMemo(() => {
    return projects.filter((p) => p.featured === true);
  }, [projects]);

  return {
    projects: featured,
    isLoading: false,
  };
}

/**
 * Get projects by category
 */
export function useProjectsByCategory(category: string) {
  const { projects } = useGitHubProjects();
  
  const filtered = useMemo(() => {
    return projects.filter((p) => p.category.toLowerCase() === category.toLowerCase());
  }, [projects, category]);

  return {
    projects: filtered,
    isLoading: false,
  };
}

/**
 * Get project by ID
 */
export function useProjectById(id: string) {
  const { projects } = useGitHubProjects();
  
  const project = useMemo(() => {
    return projects.find((p) => p.id === id);
  }, [projects, id]);

  return {
    project: project || null,
    isLoading: false,
  };
}

