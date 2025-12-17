'use client';

/**
 * Project Card Component
 * Displays a project with image, details, and action buttons
 */

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { VoteButton } from './vote-button';
import { EndorseButton } from './endorse-button';
import { useProjectVotes } from '@/hooks/contracts/useProjectVoting';
import { useIPFSMetadata } from '@/hooks/use-ipfs-metadata';
import { resolveIPFSUri } from '@/lib/ipfs/client';
import { extractTechStack } from '@/lib/ipfs/metadata';
import type { Project } from '@/lib/types/contracts';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface ProjectCardProps {
  project: Project;
  showActions?: boolean;
}

export function ProjectCard({ project, showActions = true }: ProjectCardProps) {
  const { metadata, isLoading: metadataLoading } = useIPFSMetadata(project.ipfsMetadataURI);
  const { voteCount, isLoading: votesLoading } = useProjectVotes(project.projectId);
  const [isExpanded, setIsExpanded] = useState(false);

  const imageUrl = metadata?.image ? resolveIPFSUri(metadata.image) : '/images/placeholder-project.png';
  const techStack = metadata ? extractTechStack(metadata.attributes) : [];
  
  // Make description more friendly
  const description = metadata?.description || 'No description available';
  const friendlyDescription = description === 'No description available' 
    ? "✨ This project is still growing! Check back soon for more details." 
    : `✨ ${description}`;
  
  // Check if description is long enough to need "read more"
  const needsReadMore = friendlyDescription.length > 100;
  const displayDescription = isExpanded || !needsReadMore 
    ? friendlyDescription 
    : `${friendlyDescription.slice(0, 100)}...`;

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
          <div className="space-y-2">
            <p className={`text-sm text-muted-foreground leading-relaxed ${!isExpanded && needsReadMore ? 'line-clamp-2' : ''}`}>
              {displayDescription}
            </p>
            {needsReadMore && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="h-auto p-0 text-xs text-primary hover:text-primary/80 font-medium"
              >
                {isExpanded ? (
                  <>
                    Read less
                    <ChevronUp className="w-3 h-3 ml-1" />
                  </>
                ) : (
                  <>
                    Read more
                    <ChevronDown className="w-3 h-3 ml-1" />
                  </>
                )}
              </Button>
            )}
          </div>
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
