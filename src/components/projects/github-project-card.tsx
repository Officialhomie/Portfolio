'use client';

/**
 * GitHub Project Card Component
 * Displays a GitHub project with modern, interactive design
 */

import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Github, Star, GitFork, Calendar, Code } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { MintProjectButton } from './mint-project-button';
import { VoteProjectButton } from './vote-project-button';
import type { ProjectMetadata } from '@/lib/github/types';
import { cn } from '@/lib/utils/cn';

interface GitHubProjectCardProps {
  project: ProjectMetadata;
  showActions?: boolean;
  featured?: boolean;
  onVote?: (projectId: string) => void;
  voteCount?: number;
}

export function GitHubProjectCard({
  project,
  showActions = true,
  featured = false,
  onVote,
  voteCount = 0,
}: GitHubProjectCardProps) {
  const imageUrl = project.image || '/images/placeholder-project.png';
  const techStack = project.tech_stack.split(',').map((t) => t.trim());

  const statusColors = {
    Live: 'bg-green-500/10 text-green-600 dark:text-green-400',
    Beta: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    'In Development': 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400',
    Archived: 'bg-gray-500/10 text-gray-600 dark:text-gray-400',
  };

  return (
    <Card
      className={cn(
        'group overflow-hidden transition-all duration-300 ease-out',
        'hover:shadow-xl hover:-translate-y-2 hover:shadow-primary/30',
        'animate-fade-in-up',
        featured && 'ring-2 ring-primary/60 shadow-lg shadow-primary/15'
      )}
    >
      {/* Project Image */}
      <div className="relative aspect-video bg-gradient-to-br from-primary/40 via-accent/35 to-primary/40 overflow-hidden border-b-2 border-primary/50">
        {project.image ? (
          <Image
            src={imageUrl}
            alt={project.name}
            fill
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-110"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Code className="w-16 h-16 text-muted-foreground/30 transition-transform duration-300 group-hover:scale-110" />
          </div>
        )}
        {/* Gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        {featured && (
          <div className="absolute top-2 right-2 animate-pulse-slow">
            <Badge variant="default" className="bg-primary shadow-lg shadow-primary/50">
              Featured
            </Badge>
          </div>
        )}
        <div className="absolute top-2 left-2">
          <Badge className={cn('text-xs font-medium transition-all duration-200 group-hover:scale-105', statusColors[project.status])}>
            {project.status}
          </Badge>
        </div>
      </div>

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-lg line-clamp-1 group-hover:text-primary transition-colors duration-200">
              {project.name}
            </h3>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2 transition-colors duration-200 group-hover:text-foreground/80">
              {project.description}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Tech Stack */}
        {techStack.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {techStack.slice(0, 4).map((tech, index) => (
              <Badge
                key={tech}
                variant="secondary"
                className="text-xs font-normal transition-all duration-200 hover:scale-105 hover:bg-primary/10 hover:text-primary"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {tech}
              </Badge>
            ))}
            {techStack.length > 4 && (
              <Badge variant="outline" className="text-xs transition-all duration-200 hover:scale-105 hover:border-primary/50">
                +{techStack.length - 4}
              </Badge>
            )}
          </div>
        )}

        {/* Category & Year */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="font-medium">{project.category}</span>
          <span>•</span>
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span>{project.year}</span>
          </div>
        </div>

        {/* Vote Count (if voting enabled) */}
        {onVote && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Votes:</span>
            <span className="font-semibold">{voteCount}</span>
          </div>
        )}
      </CardContent>

      {/* Actions */}
      {showActions && (
        <CardFooter className="flex flex-col gap-2 pt-0">
          <div className="flex gap-2 w-full">
            {project.demo_url && (
              <Button
                asChild
                variant="default"
                size="sm"
                className="flex-1 transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-primary/25 active:scale-95"
              >
                <Link href={project.demo_url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4 mr-1 transition-transform duration-200 group-hover:rotate-12" />
                  <span className="hidden sm:inline">Live Demo</span>
                  <span className="sm:hidden">Demo</span>
                </Link>
              </Button>
            )}
            <Button
              asChild
              variant={project.demo_url ? 'outline' : 'default'}
              size="sm"
              className={cn(
                project.demo_url ? 'flex-1' : 'w-full',
                'transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-primary/25 active:scale-95'
              )}
            >
              <Link href={project.github_url || project.external_url} target="_blank" rel="noopener noreferrer">
                <Github className="w-4 h-4 sm:mr-1 transition-transform duration-200 group-hover:rotate-12" />
                <span className="hidden sm:inline">Code</span>
              </Link>
            </Button>
          </div>
          <div className="flex gap-2 w-full">
            {onVote && (
              <VoteProjectButton projectId={project.id} voteCount={voteCount} size="sm" />
            )}
            <MintProjectButton project={project} size="sm" />
          </div>
        </CardFooter>
      )}
    </Card>
  );
}

/**
 * GitHub Project Card Skeleton
 */
export function GitHubProjectCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <Skeleton className="aspect-video w-full" />
      <CardHeader className="pb-3">
        <Skeleton className="h-6 w-3/4 mb-2" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3 mt-1" />
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-5 w-14" />
        </div>
        <Skeleton className="h-4 w-24" />
      </CardContent>
      <CardFooter className="flex gap-2">
        <Skeleton className="h-9 flex-1" />
        <Skeleton className="h-9 flex-1" />
      </CardFooter>
    </Card>
  );
}

