'use client';

/**
 * Project Detail Page
 * Full project information with voting and endorsements
 */

import { use } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useProject } from '@/hooks/contracts/useProjectNFT';
import { useProjectVotes } from '@/hooks/contracts/useProjectVoting';
import { useIPFSMetadata } from '@/hooks/use-ipfs-metadata';
import { VoteButton } from '@/components/projects/vote-button';
import { EndorseButton } from '@/components/projects/endorse-button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { PageLayout } from '@/components/layout/page-layout';
import { resolveIPFSUri } from '@/lib/ipfs/client';
import { extractTechStack, extractCategory, extractStatus } from '@/lib/ipfs/metadata';
import { formatDate } from '@/lib/utils/format';
import { ExternalLink, Github, Globe } from 'lucide-react';

export default function ProjectDetailPage({
  params,
}: {
  params: Promise<{ tokenId: string }>;
}) {
  const { tokenId } = use(params);
  const tokenIdBigInt = BigInt(tokenId);

  const { project, isLoading: projectLoading } = useProject(tokenIdBigInt);
  const { metadata, isLoading: metadataLoading } = useIPFSMetadata(project?.ipfsMetadataURI);
  const { voteCount, isLoading: votesLoading } = useProjectVotes(project?.projectId || '');

  const isLoading = projectLoading || metadataLoading;
  const imageUrl = metadata?.image ? resolveIPFSUri(metadata.image) : '/images/placeholder-project.png';
  const techStack = metadata ? extractTechStack(metadata.attributes) : [];
  const category = metadata ? extractCategory(metadata.attributes) : undefined;
  const status = metadata ? extractStatus(metadata.attributes) : undefined;

  if (isLoading) {
    return <ProjectDetailSkeleton />;
  }

  if (!project) {
    return (
      <PageLayout>
        <div className="container mx-auto px-4 py-20 text-center">
          <h2 className="text-2xl font-bold mb-4">Project Not Found</h2>
          <p className="text-muted-foreground mb-8">
            This project doesn't exist or hasn't been minted yet.
          </p>
          <Link href="/projects">
            <Button>Browse All Projects</Button>
          </Link>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      {/* Content */}
      <div className="container mx-auto px-4 py-12">
        {/* Back link */}
        <Link href="/projects">
          <Button variant="ghost" size="sm" className="mb-6">
            ← Back to Projects
          </Button>
        </Link>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content - Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Project Image */}
            <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
              <Image
                src={imageUrl}
                alt={project.name}
                fill
                className="object-cover"
                priority
              />
            </div>

            {/* Project Info */}
            <div>
              <h2 className="text-4xl font-bold mb-4 gradient-text">{project.name}</h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                {metadata?.description || 'No description available'}
              </p>
            </div>

            {/* Tech Stack */}
            {techStack.length > 0 && (
              <Card className="border-gradient hover:shadow-lg hover:shadow-primary/20 transition-all duration-300">
                <CardHeader>
                  <CardTitle className="gradient-text-subtle">Tech Stack</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {techStack.map((tech) => (
                      <span
                        key={tech}
                        className="px-3 py-1.5 bg-secondary text-secondary-foreground rounded-md text-sm font-medium"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Links */}
            {(metadata?.external_url || metadata?.github_url || metadata?.demo_url) && (
              <Card className="border-gradient hover:shadow-lg hover:shadow-primary/20 transition-all duration-300">
                <CardHeader>
                  <CardTitle className="gradient-text-subtle">Links</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {metadata.github_url && (
                    <a
                      href={metadata.github_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-primary hover:underline"
                    >
                      <Github className="h-4 w-4" />
                      View on GitHub
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                  {metadata.demo_url && (
                    <a
                      href={metadata.demo_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-primary hover:underline"
                    >
                      <Globe className="h-4 w-4" />
                      Live Demo
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                  {metadata.external_url && !metadata.github_url && (
                    <a
                      href={metadata.external_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-primary hover:underline"
                    >
                      <ExternalLink className="h-4 w-4" />
                      External Link
                    </a>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar - Right Column */}
          <div className="space-y-6">
            {/* Actions */}
            <Card className="border-gradient hover:shadow-lg hover:shadow-primary/20 transition-all duration-300">
              <CardHeader>
                <CardTitle className="gradient-text-subtle">Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <VoteButton
                  projectId={project.projectId}
                  size="lg"
                  variant="default"
                />
                <EndorseButton
                  tokenId={project.tokenId}
                  size="lg"
                  variant="outline"
                />
              </CardContent>
            </Card>

            {/* Stats */}
            <Card className="border-gradient hover:shadow-lg hover:shadow-primary/20 transition-all duration-300">
              <CardHeader>
                <CardTitle className="gradient-text-subtle">Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Votes</p>
                  {votesLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <p className="text-2xl font-bold gradient-text">🗳️ {voteCount}</p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Endorsements</p>
                  <p className="text-2xl font-bold gradient-text">👍 {Number(project.endorsementCount)}</p>
                </div>
                {category && (
                  <div>
                    <p className="text-sm text-muted-foreground">Category</p>
                    <p className="font-medium">{category}</p>
                  </div>
                )}
                {status && (
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <p className="font-medium">{status}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">Created</p>
                  <p className="font-medium">
                    {formatDate(project.createdAt, false)}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Metadata */}
            <Card className="border-gradient hover:shadow-lg hover:shadow-primary/20 transition-all duration-300">
              <CardHeader>
                <CardTitle className="text-sm gradient-text-subtle">NFT Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div>
                  <p className="text-muted-foreground">Token ID</p>
                  <p className="font-mono">{project.tokenId.toString()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Project ID</p>
                  <p className="font-mono text-xs break-all">{project.projectId}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}

function ProjectDetailSkeleton() {
  return (
    <PageLayout>
      <div className="container mx-auto px-4 py-12">
        <Skeleton className="h-10 w-32 mb-6" />
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="aspect-video w-full rounded-lg" />
            <Skeleton className="h-12 w-3/4" />
            <Skeleton className="h-24 w-full" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-60 w-full" />
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
