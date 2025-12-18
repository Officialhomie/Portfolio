'use client';

/**
 * Projects Gallery Page
 * Browse all projects (GitHub + On-chain NFTs)
 */

import { useState } from 'react';
import { UnifiedProjectGrid } from '@/components/projects/unified-project-grid';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PageLayout } from '@/components/layout/page-layout';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

type ProjectType = 'all' | 'github' | 'onchain';

export default function ProjectsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [projectType, setProjectType] = useState<ProjectType>('all');

  return (
    <PageLayout>
      {/* Page Header */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 md:py-12 max-w-full overflow-x-hidden">
        <div className="max-w-3xl">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4 gradient-text break-words">
            <span className="text-highlight-glow">Projects</span>
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground break-words">
            Explore all my projects from GitHub and on-chain NFTs. <span className="accent-highlight">Vote for your favorites</span> using <span className="accent-highlight">$HOMIE tokens</span>!
          </p>
        </div>
      </section>

      {/* Filters & Search */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 pb-6 sm:pb-8 max-w-full overflow-x-hidden">
        <div className="flex flex-col gap-4">
          {/* Project Type Tabs */}
          <Tabs value={projectType} onValueChange={(v) => setProjectType(v as ProjectType)}>
            <TabsList className="border-gradient">
              <TabsTrigger value="all">All Projects</TabsTrigger>
              <TabsTrigger value="github">GitHub Projects</TabsTrigger>
              <TabsTrigger value="onchain">On-Chain NFTs</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Search */}
          <div className="flex-1 w-full md:max-w-md">
            <Input
              type="text"
              placeholder="Search projects by name, description, or tech stack..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full border-gradient focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>
      </section>

      {/* Projects Grid */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 pb-12 sm:pb-16 md:pb-20 max-w-full overflow-x-hidden">
        <UnifiedProjectGrid
          type={projectType}
          searchQuery={searchQuery}
          onVoteProject={() => {}} // Voting handled in individual components
        />
      </section>
    </PageLayout>
  );
}
