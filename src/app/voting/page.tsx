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
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 md:py-12 max-w-full overflow-x-hidden">
        <div className="max-w-3xl">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4 gradient-text break-words">
            <span className="text-highlight-glow">Voting</span> Leaderboard
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground break-words">
            Vote for your favorite projects! Each vote costs <span className="accent-highlight">10 $HOMIE tokens</span> which are burned,
            creating a <span className="accent-highlight">deflationary mechanism</span>.
          </p>
        </div>
      </section>

      {/* User Stats (if connected) */}
      {isConnected && (
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 pb-6 sm:pb-8 max-w-full overflow-x-hidden">
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl">
            <Card className="border-gradient hover:shadow-lg hover:shadow-primary/20 transition-all duration-300">
              <CardHeader>
                <CardTitle className="text-sm font-medium gradient-text-subtle">Your Balance</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold gradient-text">{balance} $HOMIE</p>
                <Link href="/faucet">
                  <Button variant="link" size="sm" className="px-0">
                    Claim more tokens →
                  </Button>
                </Link>
              </CardContent>
            </Card>
            <Card className="border-gradient hover:shadow-lg hover:shadow-accent/20 transition-all duration-300">
              <CardHeader>
                <CardTitle className="text-sm font-medium gradient-text-subtle">Your Votes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold gradient-text">{userVotes}</p>
              </CardContent>
            </Card>
            <Card className="border-gradient hover:shadow-lg hover:shadow-primary/20 transition-all duration-300">
              <CardHeader>
                <CardTitle className="text-sm font-medium gradient-text-subtle">Total Votes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold gradient-text">{totalVotes}</p>
              </CardContent>
            </Card>
          </div>
        </section>
      )}

      {/* Global Stats (if not connected) */}
      {!isConnected && (
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 pb-6 sm:pb-8 max-w-full overflow-x-hidden">
          <Card className="max-w-md border-gradient hover:shadow-lg hover:shadow-primary/20 transition-all duration-300">
            <CardHeader>
              <CardTitle className="gradient-text-subtle">Total Votes Cast</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold gradient-text">{totalVotes}</p>
              <p className="text-sm text-muted-foreground mt-2">
                Connect your wallet to participate
              </p>
            </CardContent>
          </Card>
        </section>
      )}

      {/* Leaderboard */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 pb-12 sm:pb-16 md:pb-20 max-w-full overflow-x-hidden">
        <h3 className="text-2xl font-bold mb-6 gradient-text">
          Projects <span className="text-highlight-glow">Ranked</span> by Votes
        </h3>

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
                    <div className="absolute -top-2 -left-2 z-10 bg-gradient-to-br from-primary to-accent text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-lg shadow-primary/50 border-2 border-primary/30">
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
