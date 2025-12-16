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

  const colorVariants = [
    'bg-gradient-to-br from-primary/30 to-primary/20 border-primary/50 shadow-md shadow-primary/10',
    'bg-gradient-to-br from-accent/30 to-accent/20 border-accent/50 shadow-md shadow-accent/10',
    'bg-gradient-to-br from-base-green/30 to-base-green/20 border-base-green/50 shadow-md',
    'bg-gradient-to-br from-base-yellow/30 to-base-yellow/20 border-base-yellow/50 shadow-md',
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <Card 
          key={stat.label} 
          className={`p-6 text-center border-2 transition-all duration-300 hover:scale-105 hover:shadow-lg ${colorVariants[index % colorVariants.length]}`}
        >
          <p className="text-sm font-medium mb-2">{stat.label}</p>
          {stat.isLoading ? (
            <Skeleton className="h-9 w-20 mx-auto" />
          ) : (
            <p className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {stat.value}
            </p>
          )}
        </Card>
      ))}
    </div>
  );
}
