'use client';

/**
 * Visitor Book Page
 * On-chain guestbook for visitors
 */

import Link from 'next/link';
import { useVisitorBook, useTotalVisitors } from '@/hooks/contracts/useVisitorBook';
import { VisitorBookForm } from '@/components/visitor-book/visitor-book-form';
import { VisitorList } from '@/components/visitor-book/visitor-list';
import { Card, CardContent } from '@/components/ui/card';
import { PageLayout } from '@/components/layout/page-layout';

export default function VisitorBookPage() {
  const { totalVisitors } = useTotalVisitors();
  const {
    visitors,
    isLoading,
    currentPage,
    totalPages,
    nextPage,
    prevPage,
    hasNextPage,
    hasPrevPage,
    refetch,
  } = useVisitorBook(20);

  return (
    <PageLayout>
      {/* Page Header */}
      <section className="container mx-auto px-4 py-12">
        <div className="max-w-3xl">
          <h2 className="text-4xl font-bold mb-4 gradient-text">
            <span className="text-highlight-glow">Visitor</span> Book
          </h2>
          <p className="text-xl text-muted-foreground mb-4">
            Leave a <span className="accent-highlight">permanent message</span> stored on the blockchain. All messages are <span className="accent-highlight">public and immutable</span>.
          </p>
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 border-gradient p-3 rounded-lg border">
            <span className="font-semibold gradient-text-subtle">💡 Tip:</span>
            <span>Sign the visitor book to leave your mark and mint a limited edition Visit NFT!</span>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="container mx-auto px-4 pb-8">
        <Card className="border-gradient hover:shadow-lg hover:shadow-primary/20 transition-all duration-300">
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2 gradient-text-subtle">Total Visitors</p>
              <p className="text-4xl font-bold gradient-text">{totalVisitors}</p>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Content Grid */}
      <section className="container mx-auto px-4 pb-20">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Form - Left Column (sticky on desktop) */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-24">
              <VisitorBookForm onSuccess={() => refetch()} />
            </div>
          </div>

          {/* Visitor List - Right Column */}
          <div className="lg:col-span-2">
            <VisitorList
              visitors={visitors}
              isLoading={isLoading}
              currentPage={currentPage}
              totalPages={totalPages}
              onNextPage={nextPage}
              onPrevPage={prevPage}
              hasNextPage={hasNextPage}
              hasPrevPage={hasPrevPage}
            />
          </div>
        </div>
      </section>
    </PageLayout>
  );
}
