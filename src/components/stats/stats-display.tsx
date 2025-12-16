'use client';

/**
 * Stats Display Component
 * Shows platform statistics using real contract data
 */

import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { usePortfolioToken } from '@/hooks/contracts/usePortfolioToken';
import { useTotalProjects } from '@/hooks/contracts/useProjectNFT';
import { useTotalVisitors } from '@/hooks/contracts/useVisitorBook';
import { useTotalVotes } from '@/hooks/contracts/useProjectVoting';
import { formatLargeNumber } from '@/lib/utils/format';

export function StatsDisplay() {
  const { totalSupply: tokenSupply, isLoading: loadingToken } = usePortfolioToken();
  const { totalProjects, isLoading: loadingProjects } = useTotalProjects();
  const { totalVisitors, isLoading: loadingVisitors } = useTotalVisitors();
  const { totalVotes, isLoading: loadingVotes } = useTotalVotes();

  const stats = [
    {
      label: 'Projects',
      value: totalProjects,
      isLoading: loadingProjects,
    },
    {
      label: 'Total Visitors',
      value: totalVisitors,
      isLoading: loadingVisitors,
    },
    {
      label: 'Votes Cast',
      value: totalVotes,
      isLoading: loadingVotes,
    },
    {
      label: 'HOMIE in Circulation',
      value: formatLargeNumber(parseFloat(tokenSupply)),
      isLoading: loadingToken,
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
      {stats.map((stat) => (
        <Card key={stat.label} className="p-6 text-center">
          <p className="text-sm text-muted-foreground mb-2">{stat.label}</p>
          {stat.isLoading ? (
            <Skeleton className="h-9 w-20 mx-auto" />
          ) : (
            <p className="text-3xl font-bold">{stat.value}</p>
          )}
        </Card>
      ))}
    </div>
  );
}
