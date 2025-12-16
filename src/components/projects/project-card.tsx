'use client';

/**
 * Project Card Component
 * Displays a project with image, details, and action buttons
 */

import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { VoteButton } from './vote-button';
import { EndorseButton } from './endorse-button';
import { useProjectVotes } from '@/hooks/contracts/useProjectVoting';
import { useIPFSMetadata } from '@/hooks/use-ipfs-metadata';
import { resolveIPFSUri } from '@/lib/ipfs/client';
import { extractTechStack } from '@/lib/ipfs/metadata';
import type { Project } from '@/lib/types/contracts';

interface ProjectCardProps {
  project: Project;
  showActions?: boolean;
}

export function ProjectCard({ project, showActions = true }: ProjectCardProps) {
  const { metadata, isLoading: metadataLoading } = useIPFSMetadata(project.ipfsMetadataURI);
  const { voteCount, isLoading: votesLoading } = useProjectVotes(project.projectId);

  const imageUrl = metadata?.image ? resolveIPFSUri(metadata.image) : '/images/placeholder-project.png';
  const techStack = metadata ? extractTechStack(metadata.attributes) : [];

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      {/* Project Image */}
      <Link href={`/projects/${project.tokenId.toString()}`}>
        <div className="relative aspect-video bg-muted">
          {metadataLoading ? (
            <Skeleton className="w-full h-full" />
          ) : (
            <Image
              src={imageUrl}
              alt={project.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          )}
        </div>
      </Link>

      <CardContent className="p-4 space-y-3">
        {/* Project Name */}
        <Link href={`/projects/${project.tokenId.toString()}`}>
          <h3 className="font-semibold text-lg hover:underline line-clamp-1">
            {project.name}
          </h3>
        </Link>

        {/* Description */}
        {metadataLoading ? (
          <Skeleton className="h-10 w-full" />
        ) : (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {metadata?.description || 'No description available'}
          </p>
        )}

        {/* Tech Stack Tags */}
        {techStack.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {techStack.slice(0, 3).map((tech) => (
              <span
                key={tech}
                className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded"
              >
                {tech}
              </span>
            ))}
            {techStack.length > 3 && (
              <span className="text-xs text-muted-foreground px-2 py-1">
                +{techStack.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          {votesLoading ? (
            <Skeleton className="h-4 w-20" />
          ) : (
            <span>🗳️ {voteCount} votes</span>
          )}
          <span>👍 {Number(project.endorsementCount)} endorsements</span>
        </div>
      </CardContent>

      {/* Actions */}
      {showActions && (
        <CardFooter className="p-4 pt-0 flex gap-2">
          <VoteButton projectId={project.projectId} size="sm" />
          <EndorseButton tokenId={project.tokenId} size="sm" />
        </CardFooter>
      )}
    </Card>
  );
}

/**
 * Project Card Skeleton
 */
export function ProjectCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <Skeleton className="aspect-video w-full" />
      <CardContent className="p-4 space-y-3">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-10 w-full" />
        <div className="flex gap-2">
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-6 w-16" />
        </div>
        <div className="flex gap-4">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-24" />
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex gap-2">
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-9 w-24" />
      </CardFooter>
    </Card>
  );
}
