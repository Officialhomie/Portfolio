'use client';

/**
 * Voting Leaderboard Page
 * Shows projects ranked by votes
 */

import Link from 'next/link';
import { useProjectList } from '@/hooks/contracts/useProjectNFT';
import { useBatchProjectVotes, useTotalVotes, useUserTotalVotes } from '@/hooks/contracts/useProjectVoting';
import { usePortfolioToken } from '@/hooks/contracts/usePortfolioToken';
import { ProjectCard, ProjectCardSkeleton } from '@/components/projects/project-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageLayout } from '@/components/layout/page-layout';
import { useAccount } from 'wagmi';
import { Button } from '@/components/ui/button';

export default function VotingPage() {
  const { isConnected } = useAccount();
  const { projects, isLoading: projectsLoading } = useProjectList();
  const { totalVotes } = useTotalVotes();
  const { totalVotes: userVotes } = useUserTotalVotes();
  const { balance } = usePortfolioToken();

  // Get vote counts for all projects
  const projectIds = projects.map(p => p.projectId);
  const { voteCounts, isLoading: votesLoading } = useBatchProjectVotes(projectIds);

  // Sort projects by vote count
  const rankedProjects = [...projects].sort((a, b) => {
    const votesA = voteCounts.find(v => v.projectId === a.projectId)?.voteCount || 0;
    const votesB = voteCounts.find(v => v.projectId === b.projectId)?.voteCount || 0;
    return votesB - votesA;
  });

  const isLoading = projectsLoading || votesLoading;

  return (
    <PageLayout>
      {/* Page Header */}
      <section className="container mx-auto px-4 py-12">
        <div className="max-w-3xl">
          <h2 className="text-4xl font-bold mb-4">Voting Leaderboard</h2>
          <p className="text-xl text-muted-foreground">
            Vote for your favorite projects! Each vote costs 10 HOMIE tokens which are burned,
            creating a deflationary mechanism.
          </p>
        </div>
      </section>

      {/* User Stats (if connected) */}
      {isConnected && (
        <section className="container mx-auto px-4 pb-8">
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Your Balance</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{balance} HOMIE</p>
                <Link href="/faucet">
                  <Button variant="link" size="sm" className="px-0">
                    Claim more tokens →
                  </Button>
                </Link>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Your Votes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{userVotes}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Total Votes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{totalVotes}</p>
              </CardContent>
            </Card>
          </div>
        </section>
      )}

      {/* Global Stats (if not connected) */}
      {!isConnected && (
        <section className="container mx-auto px-4 pb-8">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle>Total Votes Cast</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold">{totalVotes}</p>
              <p className="text-sm text-muted-foreground mt-2">
                Connect your wallet to participate
              </p>
            </CardContent>
          </Card>
        </section>
      )}

      {/* Leaderboard */}
      <section className="container mx-auto px-4 pb-20">
        <h3 className="text-2xl font-bold mb-6">Projects Ranked by Votes</h3>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <ProjectCardSkeleton key={i} />
            ))}
          </div>
        ) : rankedProjects.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              No projects have been minted yet
            </p>
            <Link href="/projects">
              <Button>Browse Projects</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rankedProjects.map((project, index) => {
              const voteCount = voteCounts.find(v => v.projectId === project.projectId)?.voteCount || 0;

              return (
                <div key={project.tokenId.toString()} className="relative">
                  {/* Rank Badge */}
                  {index < 3 && (
                    <div className="absolute -top-2 -left-2 z-10 bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-lg">
                      #{index + 1}
                    </div>
                  )}
                  <ProjectCard project={project} />
                </div>
              );
            })}
          </div>
        )}
      </section>
    </PageLayout>
  );
}
